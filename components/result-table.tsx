import Link from 'next/link'
import { ChevronDown, Clock, ExternalLink, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventResult } from '@/lib/diamond-league/types'
import type { TimeDisplayMode } from '@/lib/diamond-league/time'
import { displayEventTime } from '@/lib/diamond-league/time'
import { disciplinePtBr, listLabelPtBr, phasePtBr, recordPtBr } from '@/lib/diamond-league/i18n'
import { CountryFlag } from '@/components/country-flag'
import { athleteId } from '@/lib/diamond-league/athletes'
import { displayName } from '@/lib/diamond-league/format'

const NOTE_STYLES: Record<string, string> = {
  WL: 'bg-primary/15 text-primary', DLR: 'bg-primary/15 text-primary', MR: 'bg-primary/15 text-primary',
  AR: 'bg-chart-1/15 text-chart-1', NR: 'bg-chart-1/15 text-chart-1',
  PB: 'bg-chart-2/15 text-chart-2', SB: 'bg-chart-4/15 text-chart-4',
}

interface ResultTableProps {
  event: EventResult
  meetingDate: string
  venueTimeZone: string
  timeMode: TimeDisplayMode
  defaultOpen?: boolean
}

export function ResultTable({ event, meetingDate, venueTimeZone, timeMode, defaultOpen }: ResultTableProps) {
  const isEntries = event.listType === 'inscritos' || event.listType === 'programa'
  const displayedTime = event.startTime ? displayEventTime(meetingDate, event.startTime, venueTimeZone, timeMode) : null
  const phase = phasePtBr(event.phase)

  return (
    <details open={defaultOpen || undefined} className="group overflow-hidden rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{disciplinePtBr(event.discipline)}</h3>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{event.gender === 'men' ? 'Masculino' : 'Feminino'}</span>
            {phase && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{phase}</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{listLabelPtBr(event.listLabel, event.listType)} · {event.results.length} atleta{event.results.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {displayedTime && <span className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground"><Clock className="size-3.5 text-primary" />{displayedTime}</span>}
          {event.wind && <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex"><Wind className="size-3.5" />{event.wind}</span>}
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-border">
        {!!event.records?.length && <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {event.records.slice(0, 6).map((record, index) => <div key={`${record.name}-${index}`} className="bg-muted/40 p-3">
            <div className="flex items-baseline justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wide text-primary">{recordPtBr(record.name)}</span><span className="font-mono text-sm font-bold text-foreground">{record.performance}</span></div>
            {record.holder && <p className="mt-1 truncate text-xs text-muted-foreground">{displayName(record.holder)}{record.holderCountry ? ` · ${record.holderCountry}` : ''}</p>}
          </div>)}
        </div>}

        {event.results.length ? <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[44px_1fr_68px_68px_68px_72px] gap-2 border-b border-border bg-muted/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>{isEntries ? 'Pos.' : 'Col.'}</span><span>Atleta</span><span className="text-right">Class.</span><span className="text-right">Pontos</span><span className="text-right">SB</span><span className="text-right">{isEntries ? 'PB' : 'Marca'}</span>
            </div>
            <div className="divide-y divide-border">
              {event.results.map((result, index) => {
                const id = result.athleteId || athleteId(result.athlete, result.country)
                return <div key={`${result.athlete}-${index}`} className={cn('grid grid-cols-[44px_1fr_68px_68px_68px_72px] items-center gap-2 px-4 py-2.5 text-sm', result.rank === 1 && !isEntries && 'bg-primary/[0.06]')}>
                  <span className="font-mono text-center text-xs font-bold text-muted-foreground">{result.rank ?? index + 1}</span>
                  <div className="flex min-w-0 items-center gap-2"><CountryFlag code={result.country} className="size-4 shrink-0" /><Link href={`/athletes/${id}`} data-athlete-quick-view className="min-w-0 truncate font-semibold text-foreground hover:text-primary hover:underline">{displayName(result.athlete)}</Link></div>
                  <span className="text-right font-mono text-xs text-muted-foreground">{result.qualificationRank ?? '—'}</span>
                  <span className="text-right font-mono text-xs text-muted-foreground">{result.qualificationPoints ?? '—'}</span>
                  <span className="text-right font-mono text-xs text-muted-foreground">{result.seasonBest ?? '—'}</span>
                  <div className="flex items-center justify-end gap-1"><span className="font-mono text-xs font-bold text-foreground">{isEntries ? result.personalBest ?? '—' : result.mark || '—'}</span>{result.note && <span className={cn('rounded px-1 py-0.5 font-mono text-[9px] font-bold', NOTE_STYLES[result.note.replace('=', '')] ?? 'bg-muted text-muted-foreground')}>{result.note}</span>}</div>
                </div>
              })}
            </div>
          </div>
        </div> : <div className="px-4 py-8 text-center"><p className="text-sm font-medium text-foreground">Lista ainda não publicada pela fonte oficial.</p><p className="mt-1 text-xs text-muted-foreground">O programa permanece visível e será atualizado automaticamente quando houver dados.</p></div>}
        <div className="flex justify-end border-t border-border px-4 py-2"><span className="flex items-center gap-1 text-[10px] text-muted-foreground">Fonte oficial Swiss Timing <ExternalLink className="size-3" /></span></div>
      </div>
    </details>
  )
}
