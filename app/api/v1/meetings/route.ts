import { NextResponse } from 'next/server'
import { apiCacheHeaders, meetingsPayload } from '@/lib/diamond-league/api'

export const dynamic = 'force-static'

/** Lista leve de etapas para web e clientes nativos. */
export function GET() {
  return NextResponse.json(meetingsPayload(), {
    headers: apiCacheHeaders(),
  })
}
