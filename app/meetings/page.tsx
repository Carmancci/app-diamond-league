import type { Metadata } from 'next'
import { MeetingCard } from '@/components/meeting-card'
import { SEASON_YEAR } from '@/lib/diamond-league/data'
import { getMeetings } from '@/lib/diamond-league/utils'

export const metadata: Metadata = {
  title: 'Etapas — Diamond League 2026',
  description: 'Calendário completo das 15 etapas da Wanda Diamond League 2026.',
}

export default function MeetingsPage() {
  const meetings = getMeetings()

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <section className="pt-12 sm:pt-16">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Temporada {SEASON_YEAR}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Todas as etapas
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
          O circuito de {meetings.length} etapas na ordem oficial, de Xangai à final em
          Bruxelas. Clique em qualquer etapa para ver o programa e os resultados.
        </p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </main>
  )
}
