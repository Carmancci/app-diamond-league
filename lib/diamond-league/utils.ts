import { MEETINGS, SEASON_YEAR } from './data'
import type { EventCategory, Gender, Meeting, MeetingStatus } from './types'

/** "Agora" fixo na temporada para consistência de demonstração. */
export function now(): Date {
  return new Date()
}

export function getMeetingStatus(meeting: Meeting, ref: Date = now()): MeetingStatus {
  const start = new Date(meeting.date)
  const end = meeting.endDate ? new Date(meeting.endDate) : start
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())

  if (today < startDay) return 'upcoming'
  if (today > endDay) return 'completed'
  return 'live'
}

export function getMeetings(): Meeting[] {
  return [...MEETINGS].sort((a, b) => a.round - b.round)
}

export function getMeetingBySlug(slug: string): Meeting | undefined {
  return MEETINGS.find((m) => m.slug === slug)
}

export function getNextMeeting(ref: Date = now()): Meeting | undefined {
  const sorted = getMeetings()
  return (
    sorted.find((m) => getMeetingStatus(m, ref) === 'live') ??
    sorted.find((m) => getMeetingStatus(m, ref) === 'upcoming')
  )
}

export function getSeasonProgress(ref: Date = now()) {
  const meetings = getMeetings()
  const completed = meetings.filter((m) => getMeetingStatus(m, ref) === 'completed').length
  return { completed, total: meetings.length }
}

export interface StandingRow {
  athlete: string
  country: string
  points: number
  wins: number
  discipline: string
  gender: Gender
}

/** Ranking simples de pontos Diamond League a partir dos resultados existentes. */
export function getStandings(gender?: Gender): StandingRow[] {
  const map = new Map<string, StandingRow>()

  for (const meeting of MEETINGS) {
    for (const event of meeting.events) {
      if (gender && event.gender !== gender) continue
      for (const r of event.results) {
        const key = `${r.athlete}-${event.discipline}-${event.gender}`
        const existing = map.get(key)
        const pts = r.points ?? 0
        if (existing) {
          existing.points += pts
          if (r.rank === 1) existing.wins += 1
        } else {
          map.set(key, {
            athlete: r.athlete,
            country: r.country,
            points: pts,
            wins: r.rank === 1 ? 1 : 0,
            discipline: event.discipline,
            gender: event.gender,
          })
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => b.points - a.points || b.wins - a.wins)
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  sprints: 'Velocidade',
  middle: 'Meio-fundo',
  distance: 'Fundo',
  hurdles: 'Barreiras',
  jumps: 'Saltos',
  throws: 'Lançamentos',
}

export const GENDER_LABELS: Record<Gender, string> = {
  men: 'Masculino',
  women: 'Feminino',
}

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

export function formatMeetingDate(meeting: Meeting): string {
  const start = new Date(meeting.date)
  const d = start.getUTCDate()
  const m = MONTHS_PT[start.getUTCMonth()]
  if (meeting.endDate) {
    const end = new Date(meeting.endDate)
    return `${d}\u2013${end.getUTCDate()} ${m}`
  }
  return `${d} ${m}`
}

export function formatFullDate(meeting: Meeting): string {
  const start = new Date(meeting.date)
  const d = start.getUTCDate()
  const m = MONTHS_PT[start.getUTCMonth()]
  return `${d} de ${m} de ${SEASON_YEAR}`
}

/** Bandeira em emoji a partir de ISO-3 (aproximado via mapa ISO3->ISO2). */
const ISO3_TO_ISO2: Record<string, string> = {
  JAM: 'JM', USA: 'US', RSA: 'ZA', GBR: 'GB', LCA: 'LC', CIV: 'CI', KEN: 'KE',
  ETH: 'ET', AUS: 'AU', GRE: 'GR', NOR: 'NO', NGR: 'NG', FRA: 'FR', ZAM: 'ZM',
  CAN: 'CA', ALG: 'DZ', LTU: 'LT', SWE: 'SE', SLO: 'SI', BOT: 'BW', MAR: 'MA',
  UKR: 'UA', NED: 'NL', IND: 'IN', GER: 'DE', CZE: 'CZ', QAT: 'QA', BRN: 'BH',
  UGA: 'UG', POR: 'PT', BUR: 'BF', ESP: 'ES', ITA: 'IT', NZL: 'NZ', CHN: 'CN',
  POL: 'PL', BEL: 'BE', SUI: 'CH', MON: 'MC',
}

export function flagEmoji(iso3: string): string {
  const iso2 = ISO3_TO_ISO2[iso3]
  if (!iso2) return '\u{1F3F3}'
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
