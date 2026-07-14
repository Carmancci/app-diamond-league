'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AthleteProfile } from '@/lib/diamond-league/athletes'
import { CATEGORY_LABELS } from '@/lib/diamond-league/utils'
import { isTimedCategory } from '@/lib/diamond-league/marks'
import { NOTE_LABELS } from '@/components/note-legend'
import { ProgressionChart, type ProgressionPoint } from '@/components/progression-chart'
import { cn } from '@/lib/utils'

function BestMarkCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xl font-bold tabular-nums text-primary">
        {value ?? 'Não informado pela fonte'}
      </p>
    </div>
  )
}

export function AthleteDisciplines({ athlete }: { athlete: AthleteProfile }) {
  const [active, setActive] = useState(athlete.byDiscipline[0]?.discipline ?? '')

  const summary = athlete.byDiscipline.find((d) => d.discipline === active)
  if (!summary) return null

  const perfs = athlete.performances
    .filter((p) => p.discipline === active)
    .sort((a, b) => a.round - b.round)

  const isTime = isTimedCategory(summary.category)
  const chartData: ProgressionPoint[] = perfs
    .filter((p) => p.markValue !== null)
    .map((p) => ({
      label: p.city,
      value: p.markValue as number,
      display: p.mark,
      meeting: p.meetingName,
    }))

  return (
    <div>
      {/* Seletor de disciplina */}
      {athlete.byDiscipline.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {athlete.byDiscipline.map((d) => (
            <button
              key={d.discipline}
              type="button"
              onClick={() => setActive(d.discipline)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active === d.discipline
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {d.discipline}
            </button>
          ))}
        </div>
      )}

      {/* Resumo da disciplina */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BestMarkCard label="Season Best (SB)" value={summary.seasonBest} />
        <BestMarkCard label="Personal Best (PB)" value={summary.personalBest} />
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Modalidade
          </p>
          <p className="mt-1 text-lg font-semibold">{CATEGORY_LABELS[summary.category]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.appearances} {summary.appearances === 1 ? 'participação' : 'participações'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Vitórias / Pontos
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {summary.wins} <span className="text-muted-foreground">/</span> {summary.points}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">nesta disciplina</p>
        </div>
      </div>

      {/* Gráfico de progressão */}
      <section className="mt-6">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Progressão na temporada
        </h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <ProgressionChart data={chartData} invert={isTime} />
        </div>
      </section>

      {/* Histórico de resultados */}
      <section className="mt-6">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Resultados por etapa
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Etapa</th>
                <th className="px-2 py-2.5 text-center font-medium">Pos.</th>
                <th className="px-4 py-2.5 text-right font-medium">Marca</th>
              </tr>
            </thead>
            <tbody>
              {perfs.map((p, i) => (
                <tr key={`${p.meetingSlug}-${i}`} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/meetings/${p.meetingSlug}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {p.meetingName}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{p.city}</span>
                    {!p.isPrimary && p.phase && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {p.phase}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">
                    {p.rank ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold tabular-nums">{p.mark}</span>
                    {p.note && (
                      <span
                        title={NOTE_LABELS[p.note.toUpperCase()] ?? p.note}
                        className="ml-1.5 rounded bg-primary/15 px-1 py-0.5 text-[10px] font-bold text-primary"
                      >
                        {p.note}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
