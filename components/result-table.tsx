import { ChevronDown, Clock, ExternalLink, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventResult } from '@/lib/diamond-league/types'
import type { TimeDisplayMode } from '@/lib/diamond-league/time'
import { displayEventTime } from '@/lib/diamond-league/time'
import { disciplinePtBr, listLabelPtBr, phasePtBr, recordPtBr } from '@/lib/diamond-league/i18n'
import { CountryFlag } from '@/components/country-flag'
import { AthleteDisclosure } from '@/components/athlete-disclosure'
import { athleteId } from '@/lib/diamond-league/athletes'
import { displayName } from '@/lib/diamond-league/format'
import { formatRecordDate, prioritizeRecords, recordMeeting } from '@/lib/diamond-league/records'

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
  const referenceRecords = prioritizeRecords(event.records, event.startDate ?? meetingDate)

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
        {!!referenceRecords.length && <section className="border-b border-border bg-muted/20 p-4" aria-label="Marcas de referência da modalidade">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marcas a serem batidas</p>
          <p className="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">Recordes Mundial, Diamond League e da Etapa vigentes antes da prova.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {referenceRecords.map((record, index) => <article key={`${record.name}-${index}`} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-primary">{recordPtBr(record.name)}</span><span className="font-mono text-base font-bold text-foreground">{record.performance}</span></div>
              {record.holder && <p className="mt-2 break-words text-sm font-semibold leading-relaxed text-foreground">{displayName(record.holder)}{record.holderCountry ? ` · ${record.holderCountry}` : ''}</p>}
              <dl className="mt-2 grid gap-1 text-xs leading-relaxed text-muted-foreground">
                <div><dt className="inline font-semibold text-foreground">Meeting: </dt><dd className="inline break-words">{recordMeeting(record)}</dd></div>
                {record.location && <div><dt className="inline font-semibold text-foreground">Local: </dt><dd className="inline break-words">{record.location}</dd></div>}
                <div><dt className="inline font-semibold text-foreground">Data: </dt><dd className="inline">{formatRecordDate(record.date)}</dd></div>
              </dl>
            </article>)}
          </div>
        </section>}

        {event.results.length ? <div>
          <div>
            <div className="hidden grid-cols-[44px_minmax(0,1fr)_68px_68px_68px_72px] gap-2 border-b border-border bg-muted/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>{isEntries ? 'Pos.' : 'Col.'}</span><span>Atleta</span><span className="text-right">Class.</span><span className="text-right">Pontos</span><span className="text-right">SB</span><span className="text-right">{isEntries ? 'PB' : 'Marca'}</span>
            </div>
            <div className="divide-y divide-border">
              {event.results.map((result, index) => {
                const id = result.athleteId || athleteId(result.athlete, result.country)
                return <div key={`${result.athlete}-${index}`} className={cn('grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 px-4 py-3 text-sm sm:grid-cols-[44px_minmax(0,1fr)_68px_68px_68px_72px] sm:items-center sm:gap-2 sm:py-2.5', result.rank === 1 && !isEntries && 'bg-primary/[0.06]')}>
                  <span className="font-mono text-center text-xs font-bold text-muted-foreground">{result.rank ?? index + 1}</span>
                  <div className="flex min-w-0 items-start gap-2"><CountryFlag code={result.country} className="mt-0.5 size-4 shrink-0" /><AthleteDisclosure athleteId={id} className="min-w-0 flex-1" triggerClassName="font-semibold text-foreground hover:text-primary"><span className="block break-words">{displayName(result.athlete)}</span></AthleteDisclosure></div>
                  <span className="hidden text-right font-mono text-xs text-muted-foreground sm:block">{result.qualificationRank ?? '—'}</span>
                  <span className="hidden text-right font-mono text-xs text-muted-foreground sm:block">{result.qualificationPoints ?? '—'}</span>
                  <span className="hidden text-right font-mono text-xs text-muted-foreground sm:block">{result.seasonBest ?? '—'}</span>
                  <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-auto sm:justify-end"><span className="font-mono text-xs font-bold text-foreground"><span className="sm:hidden">{isEntries ? 'PB: ' : 'Marca: '}</span>{isEntries ? result.personalBest ?? '—' : result.mark || '—'}</span>{result.seasonBest && <span className="font-mono text-[10px] text-muted-foreground sm:hidden">SB: {result.seasonBest}</span>}{result.note && <span className={cn('rounded px-1 py-0.5 font-mono text-[9px] font-bold', NOTE_STYLES[result.note.replace('=', '')] ?? 'bg-muted text-muted-foreground')}>{result.note}</span>}</div>
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
