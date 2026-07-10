export type Gender = 'men' | 'women'

export type EventCategory = 'sprints' | 'middle' | 'distance' | 'hurdles' | 'jumps' | 'throws'

export type MeetingStatus = 'completed' | 'live' | 'upcoming'

export interface AthleteResult {
  rank: number
  athlete: string
  country: string // ISO-3 code
  mark: string // time / distance / height
  note?: string // WL, MR, PB, SB, DNF, etc.
  points?: number // Diamond League points
}

export interface EventResult {
  id: string
  discipline: string // e.g. "100m", "Salto em Distância"
  category: EventCategory
  gender: Gender
  wind?: string
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
  events: EventResult[]
}
