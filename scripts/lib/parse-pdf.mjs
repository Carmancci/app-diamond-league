/**
 * Parser dos PDFs oficiais de resultados da Wanda Diamond League
 * (serviço de cronometragem Swiss Timing / ps-cache).
 *
 * O texto extraído segue um formato tabular muito regular:
 *   <Disciplina> <Gênero>
 *   Start Time: 18:20   Wind: +0.1 m/s
 *   Rank  Name  Nat  Date of Birth  Sport Class  Lane/Order  [Reaction]  Result
 *   1  BROMELL Trayvon  USA  10 JUL 1995  8  0.131  SB  9.91
 *
 * As colunas por vezes ficam "grudadas" (ex.: "HUDSON-SMITH Matthew GBR"),
 * por isso a extração é baseada em âncoras (data de nascimento + código do país)
 * em vez de depender apenas dos tabs.
 */

const DISCIPLINES = [
  '4x100m Relay',
  '4x400m Relay',
  '100m Hurdles',
  '110m Hurdles',
  '400m Hurdles',
  '3000m Steeplechase',
  '2000m Steeplechase',
  '100m',
  '150m',
  '200m',
  '300m',
  '400m',
  '600m',
  '800m',
  '1000m',
  '1500m',
  '2000m',
  '3000m',
  '5000m',
  '10000m',
  'One Mile',
  'Mile',
  'High Jump',
  'Pole Vault',
  'Long Jump',
  'Triple Jump',
  'Shot Put',
  'Discus Throw',
  'Discus',
  'Hammer Throw',
  'Hammer',
  'Javelin Throw',
  'Javelin',
]

// Ordena por comprimento decrescente para casar "100m Hurdles" antes de "100m".
const DISCIPLINE_ALTERNATION = [...DISCIPLINES]
  .sort((a, b) => b.length - a.length)
  .map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

const EVENT_HEADER_RE = new RegExp(
  `^(${DISCIPLINE_ALTERNATION})\\s+(Men|Women)(?:\\b|\\t|$)`,
  'i',
)

const DOB_RE = /\b(\d{1,2}\s+[A-Z]{3}\s+\d{4})\b/
const NAT_BEFORE_DOB_RE = /\b([A-Z]{3})\s+\d{1,2}\s+[A-Z]{3}\s+\d{4}\b/
const REACTION_RE = /\b(0\.\d{2,3})\b/

// Notas de performance reconhecidas (mundiais, de área, nacionais, de reunião, etc.)
const NOTE_TOKENS = new Set([
  'WR', 'AR', 'NR', 'NU23R', 'NJR', 'WJR', 'WU20R', 'AU20R',
  'PB', 'SB', 'WL', 'ML', 'MR', 'DLR', 'CR', 'GR', '=PB', '=SB',
  '=NR', '=MR', '=CR', '=WR', '=AR', 'EL', 'WBP',
])

const NOISE_PREFIXES = [
  'Wanda Diamond League',
  'Result lists',
  'Website:',
  'printed at',
  'TIMING',
  'DISTANCE MEASUREMENT',
  'REVISED',
  'Intermediate times',
  'Page ',
  '-- ',
  'Legend',
  'Records',
]

function isNoise(line) {
  return NOISE_PREFIXES.some((p) => line.startsWith(p))
}

function categoryFor(discipline) {
  const d = discipline.toLowerCase()
  if (d.includes('hurdles')) return 'hurdles'
  if (d.includes('steeplechase')) return 'distance'
  if (/^(100m|150m|200m|300m|400m|4x100m|4x400m)/.test(d)) return 'sprints'
  if (/^(600m|800m|1000m|1500m|mile|one mile)/.test(d)) return 'middle'
  if (/^(2000m|3000m|5000m|10000m)/.test(d)) return 'distance'
  if (d.includes('jump') || d.includes('vault')) return 'jumps'
  if (
    d.includes('put') ||
    d.includes('discus') ||
    d.includes('hammer') ||
    d.includes('javelin')
  )
    return 'throws'
  return 'middle'
}

function normalizeDiscipline(raw) {
  const map = {
    Discus: 'Discus Throw',
    Hammer: 'Hammer Throw',
    Javelin: 'Javelin Throw',
    Mile: 'One Mile',
  }
  return map[raw] || raw
}

/** Extrai um atleta a partir de uma linha de resultado. Retorna null se não for uma linha de resultado. */
function parseAthleteRow(rawLine) {
  const line = rawLine.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim()
  const dobMatch = line.match(DOB_RE)
  const natMatch = line.match(NAT_BEFORE_DOB_RE)
  // Uma linha de resultado válida precisa de país + data de nascimento.
  if (!dobMatch || !natMatch) return null

  const nat = natMatch[1]
  const dob = dobMatch[1]
  const natIdx = line.indexOf(`${nat} ${dob}`)

  // Rank + nome ficam antes do país.
  const head = line.slice(0, natIdx).trim()
  const rankMatch = head.match(/^(\d+)\b/)
  const rank = rankMatch ? Number.parseInt(rankMatch[1], 10) : null
  let name = head
    .replace(/^\(PM\)\s*/, '')
    .replace(/^\d+\s*/, '')
    .replace(/^=?\s*/, '')
    .trim()

  // Cauda depois da data de nascimento: sport class, lane/order, reaction, notas, resultado.
  const tail = line.slice(natIdx + `${nat} ${dob}`.length).trim()
  const tailTokens = tail.split(' ').filter(Boolean)

  let reaction
  const notes = []
  let resultToken

  // O resultado é o último token que parece uma marca/tempo/altura ou um status.
  for (let i = tailTokens.length - 1; i >= 0; i--) {
    const tk = tailTokens[i]
    if (resultToken === undefined) {
      resultToken = tk
      continue
    }
    if (NOTE_TOKENS.has(tk)) {
      notes.unshift(tk)
      continue
    }
    if (REACTION_RE.test(tk) && reaction === undefined) {
      reaction = tk
      continue
    }
    // demais tokens (sport class, lane, order) são ignorados
  }

  if (!resultToken) return null

  // Alguns status vêm colados a notas de amarelo/regras (YC, TR7.1). Normaliza.
  const isStatus = /^(DNF|DNS|DQ|NM|r)$/i.test(resultToken)
  const mark = resultToken

  return {
    rank,
    athlete: name,
    country: nat,
    dob,
    reaction: reaction ? Number.parseFloat(reaction) : undefined,
    note: notes.length ? notes.join(' ') : undefined,
    mark,
    status: isStatus ? resultToken.toUpperCase() : undefined,
  }
}

/**
 * Recebe o texto extraído do PDF e devolve a lista de eventos com resultados.
 */
export function parseResultsText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+$/,'').replace(/^\s+/, ''))
    .filter((l) => l.length > 0)

  const events = []
  let current = null

  const pushCurrent = () => {
    if (current && current.results.length > 0) events.push(current)
    current = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isNoise(line)) continue

    // Cabeçalho de evento? (às vezes duplicado: "Pole Vault Women\tPole Vault Women")
    const headerCandidate = line.split('\t')[0].trim()
    const headerMatch = headerCandidate.match(EVENT_HEADER_RE)
    if (headerMatch) {
      pushCurrent()
      const disciplineRaw = headerMatch[1]
      const gender = headerMatch[2].toLowerCase() === 'men' ? 'men' : 'women'
      // Preserva capitalização original das disciplinas com "m" minúsculo.
      const disciplineClean = normalizeDiscipline(disciplineRaw.trim())
      current = {
        discipline: disciplineClean,
        category: categoryFor(disciplineClean),
        gender,
        phase: undefined,
        isPrimary: true,
        wind: undefined,
        startTime: undefined,
        results: [],
      }
      continue
    }

    if (!current) continue

    if (line.includes('Start Time:')) {
      const st = line.match(/Start Time:\s*([0-9]{1,2}:[0-9]{2})/)
      const wind = line.match(/Wind:\s*([+-]?\d+(?:\.\d+)?\s*m\/s)/)
      if (st) current.startTime = st[1]
      if (wind) current.wind = wind[1].replace(/\s+/g, ' ')
      // Rótulo de fase antes de "Start Time:" (ex.: "Final", "Heat 1", "Round 1", "B", "C").
      const phaseRaw = line.split('Start Time:')[0].replace(/\t/g, ' ').trim()
      if (phaseRaw) {
        current.phase = phaseRaw
        current.isPrimary = /^(final|a)$/i.test(phaseRaw)
      }
      continue
    }

    if (/^Rank\b/.test(line) || /^time\b/i.test(line)) continue // cabeçalho de colunas

    const athlete = parseAthleteRow(line)
    if (athlete) current.results.push(athlete)
  }
  pushCurrent()

  return events
}

export { categoryFor }
