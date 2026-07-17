import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

const SEASON = 2026

const MEETINGS = [
  { round: 1, slug: 'shanghai', name: 'Xangai', city: 'Xangai' },
  { round: 2, slug: 'xiamen', name: 'Xiamen', city: 'Xiamen' },
  { round: 3, slug: 'rabat', name: 'Rabat', city: 'Rabat' },
  { round: 4, slug: 'rome', name: 'Roma', city: 'Roma' },
  { round: 5, slug: 'stockholm', name: 'Estocolmo', city: 'Estocolmo' },
  { round: 6, slug: 'oslo', name: 'Oslo', city: 'Oslo' },
  { round: 7, slug: 'doha', name: 'Doha', city: 'Doha' },
  { round: 8, slug: 'paris', name: 'Paris', city: 'Paris' },
  { round: 9, slug: 'eugene', name: 'Eugene', city: 'Eugene' },
  { round: 10, slug: 'monaco', name: 'Mônaco', city: 'Mônaco' },
  { round: 11, slug: 'london', name: 'Londres', city: 'Londres' },
  { round: 12, slug: 'lausanne', name: 'Lausanne', city: 'Lausanne' },
  { round: 13, slug: 'silesia', name: 'Silésia', city: 'Chorzów' },
  { round: 14, slug: 'zurich', name: 'Zurique', city: 'Zurique' },
  { round: 15, slug: 'brussels', name: 'Final de Bruxelas', city: 'Bruxelas', isFinal: true },
]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  try {
    const buscaPromessas = MEETINGS.map(async (meeting) => {
      const url = `https://ath-wdl-archive.azureedge.net/${SEASON}/${meeting.slug}.json`
      try {
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) return { slug: meeting.slug, state: 'aguardando_publicacao', events: [] }
        const rawData = await response.json()
        return {
          ...meeting,
          state: 'confirmado_oficial',
          updatedAt: new Date().toISOString(),
          events: rawData.events || rawData || [],
        }
      } catch {
        return { slug: meeting.slug, state: 'erro_coleta', events: [] }
      }
    })

    const resultadosEtapas = await Promise.all(buscaPromessas)
    const payloadFinal = {
      season: SEASON,
      generatedAt: new Date().toISOString(),
      meetings: resultadosEtapas,
    }

    const blob = await put('diamond-league/live-data.json', JSON.stringify(payloadFinal, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })

    return NextResponse.json({
      success: true,
      message: 'Dados consolidados com sucesso do Azure/Swiss Timing!',
      url: blob.url,
      totalEtapasProcessadas: resultadosEtapas.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
