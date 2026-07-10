/**
 * Injeta os PROGRAMAS oficiais (disciplinas agendadas) das etapas futuras da
 * Wanda Diamond League 2026 nos respectivos JSON gerados.
 *
 * Fonte: cronogramas oficiais de cada meeting (diamondleague.com e sites locais).
 * As provas entram com `results: []` — serão preenchidas quando o boletim sair.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEN = path.join(__dirname, '..', 'lib', 'diamond-league', 'generated')

/** disciplina -> categoria (mesma nomenclatura dos dados já ingeridos) */
const CATEGORY = {
  '100m': 'sprints',
  '200m': 'sprints',
  '400m': 'sprints',
  '800m': 'middle',
  '1000m': 'middle',
  '1500m': 'middle',
  '1 Mile': 'middle',
  '3000m': 'distance',
  '5000m': 'distance',
  '3000m Steeplechase': 'distance',
  '100m Hurdles': 'hurdles',
  '110m Hurdles': 'hurdles',
  '400m Hurdles': 'hurdles',
  'High Jump': 'jumps',
  'Pole Vault': 'jumps',
  'Long Jump': 'jumps',
  'Triple Jump': 'jumps',
  'Shot Put': 'throws',
  'Discus Throw': 'throws',
  'Javelin Throw': 'throws',
  'Hammer Throw': 'throws',
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Programas oficiais: { men: [...], women: [...] } */
const PROGRAMS = {
  monaco: {
    men: ['100m', '400m', '1000m', '5000m', '3000m Steeplechase', 'Long Jump', 'High Jump'],
    women: ['200m', '400m', '3000m', '100m Hurdles', 'Pole Vault', 'Triple Jump', 'Javelin Throw'],
  },
  london: {
    men: ['100m', '400m', '800m', '1 Mile', '110m Hurdles', '400m Hurdles', 'Pole Vault'],
    women: ['200m', '400m', '800m', '3000m', 'High Jump', 'Long Jump', 'Discus Throw'],
  },
  lausanne: {
    men: ['200m', '800m', '5000m', '110m Hurdles', '400m Hurdles', 'Long Jump', 'Triple Jump', 'Javelin Throw'],
    women: ['200m', '800m', '3000m Steeplechase', '100m Hurdles', '400m Hurdles', 'Pole Vault', 'Javelin Throw'],
  },
  silesia: {
    men: ['100m', '400m', '1500m', '110m Hurdles', '400m Hurdles', '3000m Steeplechase', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus Throw', 'Hammer Throw'],
    women: ['100m', '400m', '1500m', '5000m', '100m Hurdles', 'High Jump', 'Long Jump', 'Triple Jump', 'Shot Put', 'Hammer Throw'],
  },
  zurich: {
    men: ['200m', '1500m', '3000m', '110m Hurdles', '400m Hurdles', 'Pole Vault', 'Long Jump', 'Shot Put', 'Javelin Throw'],
    women: ['100m', '800m', '100m Hurdles', '400m Hurdles', '3000m Steeplechase', 'High Jump', 'Pole Vault'],
  },
  brussels: {
    men: ['100m', '200m', '400m', '800m', '1500m', '5000m', '3000m Steeplechase', '110m Hurdles', '400m Hurdles', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump', 'Shot Put', 'Discus Throw', 'Javelin Throw'],
    women: ['100m', '200m', '400m', '800m', '1500m', '5000m', '3000m Steeplechase', '100m Hurdles', '400m Hurdles', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump', 'Shot Put', 'Discus Throw', 'Javelin Throw'],
  },
}

function buildEvents(slug, program) {
  const events = []
  for (const gender of ['men', 'women']) {
    for (const discipline of program[gender] ?? []) {
      const category = CATEGORY[discipline]
      if (!category) {
        console.warn(`  ! sem categoria para "${discipline}" (${slug})`)
        continue
      }
      events.push({
        id: `${slug}-${slugify(discipline)}-${gender}`,
        discipline,
        category,
        gender,
        isPrimary: true,
        results: [],
      })
    }
  }
  return events
}

let total = 0
for (const [slug, program] of Object.entries(PROGRAMS)) {
  const file = path.join(GEN, `${slug}.json`)
  if (!fs.existsSync(file)) {
    console.warn(`arquivo não encontrado: ${slug}.json`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const events = buildEvents(slug, program)
  data.events = events
  data.hasProgram = true
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  total += events.length
  console.log(`${slug.padEnd(12)} → ${events.length} provas no programa`)
}
console.log(`\nTotal: ${total} provas de programa injetadas.`)
