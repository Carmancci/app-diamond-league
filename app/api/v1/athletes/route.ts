import { NextResponse } from 'next/server'
import { getAthletes } from '@/lib/diamond-league/athletes'
import { API_VERSION, apiCacheHeaders } from '@/lib/diamond-league/api'
import { DATA_GENERATED_AT, SEASON_YEAR } from '@/lib/diamond-league/data'

export const dynamic = 'force-static'

/** Diretório leve de atletas, derivado somente dos resultados oficiais consolidados. */
export function GET() {
  const athletes = getAthletes().map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    country: athlete.country,
    gender: athlete.gender,
    dob: athlete.dob ?? null,
    disciplines: athlete.disciplines,
    topDiscipline: athlete.byDiscipline[0]?.discipline ?? null,
    seasonBest: athlete.byDiscipline[0]?.seasonBest ?? null,
    personalBest: athlete.byDiscipline[0]?.personalBest ?? null,
    totalPoints: athlete.totalPoints,
    wins: athlete.wins,
    podiums: athlete.podiums,
    meetingsCount: athlete.meetingsCount,
  }))

  return NextResponse.json(
    {
      apiVersion: API_VERSION,
      season: SEASON_YEAR,
      generatedAt: DATA_GENERATED_AT,
      athletes,
    },
    { headers: apiCacheHeaders() },
  )
}
