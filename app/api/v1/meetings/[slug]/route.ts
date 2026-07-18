import { NextResponse } from 'next/server'
import { apiCacheHeaders, meetingPayload } from '@/lib/diamond-league/api'

export const dynamic = 'force-static'

/** Detalhe de uma etapa. Resultados são carregados somente sob demanda. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const payload = meetingPayload(slug)

  if (!payload) {
    return NextResponse.json(
      {
        error: {
          code: 'MEETING_NOT_FOUND',
          message: 'Etapa não encontrada.',
        },
      },
      { status: 404, headers: apiCacheHeaders() },
    )
  }

  return NextResponse.json(payload, { headers: apiCacheHeaders() })
}
