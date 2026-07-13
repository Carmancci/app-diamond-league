import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MEETINGS } from './lib/season-registry.mjs'
import { readJson } from './lib/atomic-json.mjs'
import { validateDataset } from './lib/validate-meeting.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const directory = path.join(root, 'lib', 'diamond-league', 'generated')
const index = readJson(path.join(directory, 'index.json'))
const meetings = MEETINGS.map((entry) => readJson(path.join(directory, `${entry.slug}.json`)))

if (!index || meetings.some((meeting) => !meeting)) {
  console.error('Dataset incompleto: índice ou arquivo de etapa ausente.')
  process.exit(1)
}

const result = validateDataset(index, meetings)
if (!result.valid) {
  console.error(result.errors.join('\n'))
  process.exit(1)
}

const events = meetings.reduce((sum, meeting) => sum + meeting.events.length, 0)
const athletes = meetings.reduce((sum, meeting) => sum + meeting.events.reduce((count, event) => count + event.results.length, 0), 0)
console.log(`Dataset válido: ${meetings.length} etapas, ${events} provas/listas, ${athletes} linhas de atletas.`)
