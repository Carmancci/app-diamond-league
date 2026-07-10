import { MEETINGS } from './data'
import { compareMarks, parseMark, parseWind } from './marks'
import type { EventCategory, Gender } from './types'

export interface Performance {
  athleteId: string
  athlete: string
  country: string
  gender: Gender
  dob?: string
  discipline: string
  category: EventCategory
  isPrimary: boolean
  phase?: string
  rank: number | null
  mark: string
  markValue: number | null
  note?: string
  points: number
  wind: number | null
  meetingSlug: string
  meetingName: string
  city: string
  round: number
  date: string
}

export interface DisciplineSummary {
  discipline: string
  category: EventCategory
  gender: Gender
  best: Performance // melhor marca da temporada (SB)
  appearances: number
  wins: number
  points: number
}

export interface AthleteProfile {
  id: string
  name: string
  country: string
  gender: Gender
  dob?: string
  disciplines: string[]
  performances: Performance[]
  byDiscipline: DisciplineSummary[]
  totalPoints: number
  wins: number
  podiums: number
  meetingsCount: number
}

/** Gera um id estável e URL-friendly a partir do nome + país. */
export function athleteId(name: string, country: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug}-${country.toLowerCase()}`
}

let _performances: Performance[] | null = null

/** Lista achatada de todas as performances (todas as provas de todas as etapas). */
export function getAllPerformances(): Performance[] {
  if (_performances) return _performances
  const out: Performance[] = []
  for (const meeting of MEETINGS) {
    for (const event of meeting.events) {
      const wind = parseWind(event.wind)
      for (const r of event.results) {
        out.push({
          athleteId: athleteId(r.athlete, r.country),
          athlete: r.athlete,
          country: r.country,
          gender: event.gender,
          dob: r.dob,
          discipline: event.discipline,
          category: event.category,
          isPrimary: event.isPrimary,
          phase: event.phase,
          rank: r.rank,
          mark: r.mark,
          markValue: parseMark(r.mark),
          note: r.note,
          points: r.points ?? 0,
          wind,
          meetingSlug: meeting.slug,
          meetingName: meeting.name,
          city: meeting.city,
          round: meeting.round,
          date: meeting.date,
        })
      }
    }
  }
  _performances = out
  return out
}

let _athletes: Map<string, AthleteProfile> | null = null

function buildAthletes(): Map<string, AthleteProfile> {
  if (_athletes) return _athletes
  const perfs = getAllPerformances()
  const map = new Map<string, AthleteProfile>()

  for (const p of perfs) {
    let a = map.get(p.athleteId)
    if (!a) {
      a = {
        id: p.athleteId,
        name: p.athlete,
        country: p.country,
        gender: p.gender,
        dob: p.dob,
        disciplines: [],
        performances: [],
        byDiscipline: [],
        totalPoints: 0,
        wins: 0,
        podiums: 0,
        meetingsCount: 0,
      }
      map.set(p.athleteId, a)
    }
    if (!a.dob && p.dob) a.dob = p.dob
    a.performances.push(p)
  }

  for (const a of map.values()) {
    // agrupa por disciplina
    const byDisc = new Map<string, Performance[]>()
    for (const p of a.performances) {
      const key = p.discipline
      const arr = byDisc.get(key) ?? []
      arr.push(p)
      byDisc.set(key, arr)
    }

    const summaries: DisciplineSummary[] = []
    for (const [discipline, list] of byDisc) {
      const valid = list.filter((p) => p.markValue !== null)
      const best = (valid.length ? valid : list).reduce((bestP, p) => {
        if (p.markValue === null) return bestP
        if (bestP.markValue === null) return p
        return compareMarks(p.markValue, bestP.markValue, p.category) < 0 ? p : bestP
      }, list[0])
      summaries.push({
        discipline,
        category: list[0].category,
        gender: list[0].gender,
        best,
        appearances: list.length,
        wins: list.filter((p) => p.rank === 1 && p.isPrimary).length,
        points: list.reduce((s, p) => s + p.points, 0),
      })
    }
    summaries.sort((x, y) => y.points - x.points || y.appearances - x.appearances)

    a.byDiscipline = summaries
    a.disciplines = summaries.map((s) => s.discipline)
    a.totalPoints = a.performances.reduce((s, p) => s + p.points, 0)
    a.wins = a.performances.filter((p) => p.rank === 1 && p.isPrimary).length
    a.podiums = a.performances.filter((p) => p.rank !== null && p.rank <= 3 && p.isPrimary).length
    a.meetingsCount = new Set(a.performances.map((p) => p.meetingSlug)).size
    // ordena performances por etapa
    a.performances.sort((x, y) => x.round - y.round)
  }

  _athletes = map
  return map
}

export function getAthletes(): AthleteProfile[] {
  return [...buildAthletes().values()].sort(
    (a, b) => b.totalPoints - a.totalPoints || b.performances.length - a.performances.length,
  )
}

export function getAthleteById(id: string): AthleteProfile | undefined {
  return buildAthletes().get(id)
}

/** Idade a partir da data de nascimento (formato "30 Oct 1993" ou ISO). */
export function ageFromDob(dob?: string, ref: Date = new Date()): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  let age = ref.getFullYear() - d.getFullYear()
  const m = ref.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--
  return age
}
