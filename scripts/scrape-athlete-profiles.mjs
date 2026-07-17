#!/usr/bin/env node
/**
 * Scraper de perfis Diamond League
 *
 * Visita diamondleague.com/athlete/{DL_ID} para cada atleta,
 * extrai DOB, Personal Best e Season Best completos e salva
 * em .athlete-cache/{DL_ID}.json para uso permanente.
 *
 * Uso:
 *   node scripts/scrape-athlete-profiles.mjs            # todos os atletas
 *   node scripts/scrape-athlete-profiles.mjs --limit 50 # primeiros 50
 *   node scripts/scrape-athlete-profiles.mjs --id 14325599 # um atleta específico
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const ID_MAP_FILE = path.join(ROOT, '.dl-id-map.json')

// Garantir diretório de cache
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

// Argumentos
const args = process.argv.slice(2)
const limitArg = args.indexOf('--limit')
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity
const idArg = args.indexOf('--id')
const singleId = idArg >= 0 ? args[idArg + 1] : null
const forceArg = args.includes('--force') // re-scrape mesmo se cache existe

// Carregar mapa de IDs
if (!fs.existsSync(ID_MAP_FILE)) {
  console.error('Arquivo .dl-id-map.json não encontrado. Execute pnpm ingest primeiro.')
  process.exit(1)
}
const idMap = JSON.parse(fs.readFileSync(ID_MAP_FILE, 'utf-8'))

// Filtrar IDs a processar
let entries = Object.entries(idMap)
if (singleId) {
  entries = entries.filter(([id]) => id === singleId)
} else {
  // Pular os que já têm cache, a menos que --force
  if (!forceArg) {
    entries = entries.filter(([id]) => !fs.existsSync(path.join(CACHE_DIR, `${id}.json`)))
  }
  if (isFinite(limit)) entries = entries.slice(0, limit)
}

console.log(`\n[Scraper] ${entries.length} atletas para processar (cache existente: ${Object.keys(idMap).length - entries.length})\n`)

if (entries.length === 0) {
  console.log('Nenhum atleta novo para processar.')
  process.exit(0)
}

/**
 * Extrai dados do perfil via agent-browser
 */
function scrapeAthlete(dlId) {
  const url = `https://www.diamondleague.com/athlete/${dlId}`
  const script = `
    // Aceitar cookies se o modal estiver visível
    const acceptBtn = document.querySelector('button.cmplz-btn.cmplz-accept, button[aria-label*="Accept"], button[id*="accept"]');
    if (acceptBtn) acceptBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // Extrair nome e país
    const name = document.querySelector('h1, h2')?.textContent?.trim() || '';
    const country = document.querySelector('.athlete-country, [class*="country"]')?.textContent?.trim() || '';

    // Extrair data de nascimento
    const bodyText = document.body.innerText;
    const dobMatch = bodyText.match(/(\\d{1,2}\\s+[A-Z]{3}\\s+\\d{4})/);
    const dob = dobMatch ? dobMatch[1] : null;

    // Extrair tabelas de PB e SB
    const tables = document.querySelectorAll('table');
    const pbData = [];
    const sbData = [];
    let currentSection = '';

    // Identificar seções por headings próximos às tabelas
    const allElements = Array.from(document.querySelectorAll('h3, h4, table'));
    allElements.forEach(el => {
      if (el.tagName.match(/H[34]/)) {
        const text = el.textContent.toLowerCase();
        if (text.includes('personal best') || text.includes('personal')) currentSection = 'pb';
        else if (text.includes("season") || text.includes("best")) currentSection = 'sb';
      } else if (el.tagName === 'TABLE') {
        const rows = Array.from(el.querySelectorAll('tr'));
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent.trim());
          if (cells.length >= 2 && cells[0] && cells[1]) {
            const entry = {
              discipline: cells[0],
              mark: cells[1],
              venue: cells[2] || '',
              date: cells[3] || ''
            };
            if (currentSection === 'pb') pbData.push(entry);
            else if (currentSection === 'sb') sbData.push(entry);
          }
        });
      }
    });

    JSON.stringify({ name, country, dob, pbData, sbData });
  `

  try {
    // Usar agent-browser para extrair dados
    const cmd = `agent-browser open "${url}" && agent-browser wait --load networkidle && agent-browser eval '${script.replace(/'/g, '"').replace(/\n\s*/g, ' ')}'`
    const result = execSync(cmd, { timeout: 30000, encoding: 'utf-8', stdio: 'pipe' })

    // Pegar ultima linha que seja JSON valido
    const lines = result.split('\n').filter(l => l.trim().startsWith('{'))
    if (!lines.length) return null

    const data = JSON.parse(lines[lines.length - 1])
    return data
  } catch {
    return null
  }
}

/**
 * Converter data "16 JUL 1994" para "1994-07-16"
 */
function parseDobToIso(raw) {
  if (!raw) return null
  const months = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' }
  const parts = raw.trim().split(/\s+/)
  if (parts.length !== 3) return null
  const [day, monthStr, year] = parts
  const month = months[monthStr.toUpperCase()]
  if (!month) return null
  return `${year}-${month}-${String(day).padStart(2, '0')}`
}

// Estatísticas
let success = 0
let failed = 0
let withDob = 0
let withPb = 0

for (let i = 0; i < entries.length; i++) {
  const [dlId, info] = entries[i]
  const pct = `[${i + 1}/${entries.length}]`
  process.stdout.write(`${pct} ${info.athlete.padEnd(30)} `)

  const raw = scrapeAthlete(dlId)

  if (!raw) {
    console.log('FALHOU')
    failed++
    // Salvar registro vazio para nao tentar de novo
    fs.writeFileSync(
      path.join(CACHE_DIR, `${dlId}.json`),
      JSON.stringify({ dlId, athleteId: info.athleteId, scrapedAt: new Date().toISOString(), error: 'scrape_failed' }, null, 2)
    )
    continue
  }

  const dobIso = parseDobToIso(raw.dob)
  const pbMap = {}
  const sbMap = {}

  raw.pbData?.forEach(entry => {
    if (entry.discipline && entry.mark) {
      // Normalizar nome da modalidade (remover "Women's"/"Men's")
      const discipline = entry.discipline.replace(/^(Women's|Men's)\s+/i, '').trim()
      pbMap[discipline] = { mark: entry.mark, venue: entry.venue, date: entry.date }
    }
  })

  raw.sbData?.forEach(entry => {
    if (entry.discipline && entry.mark) {
      const discipline = entry.discipline.replace(/^(Women's|Men's)\s+/i, '').trim()
      sbMap[discipline] = { mark: entry.mark, venue: entry.venue, date: entry.date }
    }
  })

  const cacheEntry = {
    dlId,
    athleteId: info.athleteId,
    athlete: raw.name || info.athlete,
    country: info.country,
    dob: dobIso,
    pb: pbMap,
    sb: sbMap,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
  }

  fs.writeFileSync(path.join(CACHE_DIR, `${dlId}.json`), JSON.stringify(cacheEntry, null, 2))

  success++
  if (dobIso) withDob++
  if (Object.keys(pbMap).length > 0) withPb++

  const status = [dobIso ? `DOB: ${dobIso}` : 'no DOB', `PB: ${Object.keys(pbMap).length}`, `SB: ${Object.keys(sbMap).length}`].join(' | ')
  console.log(`OK — ${status}`)

  // Throttle para respeitar o servidor
  if (i < entries.length - 1) await new Promise(r => setTimeout(r, 800))
}

console.log(`\n${'='.repeat(60)}`)
console.log(`Concluido: ${success} ok, ${failed} falhas`)
console.log(`DOB encontrado: ${withDob}/${success} (${success ? ((withDob / success) * 100).toFixed(1) : 0}%)`)
console.log(`PB encontrado: ${withPb}/${success} (${success ? ((withPb / success) * 100).toFixed(1) : 0}%)`)
console.log(`Cache em: ${CACHE_DIR}`)
console.log('='.repeat(60))
console.log('\nExecute agora: node scripts/apply-athlete-cache.mjs\n')
