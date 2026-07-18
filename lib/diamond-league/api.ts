import { DATA_GENERATED_AT, MEETINGS, SEASON_YEAR } from './data'
import { getMeetingBySlug } from './utils'

export const API_VERSION = 'v1'

export function apiCacheHeaders() {
  return {
    // A fonte muda somente após uma publicação validada. A CDN pode servir a
    // resposta por pouco tempo, mas clientes nunca devem inventar um fallback.
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  }
}

export function meetingsPayload() {
  return {
    apiVersion: API_VERSION,
    season: SEASON_YEAR,
    generatedAt: DATA_GENERATED_AT,
    meetings: MEETINGS.map((meeting) => ({
      slug: meeting.slug,
      round: meeting.round,
      name: meeting.name,
      city: meeting.city,
      country: meeting.country,
      countryName: meeting.countryName,
      stadium: meeting.stadium ?? null,
      date: meeting.date,
      endDate: meeting.endDate ?? null,
      isFinal: meeting.isFinal ?? false,
      state: meeting.state ?? 'aguardando_fonte',
      eventCount: meeting.eventCount ?? meeting.events.length,
      athleteCount: meeting.athleteCount ?? 0,
      updatedAt: meeting.updatedAt ?? null,
      officialUrl: meeting.officialUrl,
    })),
  }
}

export function meetingPayload(slug: string) {
  const meeting = getMeetingBySlug(slug)
  if (!meeting) return null

  return {
    apiVersion: API_VERSION,
    season: SEASON_YEAR,
    generatedAt: DATA_GENERATED_AT,
    meeting,
  }
}
