export type Gender = 'men' | 'women'

export type EventCategory = 'sprints' | 'middle' | 'distance' | 'hurdles' | 'jumps' | 'throws'

export type MeetingStatus = 'completed' | 'live' | 'upcoming'

export type DataState =
  | 'aguardando_fonte'
  | 'coletado'
  | 'validando'
  | 'confirmado_oficial'
  | 'parcial'
  | 'divergente'
  | 'falha_coleta'
  | 'desatualizado'

export type ListType = 'programa' | 'inscritos' | 'resultados_parciais' | 'resultados_finais'

export interface SourceMetadata {
  type: 'swiss_timing_json' | 'swiss_timing_pdf' | 'diamond_league_official'
  url: string
  pdfUrl?: string
  checksum?: string
  collectedAt?: string
  parserVersion?: string
  state?: DataState
  diagnosis?: string
}

export interface AthleteMarkDetails {
  mark: string
  venue?: string
  date?: string
  sourceUrl?: string
}

export interface AthleteResult {
  rank: number | null
  athlete: string
  athleteId?: string
  /** Identificador oficial e estável do perfil Diamond League. */
  dlId?: string
  country: string
  dob?: string
  bib?: number | string
  mark: string
  note?: string
  points?: number
  qualificationRank?: number
  qualificationPoints?: number
  seasonBest?: string
  personalBest?: string
  seasonBestDetails?: AthleteMarkDetails
  personalBestDetails?: AthleteMarkDetails
  status?: string
}

export interface EventResult {
  id: string
  discipline: string // e.g. "100m", "Salto em Distância"
  category: EventCategory
  gender: Gender
  phase?: string
  isPrimary: boolean
  isDiamondRace?: boolean
  listType?: ListType
  listLabel?: string
  wind?: string
  startTime?: string
  startDate?: string
  startDateTimeUtc?: string
  records?: EventRecord[]
  results: AthleteResult[]
}

export interface EventRecord {
  name: string
  performance: string
  holder?: string
  holderCountry?: string
  meeting?: string
  location?: string
  date?: string
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
  timezone?: string
  state?: DataState
  source?: SourceMetadata | string | null
  updatedAt?: string | null
  eventCount?: number
  athleteCount?: number
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
