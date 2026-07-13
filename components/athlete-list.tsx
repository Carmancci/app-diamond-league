'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CountryFlag } from '@/components/country-flag'
import { AthleteAvatar } from '@/components/athlete-avatar'
import { AthleteDisclosure } from '@/components/athlete-disclosure'
import { displayName } from '@/lib/diamond-league/format'
import { cn } from '@/lib/utils'
import type { Gender } from '@/lib/diamond-league/types'

export interface AthleteListItem {
  id: string
  name: string
  country: string
  gender: Gender
  topDiscipline: string
  points: number
  wins: number
}

const GENDER_TABS: { key: Gender | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'men', label: 'Masculino' },
  { key: 'women', label: 'Feminino' },
]

export function AthleteList({ athletes }: { athletes: AthleteListItem[] }) {
  const [gender, setGender] = useState<Gender | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return athletes.filter((a) => {
      if (gender !== 'all' && a.gender !== gender) return false
      if (!q) return true
      const hay = `${a.name} ${a.country} ${a.topDiscipline}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return hay.includes(q)
    })
  }, [athletes, gender, query])

  const shown = filtered.slice(0, 100)

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 rounded-lg border border-border bg-card p-1">
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
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atleta, país ou prova..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {filtered.length} atletas
      </p>

      <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {shown.map((a, i) => (
          <li key={a.id}>
            <AthleteDisclosure
              athleteId={a.id}
              className="px-4 py-3 transition-colors hover:bg-muted/40"
              triggerClassName="items-start gap-3"
            >
              <span className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <AthleteAvatar
                id={a.id}
                name={a.name}
                country={a.country}
                className="size-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium leading-snug">{displayName(a.name)}</p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs leading-relaxed text-muted-foreground">
                  <CountryFlag code={a.country} className="size-3.5" />
                  {a.country} · {a.topDiscipline}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold tabular-nums">{a.points}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  pts
                </p>
              </div>
            </AthleteDisclosure>
          </li>
        ))}
      </ol>

      {filtered.length > shown.length && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Mostrando os primeiros {shown.length} de {filtered.length}. Refine sua busca para ver mais.
        </p>
      )}
    </div>
  )
}
