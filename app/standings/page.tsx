import type { Metadata } from 'next'
import { StandingsBoard } from '@/components/standings-board'
import { SEASON_YEAR } from '@/lib/diamond-league/data'
import { getStandings } from '@/lib/diamond-league/utils'

export const metadata: Metadata = {
  title: 'Rankings — Diamond League 2026',
  description: 'Ranking de pontos da corrida ao título da Wanda Diamond League 2026.',
}

export default function StandingsPage() {
  const rows = getStandings()

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <section className="pt-12 sm:pt-16">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Temporada {SEASON_YEAR}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Ranking de pontos
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
          A corrida ao título por modalidade. Os pontos são acumulados a cada etapa; os
          melhores garantem vaga na final de Bruxelas.
        </p>
      </section>

      <div className="mt-10">
        <StandingsBoard rows={rows} />
      </div>
    </main>
  )
}
