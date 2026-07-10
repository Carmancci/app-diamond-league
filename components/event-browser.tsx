'use client'

import { useMemo, useState } from 'react'
import { ResultTable } from '@/components/result-table'
import { cn } from '@/lib/utils'
import type { EventCategory, EventResult, Gender } from '@/lib/diamond-league/types'
import { CATEGORY_LABELS } from '@/lib/diamond-league/utils'

const GENDER_TABS: { key: Gender | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'men', label: 'Masculino' },
  { key: 'women', label: 'Feminino' },
]

export function EventBrowser({ events }: { events: EventResult[] }) {
  const [gender, setGender] = useState<Gender | 'all'>('all')
  const [category, setCategory] = useState<EventCategory | 'all'>('all')

  const categories = useMemo(() => {
    const set = new Set<EventCategory>()
    events.forEach((e) => set.add(e.category))
    return [...set]
  }, [events])

  const filtered = useMemo(() => {
    return events.filter(
      (e) =>
        (gender === 'all' || e.gender === gender) &&
        (category === 'all' || e.category === category),
    )
  }, [events, gender, category])

  const men = filtered.filter((e) => e.gender === 'men')
  const women = filtered.filter((e) => e.gender === 'women')

  return (
    <div>
      {/* Filtros de gênero */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {GENDER_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setGender(t.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                gender === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de categoria */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            category === 'all'
              ? 'border-primary/50 bg-primary/15 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          Todas as modalidades
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === c
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma modalidade encontrada para este filtro.
        </p>
      ) : gender === 'all' ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <GenderColumn title="Masculino" events={men} />
          <GenderColumn title="Feminino" events={women} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((e) => (
            <ResultTable key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function GenderColumn({ title, events }: { title: string; events: EventResult[] }) {
  if (events.length === 0) return null
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {title}
        <span className="h-px flex-1 bg-border" />
      </h2>
      <div className="grid gap-4">
        {events.map((e) => (
          <ResultTable key={e.id} event={e} />
        ))}
      </div>
    </div>
  )
}
