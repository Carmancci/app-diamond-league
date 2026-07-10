import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { MeetingCard } from '@/components/meeting-card'
import { NextMeeting } from '@/components/next-meeting'
import { CountryFlag } from '@/components/country-flag'
import { SEASON_YEAR } from '@/lib/diamond-league/data'
import {
  getMeetings,
  getNextMeeting,
  getSeasonProgress,
  getStandings,
} from '@/lib/diamond-league/utils'

export default function HomePage() {
  const meetings = getMeetings()
  const nextMeeting = getNextMeeting()
  const progress = getSeasonProgress()
  const topAthletes = getStandings().slice(0, 5)

  const stats = [
    { label: 'Etapas', value: progress.total },
    { label: 'Realizadas', value: progress.completed },
    { label: 'Restantes', value: progress.total - progress.completed },
    { label: 'Cidades', value: new Set(meetings.map((m) => m.city)).size },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      {/* Hero */}
      <section className="pt-12 sm:pt-16">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Wanda Diamond League {SEASON_YEAR}
        </div>
        <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight text-balance sm:text-7xl">
          Resultados &<br />
          estatísticas do<br />
          <span className="text-primary">atletismo mundial</span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Acompanhe todas as {progress.total} etapas da temporada {SEASON_YEAR}, com cada
          modalidade separada por gênero, marcas dos atletas e cronômetro para as próximas
          provas.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card px-4 py-4"
            >
              <div className="font-mono text-3xl font-bold tabular-nums text-foreground">
                {s.value}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Próxima etapa */}
      {nextMeeting && (
        <div className="mt-12">
          <NextMeeting meeting={nextMeeting} />
        </div>
      )}

      {/* Calendário */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendário da temporada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              As 15 etapas do circuito, na ordem oficial.
            </p>
          </div>
          <Link
            href="/meetings"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:flex"
          >
            Ver todas
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </section>

      {/* Top atletas */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Líderes em pontos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranking parcial da corrida ao título.
            </p>
          </div>
          <Link
            href="/standings"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Ranking completo
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          {topAthletes.map((row, i) => (
            <div
              key={`${row.athlete}-${row.discipline}`}
              className="flex items-center gap-4 border-b border-border bg-card px-4 py-3 last:border-b-0"
            >
              <span className="w-6 font-mono text-sm font-bold text-primary">{i + 1}</span>
              <CountryFlag code={row.country} className="size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{row.athlete}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.discipline} · {row.gender === 'men' ? 'Masculino' : 'Feminino'}
                </div>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {row.points} pts
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Nota de dados */}
      <p className="mt-12 rounded-lg border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Resultados reais extraídos e convertidos dos boletins oficiais em PDF da Wanda Diamond
        League {SEASON_YEAR} (Swiss Timing / diamondleague.com). Etapas futuras exibem programa e
        cronômetro até a publicação do boletim oficial.
      </p>
    </main>
  )
}
