import type { Metadata } from 'next'
import { getDisciplines, getCountryTable, getRecords, getInsights } from '@/lib/diamond-league/stats'
import { getAthletes, ageFromDob, type Performance } from '@/lib/diamond-league/athletes'
import { StatsExplorer } from '@/components/stats/stats-explorer'

function podiumLite(p: Performance | null) {
  if (!p) return null
  return {
    athlete: p.athlete,
    athleteId: p.athleteId,
    country: p.country,
    discipline: p.discipline,
    mark: p.mark,
    meetingName: p.meetingName,
    age: ageFromDob(p.dob),
  }
}

export const metadata: Metadata = {
  title: 'Estatísticas — Diamond League 2026',
  description:
    'Top lists por disciplina, quadro de países, recordes e World Leads, confronto direto entre atletas e destaques da temporada da Wanda Diamond League 2026.',
}

export default function StatsPage() {
  const disciplines = getDisciplines()
  const countries = getCountryTable()
  const records = getRecords()
  const rawInsights = getInsights()
  const insights = {
    ...rawInsights,
    youngestPodium: podiumLite(rawInsights.youngestPodium),
    oldestPodium: podiumLite(rawInsights.oldestPodium),
  }

  // dados enxutos para o seletor de atletas do head-to-head
  const athletes = getAthletes().map((a) => ({
    id: a.id,
    name: a.name,
    country: a.country,
    gender: a.gender,
    disciplines: a.disciplines,
  }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Diamond League 2026</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Estatísticas</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Explore as melhores marcas do ano, o quadro de nações, os recordes batidos, o confronto
          direto entre atletas e os grandes números da temporada.
        </p>
      </header>

      <StatsExplorer
        disciplines={disciplines}
        countries={countries}
        records={records.map((r) => ({
          code: r.code,
          athlete: r.performance.athlete,
          athleteId: r.performance.athleteId,
          country: r.performance.country,
          discipline: r.performance.discipline,
          gender: r.performance.gender,
          mark: r.performance.mark,
          meetingName: r.performance.meetingName,
        }))}
        insights={insights}
        athletes={athletes}
      />
    </main>
  )
}
