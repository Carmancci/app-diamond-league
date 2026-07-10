import { getAllPerformances, getAthletes, ageFromDob, type Performance } from './athletes'
import { compareMarks, isLegalWind, windMatters } from './marks'
import type { EventCategory, Gender } from './types'

export interface DisciplineKey {
  discipline: string
  gender: Gender
  category: EventCategory
}

/** Todas as disciplinas presentes (apenas provas principais), ordenadas. */
export function getDisciplines(gender?: Gender): DisciplineKey[] {
  const map = new Map<string, DisciplineKey>()
  for (const p of getAllPerformances()) {
    if (!p.isPrimary) continue
    if (gender && p.gender !== gender) continue
    const key = `${p.discipline}|${p.gender}`
    if (!map.has(key)) {
      map.set(key, { discipline: p.discipline, gender: p.gender, category: p.category })
    }
  }
  const catOrder: EventCategory[] = ['sprints', 'hurdles', 'middle', 'distance', 'jumps', 'throws']
  return [...map.values()].sort(
    (a, b) =>
      catOrder.indexOf(a.category) - catOrder.indexOf(b.category) ||
      a.discipline.localeCompare(b.discipline),
  )
}

export interface TopListRow {
  rank: number
  performance: Performance
}

/**
 * Melhor marca do ano por atleta em uma disciplina/gênero (Top List).
 * `legalWindOnly` remove marcas com vento acima de +2.0 m/s (quando aplicável).
 */
export function getTopList(
  discipline: string,
  gender: Gender,
  opts: { legalWindOnly?: boolean; limit?: number } = {},
): TopListRow[] {
  const { legalWindOnly = false, limit } = opts
  const perfs = getAllPerformances().filter(
    (p) =>
      p.discipline === discipline &&
      p.gender === gender &&
      p.markValue !== null &&
      (!legalWindOnly || !windMatters(p.discipline, p.category) || isLegalWind(p.wind)),
  )

  // melhor marca por atleta
  const bestByAthlete = new Map<string, Performance>()
  for (const p of perfs) {
    const cur = bestByAthlete.get(p.athleteId)
    if (!cur || compareMarks(p.markValue!, cur.markValue!, p.category) < 0) {
      bestByAthlete.set(p.athleteId, p)
    }
  }

  const sorted = [...bestByAthlete.values()].sort((a, b) =>
    compareMarks(a.markValue!, b.markValue!, a.category),
  )
  const rows = sorted.map((performance, i) => ({ rank: i + 1, performance }))
  return limit ? rows.slice(0, limit) : rows
}

export interface CountryRow {
  country: string
  golds: number
  silvers: number
  bronzes: number
  podiums: number
  points: number
  athletes: number
}

/** Quadro de países: pódios (só provas principais) e pontos por nação. */
export function getCountryTable(): CountryRow[] {
  const map = new Map<string, CountryRow>()
  const athleteSet = new Map<string, Set<string>>()

  for (const p of getAllPerformances()) {
    if (!p.isPrimary) continue
    let row = map.get(p.country)
    if (!row) {
      row = { country: p.country, golds: 0, silvers: 0, bronzes: 0, podiums: 0, points: 0, athletes: 0 }
      map.set(p.country, row)
      athleteSet.set(p.country, new Set())
    }
    row.points += p.points
    if (p.rank === 1) row.golds++
    else if (p.rank === 2) row.silvers++
    else if (p.rank === 3) row.bronzes++
    if (p.rank !== null && p.rank <= 3) row.podiums++
    athleteSet.get(p.country)!.add(p.athleteId)
  }

  for (const [country, set] of athleteSet) {
    map.get(country)!.athletes = set.size
  }

  return [...map.values()].sort(
    (a, b) => b.golds - a.golds || b.silvers - a.silvers || b.bronzes - a.bronzes || b.points - a.points,
  )
}

export const RECORD_LABELS: Record<string, string> = {
  WL: 'Melhor marca mundial do ano',
  DLR: 'Recorde da Diamond League',
  MR: 'Recorde do meeting',
  AR: 'Recorde de área/continental',
  NR: 'Recorde nacional',
  WR: 'Recorde mundial',
}

const RECORD_PRIORITY = ['WR', 'WL', 'DLR', 'AR', 'NR', 'MR']

export interface RecordRow {
  code: string
  performance: Performance
}

/** Todas as marcas notáveis da temporada (WL, MR, NR, AR, DLR...). */
export function getRecords(filterCode?: string): RecordRow[] {
  const out: RecordRow[] = []
  for (const p of getAllPerformances()) {
    if (!p.note) continue
    const codes = p.note.split(/[\s,/]+/).map((c) => c.replace('=', '').toUpperCase())
    for (const code of codes) {
      if (RECORD_PRIORITY.includes(code)) {
        if (!filterCode || filterCode === code) out.push({ code, performance: p })
      }
    }
  }
  return out.sort(
    (a, b) =>
      RECORD_PRIORITY.indexOf(a.code) - RECORD_PRIORITY.indexOf(b.code) ||
      a.performance.round - b.performance.round,
  )
}

/** Códigos de recorde disponíveis nos dados. */
export function getRecordCodes(): string[] {
  const set = new Set<string>()
  for (const r of getRecords()) set.add(r.code)
  return RECORD_PRIORITY.filter((c) => set.has(c))
}

/** Progressão de um atleta numa disciplina, etapa a etapa (para gráficos). */
export function getProgression(athleteId: string, discipline: string): Performance[] {
  return getAllPerformances()
    .filter((p) => p.athleteId === athleteId && p.discipline === discipline && p.markValue !== null)
    .sort((a, b) => a.round - b.round)
}

export interface HeadToHead {
  discipline: string
  gender: Gender
  category: EventCategory
  meetings: {
    meetingName: string
    round: number
    a?: Performance
    b?: Performance
    winner?: 'a' | 'b'
  }[]
  winsA: number
  winsB: number
}

/** Confronto direto entre dois atletas numa disciplina. */
export function headToHead(
  idA: string,
  idB: string,
  discipline: string,
): HeadToHead | null {
  const perfs = getAllPerformances().filter(
    (p) => (p.athleteId === idA || p.athleteId === idB) && p.discipline === discipline,
  )
  if (perfs.length === 0) return null

  const byMeeting = new Map<string, { meetingName: string; round: number; a?: Performance; b?: Performance }>()
  for (const p of perfs) {
    const m = byMeeting.get(p.meetingSlug) ?? { meetingName: p.meetingName, round: p.round }
    if (p.athleteId === idA) m.a = p
    else m.b = p
    byMeeting.set(p.meetingSlug, m)
  }

  let winsA = 0
  let winsB = 0
  const meetings = [...byMeeting.values()]
    .sort((x, y) => x.round - y.round)
    .map((m) => {
      let winner: 'a' | 'b' | undefined
      if (m.a?.markValue != null && m.b?.markValue != null) {
        const cmp = compareMarks(m.a.markValue, m.b.markValue, m.a.category)
        winner = cmp < 0 ? 'a' : cmp > 0 ? 'b' : undefined
        if (winner === 'a') winsA++
        else if (winner === 'b') winsB++
      }
      return { ...m, winner }
    })

  return {
    discipline,
    gender: perfs[0].gender,
    category: perfs[0].category,
    meetings,
    winsA,
    winsB,
  }
}

export interface SeasonInsights {
  totalPerformances: number
  totalAthletes: number
  totalCountries: number
  worldLeads: number
  meetingRecords: number
  nationalRecords: number
  mostWins: { athleteId: string; name: string; country: string; wins: number } | null
  mostWorldLeads: { athleteId: string; name: string; country: string; count: number } | null
  youngestPodium: Performance | null
  oldestPodium: Performance | null
}

/** Painel de destaques da temporada. */
export function getInsights(): SeasonInsights {
  const perfs = getAllPerformances()
  const athletes = getAthletes()

  const countCode = (code: string) =>
    perfs.filter((p) => p.note && p.note.toUpperCase().includes(code)).length

  // mais world leads por atleta
  const wlByAthlete = new Map<string, { name: string; country: string; count: number }>()
  for (const p of perfs) {
    if (p.note && p.note.toUpperCase().includes('WL')) {
      const cur = wlByAthlete.get(p.athleteId) ?? { name: p.athlete, country: p.country, count: 0 }
      cur.count++
      wlByAthlete.set(p.athleteId, cur)
    }
  }
  let mostWorldLeads: SeasonInsights['mostWorldLeads'] = null
  for (const [id, v] of wlByAthlete) {
    if (!mostWorldLeads || v.count > mostWorldLeads.count) {
      mostWorldLeads = { athleteId: id, ...v }
    }
  }

  const topWinner = athletes.filter((a) => a.wins > 0).sort((a, b) => b.wins - a.wins)[0]

  // pódios com idade
  const podiums = perfs.filter((p) => p.isPrimary && p.rank !== null && p.rank <= 3 && p.dob)
  let youngestPodium: Performance | null = null
  let oldestPodium: Performance | null = null
  let minAge = Infinity
  let maxAge = -Infinity
  for (const p of podiums) {
    const age = ageFromDob(p.dob)
    if (age === null) continue
    if (age < minAge) {
      minAge = age
      youngestPodium = p
    }
    if (age > maxAge) {
      maxAge = age
      oldestPodium = p
    }
  }

  return {
    totalPerformances: perfs.length,
    totalAthletes: athletes.length,
    totalCountries: new Set(perfs.map((p) => p.country)).size,
    worldLeads: countCode('WL'),
    meetingRecords: countCode('MR'),
    nationalRecords: countCode('NR'),
    mostWins: topWinner
      ? { athleteId: topWinner.id, name: topWinner.name, country: topWinner.country, wins: topWinner.wins }
      : null,
    mostWorldLeads,
    youngestPodium,
    oldestPodium,
  }
}

/** Busca global simples em atletas, disciplinas e etapas. */
export interface SearchResult {
  type: 'athlete' | 'discipline' | 'meeting'
  label: string
  sublabel: string
  href: string
  country?: string
}
