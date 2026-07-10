'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { CountryFlag } from '@/components/country-flag'
import { displayName } from '@/lib/diamond-league/format'
import { cn } from '@/lib/utils'

export interface H2HAthlete {
  id: string
  name: string
  country: string
  gender: string
  disciplines: string[]
}

type AthleteOption = H2HAthlete

interface Props {
  athletes: AthleteOption[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function HeadToHeadTab({ athletes }: Props) {
  const [a, setA] = useState<AthleteOption | null>(null)
  const [b, setB] = useState<AthleteOption | null>(null)

  // disciplinas em comum
  const commonDisciplines = useMemo(() => {
    if (!a || !b) return []
    return a.disciplines.filter((d) => b.disciplines.includes(d))
  }, [a, b])

  const [discipline, setDiscipline] = useState<string>('')
  const activeDiscipline = discipline && commonDisciplines.includes(discipline) ? discipline : commonDisciplines[0]

  const { data: raw, isLoading } = useSWR(
    a && b && activeDiscipline
      ? `/api/head-to-head?a=${a.id}&b=${b.id}&discipline=${encodeURIComponent(activeDiscipline)}`
      : null,
    fetcher,
  )
  const data = raw?.result ?? null

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AthletePicker label="Atleta A" athletes={athletes} selected={a} onSelect={setA} exclude={b?.id} />
        <AthletePicker label="Atleta B" athletes={athletes} selected={b} onSelect={setB} exclude={a?.id} />
      </div>

      {a && b && commonDisciplines.length === 0 && (
        <p className="mt-6 rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          Estes atletas não competiram na mesma disciplina em 2026.
        </p>
      )}

      {commonDisciplines.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {commonDisciplines.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiscipline(d)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                activeDiscipline === d
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="mt-6 text-center text-sm text-muted-foreground">Carregando confronto…</p>}

      {data && a && b && (
        <div className="mt-6">
          {/* Placar */}
          <div className="flex items-center justify-center gap-6 rounded-lg border border-border bg-card p-5">
            <ScoreSide name={a.name} country={a.country} wins={data.winsA} lead={data.winsA > data.winsB} />
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-foreground">
                {data.winsA} <span className="text-muted-foreground">—</span> {data.winsB}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{activeDiscipline}</p>
            </div>
            <ScoreSide name={b.name} country={b.country} wins={data.winsB} lead={data.winsB > data.winsA} />
          </div>

          {/* Confrontos etapa a etapa */}
          <ul className="mt-4 space-y-2">
            {data.meetings.map((m: {
              meetingName: string
              markA?: string | null
              markB?: string | null
              winner?: 'a' | 'b' | null
            }, i: number) => (
              <li
                key={i}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span
                  className={cn(
                    'text-right font-mono text-sm',
                    m.winner === 'a' ? 'font-bold text-primary' : 'text-foreground',
                  )}
                >
                  {m.markA ?? '—'}
                </span>
                <span className="text-center text-xs text-muted-foreground">{m.meetingName}</span>
                <span
                  className={cn(
                    'font-mono text-sm',
                    m.winner === 'b' ? 'font-bold text-primary' : 'text-foreground',
                  )}
                >
                  {m.markB ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ScoreSide({
  name,
  country,
  wins,
  lead,
}: {
  name: string
  country: string
  wins: number
  lead: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <CountryFlag code={country} className="size-7 rounded" />
      <p className={cn('text-sm font-semibold', lead ? 'text-primary' : 'text-foreground')}>
        {displayName(name)}
      </p>
    </div>
  )
}

function AthletePicker({
  label,
  athletes,
  selected,
  onSelect,
  exclude,
}: {
  label: string
  athletes: AthleteOption[]
  selected: AthleteOption | null
  onSelect: (a: AthleteOption | null) => void
  exclude?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return athletes
      .filter((a) => a.id !== exclude && a.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [query, athletes, exclude])

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2.5">
          <CountryFlag code={selected.country} className="size-5 shrink-0" />
          <span className="flex-1 truncate text-sm font-semibold text-foreground">
            {displayName(selected.name)}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null)
              setQuery('')
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Trocar
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar atleta…"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          {open && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
              {results.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(a)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <CountryFlag code={a.country} className="size-4 shrink-0" />
                    <span className="truncate text-sm text-foreground">{displayName(a.name)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
