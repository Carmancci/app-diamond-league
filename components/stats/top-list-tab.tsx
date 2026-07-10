'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Wind } from 'lucide-react'
import { CountryFlag } from '@/components/country-flag'
import { displayName } from '@/lib/diamond-league/format'
import { CATEGORY_LABELS } from '@/lib/diamond-league/utils'
import { windMatters } from '@/lib/diamond-league/marks'
import type { DisciplineKey } from '@/lib/diamond-league/stats'
import type { Gender } from '@/lib/diamond-league/types'
import { cn } from '@/lib/utils'

interface TopRow {
  rank: number
  athleteId: string
  athlete: string
  country: string
  mark: string
  note: string | null
  wind: number | null
  meetingName: string
  meetingSlug: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TopListTab({ disciplines }: { disciplines: DisciplineKey[] }) {
  const [gender, setGender] = useState<Gender>('men')

  const genderDisciplines = useMemo(
    () => disciplines.filter((d) => d.gender === gender),
    [disciplines, gender],
  )

  const [discipline, setDiscipline] = useState(genderDisciplines[0]?.discipline ?? '')
  const [legalWind, setLegalWind] = useState(false)

  // garante disciplina válida ao trocar de gênero
  const activeDiscipline = genderDisciplines.some((d) => d.discipline === discipline)
    ? discipline
    : (genderDisciplines[0]?.discipline ?? '')

  const current = genderDisciplines.find((d) => d.discipline === activeDiscipline)
  const showWindFilter = current ? windMatters(current.discipline, current.category) : false

  const { data, isLoading } = useSWR<{ rows: TopRow[] }>(
    activeDiscipline
      ? `/api/top-list?discipline=${encodeURIComponent(activeDiscipline)}&gender=${gender}&legalWind=${legalWind ? 1 : 0}`
      : null,
    fetcher,
    { keepPreviousData: true },
  )

  const rows = data?.rows ?? []

  return (
    <div>
      {/* gênero */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {(['men', 'women'] as Gender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              gender === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {g === 'men' ? 'Masculino' : 'Feminino'}
          </button>
        ))}
      </div>

      {/* disciplinas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {genderDisciplines.map((d) => (
          <button
            key={d.discipline}
            type="button"
            onClick={() => setDiscipline(d.discipline)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              activeDiscipline === d.discipline
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {d.discipline}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {current ? CATEGORY_LABELS[current.category] : ''} · Melhor marca do ano por atleta
        </p>
        {showWindFilter && (
          <button
            type="button"
            onClick={() => setLegalWind((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              legalWind
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Wind className="size-3.5" />
            {legalWind ? 'Só vento legal (≤ +2.0)' : 'Todas as marcas'}
          </button>
        )}
      </div>

      <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 && !isLoading && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma marca registrada para este filtro.
          </li>
        )}
        {rows.map((r) => (
          <li
            key={`${r.athleteId}-${r.rank}`}
            className={cn('flex items-center gap-3 px-4 py-2.5', r.rank === 1 && 'bg-primary/[0.06]')}
          >
            <span
              className={cn(
                'w-6 text-center font-mono text-sm font-bold',
                r.rank === 1 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {r.rank}
            </span>
            <CountryFlag code={r.country} className="size-4 shrink-0" />
            <Link
              href={`/athletes/${r.athleteId}`}
              className="min-w-0 flex-1 truncate font-medium transition-colors hover:text-primary"
            >
              {displayName(r.athlete)}
              <span className="ml-2 text-xs text-muted-foreground">{r.meetingName}</span>
            </Link>
            {r.wind !== null && (
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                {r.wind > 0 ? `+${r.wind.toFixed(1)}` : r.wind.toFixed(1)}
              </span>
            )}
            {r.note && (
              <span className="rounded bg-primary/15 px-1 py-0.5 font-mono text-[10px] font-bold text-primary">
                {r.note}
              </span>
            )}
            <span className="w-16 text-right font-mono text-sm font-semibold tabular-nums">
              {r.mark}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
