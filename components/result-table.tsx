import Link from 'next/link'
import { Wind, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventResult } from '@/lib/diamond-league/types'
import { CountryFlag } from '@/components/country-flag'
import { athleteId } from '@/lib/diamond-league/athletes'
import { displayName } from '@/lib/diamond-league/format'

const NOTE_STYLES: Record<string, string> = {
  WL: 'bg-primary/20 text-primary',
  DLR: 'bg-primary/20 text-primary',
  MR: 'bg-primary/20 text-primary',
  AR: 'bg-chart-1/20 text-chart-1',
  NR: 'bg-chart-1/20 text-chart-1',
  PB: 'bg-chart-2/20 text-chart-2',
  SB: 'bg-chart-4/20 text-chart-4',
}

const DNF_MARKS = new Set(['DNF', 'DNS', 'DQ', 'NM', 'DID NOT START'])

const RANK_ACCENT: Record<number, string> = {
  1: 'text-primary',
  2: 'text-foreground',
  3: 'text-chart-3',
}

export function ResultTable({ event }: { event: EventResult }) {
  const hasResults = event.results.length > 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">{event.discipline}</h3>
          {event.phase && !/^final$/i.test(event.phase) && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {event.phase}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {event.startTime && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {event.startTime}
            </span>
          )}
          {event.wind && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Wind className="size-3.5" />
              {event.wind}
            </span>
          )}
        </div>
      </div>

      {hasResults ? (
        <div className="divide-y divide-border">
          {event.results.map((r, i) => {
            const isDnf = DNF_MARKS.has(r.mark.toUpperCase())
            const id = athleteId(r.athlete, r.country)
            return (
              <div
                key={`${r.rank ?? 'x'}-${r.athlete}-${i}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  r.rank === 1 && 'bg-primary/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'w-6 text-center font-mono text-sm font-bold',
                    r.rank && RANK_ACCENT[r.rank] ? RANK_ACCENT[r.rank] : 'text-muted-foreground',
                  )}
                >
                  {r.rank ?? '–'}
                </span>
                <CountryFlag code={r.country} className="size-4 shrink-0" />
                <Link
                  href={`/athletes/${id}`}
                  className="min-w-0 flex-1 transition-colors hover:text-primary"
                >
                  <span className="truncate font-medium">{displayName(r.athlete)}</span>
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.country}
                  </span>
                </Link>
                {r.note && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                      NOTE_STYLES[r.note.replace('=', '')] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {r.note}
                  </span>
                )}
                <span
                  className={cn(
                    'w-16 text-right font-mono text-sm font-semibold tabular-nums',
                    isDnf ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {r.mark}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Resultados ainda não disponíveis.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Serão publicados após a realização da prova.
          </p>
        </div>
      )}
    </div>
  )
}
