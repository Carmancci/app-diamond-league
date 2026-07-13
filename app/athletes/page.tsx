import type { Metadata } from 'next'
import { getAthletes } from '@/lib/diamond-league/athletes'
import { AthleteList, type AthleteListItem } from '@/components/athlete-list'

export const metadata: Metadata = {
  title: 'Atletas — Diamond League 2026',
  description:
    'Todos os atletas da Wanda Diamond League 2026, com marcas, vitórias e pontos agregados de todas as etapas.',
}

export default function AthletesPage() {
  const athletes: AthleteListItem[] = getAthletes().map((a) => ({
    id: a.id,
    name: a.name,
    country: a.country,
    gender: a.gender,
    topDiscipline: a.disciplines[0] ?? '—',
    points: a.totalPoints,
    wins: a.wins,
  }))

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Diamond League 2026</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Atletas</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Perfis agregados a partir dos resultados oficiais. Toque em um atleta para ver marcas,
          progressão e histórico por etapa.
        </p>
      </header>
      <AthleteList athletes={athletes} />
    </main>
  )
}
