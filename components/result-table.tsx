import { Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventResult } from '@/lib/diamond-league/types'
import { flagEmoji } from '@/lib/diamond-league/utils'

const NOTE_STYLES: Record<string, string> = {
  WL: 'bg-primary/20 text-primary',
  MR: 'bg-primary/20 text-primary',
  PB: 'bg-chart-2/20 text-chart-2',
  SB: 'bg-chart-4/20 text-chart-4',
  DNF: 'bg-muted text-muted-foreground',
  DNS: 'bg-muted text-muted-foreground',
}

export function ResultTable({ event }: { event: EventResult }) {
  const hasResults = event.results.length > 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="font-semibold text-foreground">{event.discipline}</h3>
        {event.wind && (
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Wind className="size-3.5" />
            {event.wind} m/s
          </span>
        )}
      </div>

      {hasResults ? (
        <div className="divide-y divide-border">
          {event.results.map((r) => (
            <div
              key={`${r.rank}-${r.athlete}`}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                r.rank === 1 && 'bg-primary/[0.06]',
              )}
            >
              <span
                className={cn(
                  'w-6 text-center font-mono text-sm font-bold',
                  r.rank === 1 ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {r.rank}
              </span>
              <span className="text-base" aria-hidden="true">
                {flagEmoji(r.country)}
              </span>
              <div className="min-w-0 flex-1">
                <span className="truncate font-medium text-foreground">{r.athlete}</span>
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.country}
                </span>
              </div>
              {r.note && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                    NOTE_STYLES[r.note] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {r.note}
                </span>
              )}
              <span className="w-16 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                {r.mark}
              </span>
            </div>
          ))}
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
