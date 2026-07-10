import { NextResponse } from 'next/server'
import { getAthletes } from '@/lib/diamond-league/athletes'
import { getDisciplines } from '@/lib/diamond-league/stats'
import { MEETINGS } from '@/lib/diamond-league/data'
import { displayName } from '@/lib/diamond-league/format'
import { countryName } from '@/lib/diamond-league/countries'
import { GENDER_LABELS } from '@/lib/diamond-league/utils'

export const dynamic = 'force-static'

export interface SearchIndexItem {
  type: 'athlete' | 'discipline' | 'meeting'
  label: string
  sub: string
  href: string
  country?: string
  id?: string
}

export function GET() {
  const items: SearchIndexItem[] = []

  for (const a of getAthletes()) {
    items.push({
      type: 'athlete',
      label: displayName(a.name),
      sub: `${a.disciplines[0] ?? ''} · ${countryName(a.country)}`,
      href: `/athletes/${a.id}`,
      country: a.country,
      id: a.id,
    })
  }

  for (const d of getDisciplines()) {
    items.push({
      type: 'discipline',
      label: `${d.discipline} · ${GENDER_LABELS[d.gender]}`,
      sub: 'Top list da temporada',
      href: `/stats?tab=toplists&d=${encodeURIComponent(d.discipline)}&g=${d.gender}`,
    })
  }

  for (const m of MEETINGS) {
    items.push({
      type: 'meeting',
      label: m.name,
      sub: `${m.city} · ${countryName(m.country)}`,
      href: `/meetings/${m.slug}`,
      country: m.country,
    })
  }

  return NextResponse.json({ items })
}
