// @ts-nocheck
/**
 * Ingestão dos dados oficiais da Wanda Diamond League 2026.
 *
 * Fonte primária: PDFs oficiais de resultados do Swiss Timing (ps-cache).
 * O script baixa cada PDF, converte para texto, normaliza para JSON limpo
 * e grava em lib/diamond-league/generated/.
 *
 * Uso:  node scripts/ingest.mjs [slug]
 *   - sem argumento: processa todas as etapas do registro
 *   - com slug:      processa apenas aquela etapa (ex.: node scripts/ingest.mjs paris)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { parseResultsText } from './lib/parse-pdf.mjs'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'lib', 'diamond-league', 'generated')

const SEASON = 2026
const PS_BASE = 'https://ps-cache.web.swisstiming.com/node/binaryData/ATH_PROD'
const pdfUrl = (code) =>
  `${PS_BASE}/${code}/PDF_ATH-------------------------------_MUL.PDF`

/**
 * Registro do calendário 2026 (15 etapas). `code` é o identificador do
 * Swiss Timing usado na URL do PDF; etapas futuras têm code=null e ficam
 * sem resultados até serem disputadas.
 */
const REGISTRY = [
  { round: 1, slug: 'shanghai', code: 'SHANGHAI_2026', name: 'Shanghai', city: 'Xangai', country: 'CHN', countryName: 'China', stadium: 'Shanghai Stadium', date: '2026-05-16' },
  { round: 2, slug: 'xiamen', code: 'XIAMEN_2026', name: 'Xiamen', city: 'Xiamen', country: 'CHN', countryName: 'China', stadium: 'Egret Stadium', date: '2026-05-23' },
  { round: 3, slug: 'rabat', code: 'RABAT_2026', name: 'Rabat', city: 'Rabat', country: 'MAR', countryName: 'Marrocos', stadium: 'Prince Moulay Abdellah', date: '2026-05-31' },
  { round: 4, slug: 'rome', code: 'ROME_2026', name: 'Roma', city: 'Roma', country: 'ITA', countryName: 'Itália', stadium: 'Stadio Olimpico', date: '2026-06-04' },
  { round: 5, slug: 'stockholm', code: 'STOCKHOLM_2026', name: 'Estocolmo', city: 'Estocolmo', country: 'SWE', countryName: 'Suécia', stadium: 'Olympic Stadium', date: '2026-06-07' },
  { round: 6, slug: 'oslo', code: 'OSLO_2026', name: 'Oslo', city: 'Oslo', country: 'NOR', countryName: 'Noruega', stadium: 'Bislett Stadion', date: '2026-06-10' },
  { round: 7, slug: 'doha', code: 'DOHA_2026', name: 'Doha', city: 'Doha', country: 'QAT', countryName: 'Catar', stadium: 'Suheim Bin Hamad', date: '2026-06-19' },
  { round: 8, slug: 'paris', code: 'PARIS_2026', name: 'Paris', city: 'Paris', country: 'FRA', countryName: 'França', stadium: 'Stade Charléty', date: '2026-06-28' },
  { round: 9, slug: 'eugene', code: 'EUGENE_2026', name: 'Eugene', city: 'Eugene', country: 'USA', countryName: 'Estados Unidos', stadium: 'Hayward Field', date: '2026-07-04' },
  { round: 10, slug: 'monaco', code: 'MONACO_2026', name: 'Mônaco', city: 'Mônaco', country: 'MON', countryName: 'Mônaco', stadium: 'Stade Louis II', date: '2026-07-10' },
  { round: 11, slug: 'london', code: 'LONDON_2026', name: 'Londres', city: 'Londres', country: 'GBR', countryName: 'Reino Unido', stadium: 'London Stadium', date: '2026-07-18' },
  { round: 12, slug: 'lausanne', code: 'LAUSANNE_2026', name: 'Lausanne', city: 'Lausanne', country: 'SUI', countryName: 'Suíça', stadium: 'Stade de la Pontaise', date: '2026-08-21' },
  { round: 13, slug: 'silesia', code: 'SILESIA_2026', name: 'Silésia', city: 'Chorzów', country: 'POL', countryName: 'Polônia', stadium: 'Silesian Stadium', date: '2026-08-23' },
  { round: 14, slug: 'zurich', code: 'ZURICH_2026', name: 'Zurique', city: 'Zurique', country: 'SUI', countryName: 'Suíça', stadium: 'Letzigrund', date: '2026-08-27' },
  { round: 15, slug: 'brussels', code: 'BRUSSELS_2026', name: 'Final de Bruxelas', city: 'Bruxelas', country: 'BEL', countryName: 'Bélgica', stadium: 'King Baudouin', date: '2026-09-04', endDate: '2026-09-05', isFinal: true },
]

async function downloadPdf(code) {
  const res = await fetch(pdfUrl(code), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DLStats/1.0)' },
  })
  if (!res.ok) return null
  const buf = Buffer.from(await res.arrayBuffer())
  // PDFs válidos começam com "%PDF"
  if (buf.length < 1000 || buf.subarray(0, 4).toString() !== '%PDF') return null
  return buf
}

async function extractText(buf) {
  const parser = new PDFParse({ data: new Uint8Array(buf) })
  const res = await parser.getText()
  return res.text
}

function readExistingMeeting(slug) {
  const filePath = path.join(OUT_DIR, `${slug}.json`)
  if (!fs.existsSync(filePath)) return null

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`JSON existente inválido para ${slug}: ${err.message}`)
  }
}

function createBaseMeeting(entry, existing) {
  return {
    id: entry.slug,
    slug: entry.slug,
    round: entry.round,
    name: entry.name,
    city: entry.city,
    country: entry.country,
    countryName: entry.countryName,
    stadium: entry.stadium,
    date: entry.date,
    endDate: entry.endDate,
    isFinal: entry.isFinal ?? false,
    officialUrl: `https://${entry.slug}.diamondleague.com`,
    source: existing?.source ?? null,
    updatedAt: existing?.updatedAt ?? null,
    events: existing?.events ?? [],
  }
}

function comparableResults(meeting) {
  return JSON.stringify({ source: meeting.source, events: meeting.events })
}

async function ingestMeeting(entry) {
  const existing = readExistingMeeting(entry.slug)
  const base = createBaseMeeting(entry, existing)

  if (!entry.code) return base

  process.stdout.write(`• ${entry.name.padEnd(16)} `)
  let buf = null
  try {
    buf = await downloadPdf(entry.code)
  } catch (err) {
    console.log(`falha no download; dados anteriores preservados (${err.message})`)
    return base
  }

  if (!buf) {
    console.log('sem PDF publicado; dados anteriores preservados')
    return base
  }

  try {
    const text = await extractText(buf)
    const eventIdCounts = new Map()
    const events = parseResultsText(text).map((event) => {
      const baseId = `${entry.slug}-${event.discipline}-${event.gender}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const occurrence = (eventIdCounts.get(baseId) ?? 0) + 1
      eventIdCounts.set(baseId, occurrence)

      return {
        id: occurrence === 1 ? baseId : `${baseId}-${occurrence}`,
        ...event,
      }
    })

    if (events.length === 0) {
      console.log('PDF sem resultados reconhecidos; dados anteriores preservados')
      return base
    }

    const candidate = {
      ...base,
      source: { type: 'pdf', url: pdfUrl(entry.code) },
      events,
    }
    const changed = comparableResults(candidate) !== comparableResults(base)
    candidate.updatedAt = changed ? new Date().toISOString() : base.updatedAt

    const athletes = events.reduce((total, event) => total + event.results.length, 0)
    console.log(`${changed ? 'atualizado' : 'sem alterações'} — ${events.length} provas, ${athletes} resultados`)
    return candidate
  } catch (err) {
    console.log(`falha ao converter PDF; dados anteriores preservados (${err.message})`)
    return base
  }
}

async function main() {
  const only = process.argv[2]
  const entries = only ? REGISTRY.filter((r) => r.slug === only) : REGISTRY
  if (entries.length === 0) {
    console.error(`Etapa "${only}" não encontrada no registro.`)
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log(`\nIngestão Diamond League ${SEASON} — ${entries.length} etapa(s)\n`)
  const index = []

  for (const entry of entries) {
    const meeting = await ingestMeeting(entry)
    fs.writeFileSync(
      path.join(OUT_DIR, `${entry.slug}.json`),
      JSON.stringify(meeting, null, 2),
    )
    index.push({
      slug: meeting.slug,
      round: meeting.round,
      name: meeting.name,
      city: meeting.city,
      country: meeting.country,
      countryName: meeting.countryName,
      stadium: meeting.stadium,
      date: meeting.date,
      endDate: meeting.endDate ?? null,
      isFinal: meeting.isFinal,
      hasResults: meeting.events.length > 0,
      eventCount: meeting.events.length,
    })
  }

  // Regrava o índice inteiro apenas quando processamos tudo; caso contrário faz merge.
  const indexPath = path.join(OUT_DIR, 'index.json')
  let finalIndex = index
  if (only && fs.existsSync(indexPath)) {
    const prev = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    const prevMeetings = Array.isArray(prev) ? prev : (prev.meetings ?? [])
    const map = new Map(prevMeetings.map((m) => [m.slug, m]))
    for (const m of index) map.set(m.slug, m)
    finalIndex = [...map.values()].sort((a, b) => a.round - b.round)
  }
  fs.writeFileSync(indexPath, JSON.stringify({ season: SEASON, meetings: finalIndex }, null, 2))

  console.log(`\nConcluído. JSON salvo em lib/diamond-league/generated/\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
