'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Gender } from '@/lib/diamond-league/types'
import type { StandingRow } from '@/lib/diamond-league/utils'
import { CountryFlag } from '@/components/country-flag'

const TABS: { key: Gender | 'all'; label: string }[] = [
  { key: 'all', label: 'Geral' },
  { key: 'men', label: 'Masculino' },
  { key: 'women', label: 'Feminino' },
]

export function StandingsBoard({ rows }: { rows: StandingRow[] }) {
  const [gender, setGender] = useState<Gender | 'all'>('all')

  const filtered = useMemo(
    () => rows.filter((r) => gender === 'all' || r.gender === gender),
    [rows, gender],
  )

  return (
    <div>
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setGender(t.key)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              gender === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="w-6 text-center">#</span>
          <span className="flex-1">Atleta</span>
          <span className="hidden w-32 sm:block">Modalidade</span>
          <span className="w-12 text-center">Vit.</span>
          <span className="w-16 text-right">Pontos</span>
        </div>

        {filtered.map((row, i) => (
          <div
            key={`${row.athlete}-${row.discipline}-${row.gender}`}
            className={cn(
              'flex items-center gap-4 border-b border-border bg-card px-4 py-3 last:border-b-0',
              i < 3 && 'bg-primary/[0.05]',
            )}
          >
            <span
              className={cn(
                'w-6 text-center font-mono text-sm font-bold',
                i < 3 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <CountryFlag code={row.country} className="size-5 shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{row.athlete}</div>
                <div className="truncate text-xs text-muted-foreground sm:hidden">
                  {row.discipline}
                </div>
              </div>
            </div>
            <span className="hidden w-32 truncate text-sm text-muted-foreground sm:block">
              {row.discipline}
            </span>
            <span className="w-12 text-center font-mono text-sm tabular-nums text-muted-foreground">
              {row.wins}
            </span>
            <span className="w-16 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
              {row.points}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Sem dados de ranking para este filtro ainda.
          </div>
        )}
      </div>
    </div>
  )
}
