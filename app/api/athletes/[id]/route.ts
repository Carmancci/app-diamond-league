import { NextResponse } from 'next/server'
import { getAthleteById } from '@/lib/diamond-league/athletes'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const athlete = getAthleteById(id)

  if (!athlete) {
    return NextResponse.json({ error: 'Atleta não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ athlete })
}
