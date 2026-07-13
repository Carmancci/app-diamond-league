import { NextResponse } from 'next/server'
import { headToHead } from '@/lib/diamond-league/stats'
import { getAthleteById } from '@/lib/diamond-league/athletes'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const a = searchParams.get('a') ?? ''
  const b = searchParams.get('b') ?? ''
  const discipline = searchParams.get('discipline') ?? ''

  if (!a || !b || !discipline || a === b) {
    return NextResponse.json({ result: null })
  }

  const h2h = headToHead(a, b, discipline)
  if (!h2h) return NextResponse.json({ result: null })

  const pa = getAthleteById(a)
  const pb = getAthleteById(b)

  return NextResponse.json({
    result: {
      discipline: h2h.discipline,
      winsA: h2h.winsA,
      winsB: h2h.winsB,
      athleteA: pa ? { id: pa.id, name: pa.name, country: pa.country } : null,
      athleteB: pb ? { id: pb.id, name: pb.name, country: pb.country } : null,
      meetings: h2h.meetings.map((m) => ({
        meetingName: m.meetingName,
        markA: m.a?.mark ?? null,
        rankA: m.a?.rank ?? null,
        markB: m.b?.mark ?? null,
        rankB: m.b?.rank ?? null,
        winner: m.winner ?? null,
      })),
    },
  })
}
