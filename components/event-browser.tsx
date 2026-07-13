'use client'

import { useMemo, useState } from 'react'
import { Clock3, MapPin, MonitorSmartphone } from 'lucide-react'
import { ResultTable } from '@/components/result-table'
import { cn } from '@/lib/utils'
import type { EventCategory, EventResult, Gender } from '@/lib/diamond-league/types'
import type { TimeDisplayMode } from '@/lib/diamond-league/time'
import { userTimeZone } from '@/lib/diamond-league/time'
import { CATEGORY_LABELS } from '@/lib/diamond-league/utils'

const GENDERS: { key: Gender | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' }, { key: 'men', label: 'Masculino' }, { key: 'women', label: 'Feminino' },
]

interface EventBrowserProps {
  events: EventResult[]
  meetingDate: string
  venueTimeZone: string
  venueName: string
}

export function EventBrowser({ events, meetingDate, venueTimeZone, venueName }: EventBrowserProps) {
  const [gender, setGender] = useState<Gender | 'all'>('all')
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  const [showSecondary, setShowSecondary] = useState(false)
  const [timeMode, setTimeMode] = useState<TimeDisplayMode>('venue')

  const categories = useMemo(() => [...new Set(events.map((event) => event.category))], [events])
  const hasSecondary = useMemo(() => events.some((event) => !event.isPrimary), [events])
  const filtered = useMemo(() => events.filter((event) =>
    (showSecondary || event.isPrimary) &&
    (gender === 'all' || event.gender === gender) &&
    (category === 'all' || event.category === category),
  ), [events, showSecondary, gender, category])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock3 className="size-4 text-primary" /> Horário exibido
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {timeMode === 'venue' ? `${venueName} · ${venueTimeZone}` : `Seu dispositivo · ${userTimeZone()}`}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-border bg-muted p-1" aria-label="Escolher referência de horário">
          <button type="button" onClick={() => setTimeMode('venue')} className={cn('flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors', timeMode === 'venue' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <MapPin className="size-3.5" /> Horário da prova
          </button>
          <button type="button" onClick={() => setTimeMode('user')} className={cn('flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors', timeMode === 'user' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <MonitorSmartphone className="size-3.5" /> Meu horário
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {GENDERS.map((tab) => <button key={tab.key} type="button" onClick={() => setGender(tab.key)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', gender === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{tab.label}</button>)}
          </div>
          {hasSecondary && <button type="button" onClick={() => setShowSecondary((value) => !value)} className={cn('rounded-lg border px-3 py-2 text-xs font-medium transition-colors', showSecondary ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{showSecondary ? 'Ocultar séries e provas B/C' : 'Incluir séries e provas B/C'}</button>}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')}>Todas as modalidades</FilterChip>
          {categories.map((value) => <FilterChip key={value} active={category === value} onClick={() => setCategory(value)}>{CATEGORY_LABELS[value]}</FilterChip>)}
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((event, index) => <ResultTable key={event.id} event={event} meetingDate={meetingDate} venueTimeZone={venueTimeZone} timeMode={timeMode} defaultOpen={index === 0} />)}
        </div>
      ) : <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma prova encontrada para estes filtros.</p>}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', active ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>{children}</button>
}
