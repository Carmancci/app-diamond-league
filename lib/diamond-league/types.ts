export type Gender = 'men' | 'women'

export type EventCategory = 'sprints' | 'middle' | 'distance' | 'hurdles' | 'jumps' | 'throws'

export type MeetingStatus = 'completed' | 'live' | 'upcoming'

export interface AthleteResult {
  rank: number | null // null para DNF/DNS/DQ/NM
  athlete: string
  country: string // ISO-3 code
  dob?: string // data de nascimento (quando disponível no PDF)
  mark: string // tempo / distância / altura, ou DNF/DNS/DQ
  note?: string // WL, MR, PB, SB, NR, AR, DLR, etc.
  points?: number // pontos Diamond League (calculados)
}

export interface EventResult {
  id: string
  discipline: string // e.g. "100m", "Salto em Distância"
  category: EventCategory
  gender: Gender
  phase?: string // "Final", "Heat 1", "B", "C"...
  isPrimary: boolean // prova principal da Diamond League
  wind?: string
  startTime?: string
  results: AthleteResult[]
}

export interface Meeting {
  id: string
  slug: string
  round: number // 1..15
  name: string
  city: string
  country: string // ISO-3
  countryName: string
  stadium?: string
  date: string // ISO start date
  endDate?: string // ISO for multi-day (final)
  isFinal?: boolean
  officialUrl: string
  source?: string | null // URL do PDF oficial de origem
  updatedAt?: string | null // quando os dados foram ingeridos
  events: EventResult[]
}

export interface MeetingSummary {
  slug: string
  round: number
  name: string
  city: string
  country: string
  countryName: string
  stadium?: string
  date: string
  endDate?: string | null
  isFinal?: boolean
  hasResults: boolean
  eventCount: number
}
