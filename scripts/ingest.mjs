import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MEETINGS, SEASON, officialJsonUrl, officialPdfUrl } from './lib/season-registry.mjs'
import { fetchOfficialJson } from './lib/official-source.mjs'
import { NORMALIZER_VERSION, normalizeOfficialMeeting, sportsFingerprint } from './lib/normalize-official.mjs'
import { validateMeeting } from './lib/validate-meeting.mjs'
import { readJson, writeJsonAtomic } from './lib/atomic-json.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(root, 'lib', 'diamond-league', 'generated')
const argumentsList = process.argv.slice(2)
const checkOnly = argumentsList.includes('--check')
const requestedSlug = argumentsList.find((argument) => !argument.startsWith('--'))
const entries = requestedSlug ? MEETINGS.filter((entry) => entry.slug === requestedSlug) : MEETINGS

if (!entries.length) {
  console.error(`Etapa "${requestedSlug}" não encontrada no registro ${SEASON}.`)
  process.exit(1)
}

function awaitingMeeting(entry) {
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
    timezone: entry.timezone,
    isFinal: entry.isFinal ?? false,
    officialUrl: `https://${entry.slug}.diamondleague.com`,
    state: 'aguardando_fonte',
    source: null,
    updatedAt: null,
    eventCount: 0,
    athleteCount: 0,
    events: [],
  }
}

function summary(meeting) {
  const resultEvents = meeting.events.filter((event) => event.listType?.startsWith('resultados') || (!event.listType && event.results.length))
  return {
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
    state: meeting.state ?? (meeting.events.length ? 'confirmado_oficial' : 'aguardando_fonte'),
    hasResults: resultEvents.some((event) => event.results.length > 0),
    eventCount: meeting.events.length,
    athleteCount: meeting.events.reduce((total, event) => total + event.results.length, 0),
    updatedAt: meeting.updatedAt ?? null,
  }
}

console.log(`\nAtualização oficial Diamond League ${SEASON} — ${entries.length} etapa(s)${checkOnly ? ' [verificação]' : ''}\n`)
let failures = 0
let changes = 0

for (const entry of entries) {
  const destination = path.join(outputDirectory, `${entry.slug}.json`)
  const previous = readJson(destination)
  const url = officialJsonUrl(entry.slug)
  process.stdout.write(`• ${entry.name.padEnd(20)} `)
  const response = await fetchOfficialJson(url)

  if (response.kind === 'not-published') {
    if (!previous && !checkOnly) writeJsonAtomic(destination, awaitingMeeting(entry))
    console.log('aguardando publicação oficial; último dado válido preservado')
    continue
  }
  if (response.kind === 'failure') {
    failures += 1
    console.log(`falha de coleta (${response.error}); último dado válido preservado`)
    continue
  }

  const collectedAt = new Date().toISOString()
  let meeting
  try {
    meeting = normalizeOfficialMeeting(response.raw, entry, {
      type: 'swiss_timing_json',
      url,
      pdfUrl: officialPdfUrl(entry.slug),
      checksum: response.checksum,
      collectedAt,
      parserVersion: NORMALIZER_VERSION,
      state: 'confirmado_oficial',
    })
  } catch (error) {
    failures += 1
    console.log(`feed incompatível (${error instanceof Error ? error.message : String(error)}); preservado`)
    continue
  }

  const validation = validateMeeting(meeting, previous)
  if (!validation.valid) {
    failures += 1
    console.log(`dados rejeitados: ${validation.errors.join(' | ')}; preservado`)
    continue
  }

  if (previous && sportsFingerprint(previous) === sportsFingerprint(meeting)) {
    console.log(`sem mudança esportiva (${validation.counts.events} provas, ${validation.counts.athletes} linhas)`)
    continue
  }

  changes += 1
  console.log(`${checkOnly ? 'mudança detectada' : 'atualizado'} — ${validation.counts.events} provas, ${validation.counts.athletes} linhas`)
  if (!checkOnly) writeJsonAtomic(destination, meeting)
}

if (!checkOnly) {
  const meetings = MEETINGS.map((entry) => readJson(path.join(outputDirectory, `${entry.slug}.json`)) ?? awaitingMeeting(entry))
  const index = { season: SEASON, generatedAt: new Date().toISOString(), meetings: meetings.map(summary) }
  const indexPath = path.join(outputDirectory, 'index.json')
  const previousIndex = readJson(indexPath)
  const comparable = (value) => JSON.stringify({ season: value?.season, meetings: value?.meetings })
  if (comparable(previousIndex) !== comparable(index)) writeJsonAtomic(indexPath, index)
}

console.log(`\nResumo: ${changes} alteração(ões), ${failures} falha(s).\n`)
if (failures) process.exitCode = 1
if (checkOnly && changes) process.exitCode = 2
