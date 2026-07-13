'use client'

import { useMemo, useState } from 'react'
import { CountryFlag } from '@/components/country-flag'
import { AthleteDisclosure } from '@/components/athlete-disclosure'
import { displayName } from '@/lib/diamond-league/format'
import { cn } from '@/lib/utils'

export interface RecordItem {
  code: string
  athlete: string
  athleteId: string
  country: string
  discipline: string
  gender: string
  mark: string
  meetingName: string
}

interface Props {
  records: RecordItem[]
}

const CODE_STYLES: Record<string, string> = {
  WR: 'bg-primary text-primary-foreground',
  WL: 'bg-primary/15 text-primary',
  DLR: 'bg-accent/15 text-accent',
  AR: 'bg-chart-2/15 text-chart-2',
  NR: 'bg-chart-3/15 text-chart-3',
  MR: 'bg-muted text-muted-foreground',
}

const CODE_ORDER = ['WR', 'WL', 'DLR', 'AR', 'NR', 'MR']

const LABELS: Record<string, string> = {
  WL: 'Melhor marca mundial do ano',
  DLR: 'Recorde da Diamond League',
  MR: 'Recorde do meeting',
  AR: 'Recorde de área/continental',
  NR: 'Recorde nacional',
  WR: 'Recorde mundial',
}

export function RecordsTab({ records }: Props) {
  const [active, setActive] = useState<string>('all')

  const codes = useMemo(() => {
    const present = new Set(records.map((r) => r.code))
    return CODE_ORDER.filter((c) => present.has(c))
  }, [records])

  const labels = LABELS

  const filtered = useMemo(
    () => (active === 'all' ? records : records.filter((r) => r.code === active)),
    [records, active],
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={active === 'all'} onClick={() => setActive('all')}>
          Todos ({records.length})
        </FilterChip>
        {codes.map((code) => {
          const count = records.filter((r) => r.code === code).length
          return (
            <FilterChip key={code} active={active === code} onClick={() => setActive(code)}>
              {code} ({count})
            </FilterChip>
          )
        })}
      </div>

      {active !== 'all' && labels[active] && (
        <p className="mb-4 text-sm text-muted-foreground">{labels[active]}</p>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {filtered.map((r, i) => (
          <li key={`${r.athleteId}-${r.discipline}-${r.code}-${i}`}>
            <AthleteDisclosure athleteId={r.athleteId} className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40" triggerClassName="items-start gap-3">
              <span
                className={cn(
                  'grid min-w-10 place-items-center rounded px-2 py-1 font-mono text-xs font-bold',
                  CODE_STYLES[r.code] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {r.code}
              </span>
              <CountryFlag code={r.country} className="size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold leading-snug text-foreground">
                  {displayName(r.athlete)}
                </p>
                <p className="break-words text-xs leading-relaxed text-muted-foreground">
                  {r.discipline} · {r.gender === 'men' ? 'M' : 'F'} · {r.meetingName}
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">{r.mark}</span>
            </AthleteDisclosure>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum recorde nesta categoria.
        </p>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
