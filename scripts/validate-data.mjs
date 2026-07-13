import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'lib', 'diamond-league', 'generated')
const SEASON = 2026
const EXPECTED_SLUGS = [
  'shanghai',
  'xiamen',
  'rabat',
  'rome',
  'stockholm',
  'oslo',
  'doha',
  'paris',
  'eugene',
  'monaco',
  'london',
  'lausanne',
  'silesia',
  'zurich',
  'brussels',
]

const errors = []

function report(condition, message) {
  if (!condition) errors.push(message)
}

function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName)
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    errors.push(`${fileName}: não foi possível ler o JSON (${error.message})`)
    return null
  }
}

function validateResult(result, context) {
  report(result && typeof result === 'object', `${context}: resultado inválido`)
  if (!result || typeof result !== 'object') return
  report(result.rank === null || Number.isInteger(result.rank), `${context}: rank deve ser inteiro ou null`)
  report(typeof result.athlete === 'string' && result.athlete.length > 0, `${context}: atleta ausente`)
  report(typeof result.country === 'string' && /^[A-Z]{3}$/.test(result.country), `${context}: país inválido`)
  report(typeof result.mark === 'string' && result.mark.length > 0, `${context}: marca ausente`)
}

function validateMeeting(meeting, expectedSlug, expectedRound) {
  const context = `${expectedSlug}.json`
  report(meeting && typeof meeting === 'object', `${context}: conteúdo inválido`)
  if (!meeting || typeof meeting !== 'object') return

  report(meeting.id === expectedSlug, `${context}: id deve ser ${expectedSlug}`)
  report(meeting.slug === expectedSlug, `${context}: slug deve ser ${expectedSlug}`)
  report(meeting.round === expectedRound, `${context}: round deve ser ${expectedRound}`)
  report(typeof meeting.name === 'string' && meeting.name.length > 0, `${context}: nome ausente`)
  report(typeof meeting.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meeting.date), `${context}: data inválida`)
  report(Array.isArray(meeting.events), `${context}: events deve ser um array`)
  if (!Array.isArray(meeting.events)) return

  const eventIds = new Set()
  meeting.events.forEach((event, eventIndex) => {
    const eventContext = `${context} evento ${eventIndex + 1}`
    report(typeof event.id === 'string' && event.id.length > 0, `${eventContext}: id ausente`)
    report(!eventIds.has(event.id), `${eventContext}: id duplicado (${event.id})`)
    eventIds.add(event.id)
    report(typeof event.discipline === 'string' && event.discipline.length > 0, `${eventContext}: disciplina ausente`)
    report(event.gender === 'men' || event.gender === 'women', `${eventContext}: gênero inválido`)
    report(Array.isArray(event.results) && event.results.length > 0, `${eventContext}: resultados ausentes`)
    if (Array.isArray(event.results)) {
      event.results.forEach((result, resultIndex) =>
        validateResult(result, `${eventContext}, resultado ${resultIndex + 1}`),
      )
    }
  })
}

const index = readJson('index.json')
report(index?.season === SEASON, `index.json: temporada deve ser ${SEASON}`)
report(Array.isArray(index?.meetings), 'index.json: meetings deve ser um array')

const summaries = Array.isArray(index?.meetings) ? index.meetings : []
report(summaries.length === EXPECTED_SLUGS.length, `index.json: deve conter ${EXPECTED_SLUGS.length} etapas`)

EXPECTED_SLUGS.forEach((slug, indexPosition) => {
  const round = indexPosition + 1
  const meeting = readJson(`${slug}.json`)
  if (meeting) validateMeeting(meeting, slug, round)

  const summary = summaries[indexPosition]
  report(summary?.slug === slug, `index.json: etapa ${round} deve ser ${slug}`)
  report(summary?.round === round, `index.json: round de ${slug} deve ser ${round}`)
  if (summary && meeting?.events) {
    report(summary.eventCount === meeting.events.length, `index.json: eventCount divergente para ${slug}`)
    report(summary.hasResults === (meeting.events.length > 0), `index.json: hasResults divergente para ${slug}`)
  }
})

const summarySlugs = summaries.map((meeting) => meeting.slug)
report(new Set(summarySlugs).size === summarySlugs.length, 'index.json: contém slugs duplicados')
report(summarySlugs.every((slug) => EXPECTED_SLUGS.includes(slug)), 'index.json: contém slug inesperado')

if (errors.length > 0) {
  console.error(`Validação falhou com ${errors.length} erro(s):`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`Dados válidos: temporada ${SEASON}, ${EXPECTED_SLUGS.length} etapas e ${summaries.reduce((total, meeting) => total + meeting.eventCount, 0)} provas.`)
