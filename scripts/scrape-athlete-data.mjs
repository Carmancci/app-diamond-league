#!/usr/bin/env node
/**
 * Scraper simplificado de perfis Diamond League
 *
 * Coleta DOB, PB e SB de atletas via diamondleague.com API/HTML
 * e salva em cache para aplicação posterior nos JSONs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const ID_MAP_FILE = path.join(ROOT, '.dl-id-map.json')

// Criar diretório de cache
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Carregar mapa de IDs
if (!fs.existsSync(ID_MAP_FILE)) {
  console.error('Arquivo .dl-id-map.json não encontrado. Execute pnpm ingest primeiro.')
  process.exit(1)
}

const idMap = JSON.parse(fs.readFileSync(ID_MAP_FILE, 'utf-8'))

// Argumentos
const args = process.argv.slice(2)
const limitArg = args.indexOf('--limit')
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : 10 // default: 10
const forceArg = args.includes('--force')

// Filtrar IDs a processar
let entries = Object.entries(idMap)

// Pular os que já têm cache
if (!forceArg) {
  entries = entries.filter(([id]) => !fs.existsSync(path.join(CACHE_DIR, `${id}.json`)))
}

if (Number.isFinite(limit)) {
  entries = entries.slice(0, limit)
}

console.log(`\n[Scraper] ${entries.length} atletas para processar\n`)

if (entries.length === 0) {
  console.log('Nenhum atleta novo para processar.')
  process.exit(0)
}

/**
 * Extrair dados de um perfil de atleta
 */
async function scrapeAthleteProfile(dlId) {
  const url = `https://www.diamondleague.com/athlete/${dlId}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // Extrair data de nascimento (formato: "16 JUL 1994")
    const dobMatch = html.match(/(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i)
    const dob = dobMatch ? `${dobMatch[3]}-${getMonthNumber(dobMatch[2])}-${String(dobMatch[1]).padStart(2, '0')}` : null

    // Extrair país
    const countryMatch = html.match(/country['"]\s*:\s*['"]([A-Z]{3})['"]/i) || html.match(/<span[^>]*class="athlete-country"[^>]*>([A-Z]{3})</i)
    const country = countryMatch ? countryMatch[1] : null

    // Extrair nome
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) || html.match(/<title>([^|]+)<\/title>/)
    const name = nameMatch ? nameMatch[1].trim() : null

    // Extrair Personal Best (tabela)
    const pbMap = extractMarksFromHtml(html, 'Personal Best')

    // Extrair Season Best (tabela)
    const sbMap = extractMarksFromHtml(html, 'Season Best')

    return {
      dob,
      country,
      name,
      pb: pbMap,
      sb: sbMap,
    }
  } catch (error) {
    console.error(`  Erro ao buscar ${dlId}:`, error.message)
    return null
  }
}

/**
 * Extrair modalidades e marcas de uma tabela no HTML
 */
function extractMarksFromHtml(html, sectionName) {
  const marks = {}

  // Procurar por seção que contenha "Personal Best" ou "Season Best"
  const sectionRegex = new RegExp(
    `${sectionName}[\\s\\S]*?<table[\\s\\S]*?</table>`,
    'i'
  )
  const sectionMatch = html.match(sectionRegex)

  if (!sectionMatch) return marks

  const section = sectionMatch[0]

  // Extrair linhas da tabela
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi
  const rows = section.match(rowRegex) || []

  rows.forEach((row) => {
    const cells = row.match(/<td[^>]*>([^<]+)<\/td>/gi) || []
    if (cells.length >= 2) {
      const discipline = cells[0].replace(/<td[^>]*>/, '').replace(/<\/td>/i, '').trim()
      const mark = cells[1].replace(/<td[^>]*>/, '').replace(/<\/td>/i, '').trim()

      if (discipline && mark && !mark.match(/^\s*-\s*$/)) {
        // Normalizar nome da modalidade
        const normalizedDiscipline = discipline.replace(/^(Women's|Men's)\s+/i, '').trim()
        marks[normalizedDiscipline] = mark
      }
    }
  })

  return marks
}

/**
 * Converter mês abreviado para número
 */
function getMonthNumber(monthStr) {
  const months = {
    JAN: '01',
    FEB: '02',
    MAR: '03',
    APR: '04',
    MAY: '05',
    JUN: '06',
    JUL: '07',
    AUG: '08',
    SEP: '09',
    OCT: '10',
    NOV: '11',
    DEC: '12',
  }
  return months[monthStr.toUpperCase()] || '01'
}

// Executar scraping
let success = 0
let failed = 0
let withDob = 0
let withPb = 0

for (let i = 0; i < entries.length; i++) {
  const [dlId, info] = entries[i]
  const pct = `[${String(i + 1).padStart(String(entries.length).length, ' ')}/${entries.length}]`

  process.stdout.write(`${pct} ${info.athlete.padEnd(40)} `)

  const data = await scrapeAthleteProfile(dlId)

  if (!data) {
    console.log('FALHOU')
    failed++
    fs.writeFileSync(
      path.join(CACHE_DIR, `${dlId}.json`),
      JSON.stringify({
        dlId,
        athleteId: info.athleteId,
        scrapedAt: new Date().toISOString(),
        error: 'scrape_failed',
      }, null, 2)
    )
    continue
  }

  const cacheEntry = {
    dlId,
    athleteId: info.athleteId,
    athlete: data.name || info.athlete,
    country: data.country || info.country,
    dob: data.dob,
    pb: data.pb,
    sb: data.sb,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
  }

  fs.writeFileSync(path.join(CACHE_DIR, `${dlId}.json`), JSON.stringify(cacheEntry, null, 2))

  success++
  if (data.dob) withDob++
  if (Object.keys(data.pb || {}).length > 0) withPb++

  const pbCount = Object.keys(data.pb || {}).length
  const sbCount = Object.keys(data.sb || {}).length
  const status = [data.dob ? 'DOB✓' : 'DOB✗', `PB:${pbCount}`, `SB:${sbCount}`].join(' | ')
  console.log(status)

  // Throttle
  if (i < entries.length - 1) {
    await new Promise((r) => setTimeout(r, 500))
  }
}

console.log(`\n${'='.repeat(70)}`)
console.log(`Resultado: ${success} sucesso, ${failed} falhas`)
console.log(`DOB encontrado: ${withDob}/${success} (${success ? ((withDob / success) * 100).toFixed(1) : 0}%)`)
console.log(`PB encontrado: ${withPb}/${success} (${success ? ((withPb / success) * 100).toFixed(1) : 0}%)`)
console.log(`Cache salvo em: ${CACHE_DIR}`)
console.log(`${'='.repeat(70)}\n`)
