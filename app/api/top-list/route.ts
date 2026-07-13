import { NextResponse } from 'next/server'
import { getTopList } from '@/lib/diamond-league/stats'
import type { Gender } from '@/lib/diamond-league/types'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const discipline = searchParams.get('discipline') ?? ''
  const gender = (searchParams.get('gender') ?? 'men') as Gender
  const legalWindOnly = searchParams.get('legalWind') === '1'

  if (!discipline) {
    return NextResponse.json({ rows: [] })
  }

  const rows = getTopList(discipline, gender, { legalWindOnly, limit: 30 }).map((r) => ({
    rank: r.rank,
    athleteId: r.performance.athleteId,
    athlete: r.performance.athlete,
    country: r.performance.country,
    mark: r.performance.mark,
    note: r.performance.note ?? null,
    wind: r.performance.wind,
    meetingName: r.performance.meetingName,
    meetingSlug: r.performance.meetingSlug,
  }))

  return NextResponse.json({ rows })
}
