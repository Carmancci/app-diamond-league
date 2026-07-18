import { NextResponse } from 'next/server'
import { getAthleteById } from '@/lib/diamond-league/athletes'
import { API_VERSION, apiCacheHeaders } from '@/lib/diamond-league/api'
import { DATA_GENERATED_AT, SEASON_YEAR } from '@/lib/diamond-league/data'

export const dynamic = 'force-static'

/** Perfil completo com performances e marcas disponíveis nas fontes oficiais. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const athlete = getAthleteById(id)

  if (!athlete) {
    return NextResponse.json(
      {
        error: {
          code: 'ATHLETE_NOT_FOUND',
          message: 'Atleta não encontrado nas fontes oficiais consolidadas.',
        },
      },
      { status: 404, headers: apiCacheHeaders() },
    )
  }

  return NextResponse.json(
    {
      apiVersion: API_VERSION,
      season: SEASON_YEAR,
      generatedAt: DATA_GENERATED_AT,
      athlete,
    },
    { headers: apiCacheHeaders() },
  )
}
