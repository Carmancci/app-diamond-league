import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { Countdown } from '@/components/countdown'
import { EventBrowser } from '@/components/event-browser'
import { NoteLegend } from '@/components/note-legend'
import { StatusBadge } from '@/components/status-badge'
import { MEETINGS } from '@/lib/diamond-league/data'
import {
  formatFullDate,
  getMeetingBySlug,
  getMeetingStatus,
} from '@/lib/diamond-league/utils'
import { CountryFlag } from '@/components/country-flag'
import { dataStatePtBr } from '@/lib/diamond-league/i18n'
import { venueDateTimeToUtc } from '@/lib/diamond-league/time'

export function generateStaticParams() {
  return MEETINGS.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const meeting = getMeetingBySlug(slug)
  if (!meeting) return { title: 'Etapa não encontrada' }
  return {
    title: `${meeting.name} — Diamond League 2026`,
    description: `Programa e resultados da etapa de ${meeting.city} da Diamond League 2026.`,
  }
}

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const meeting = getMeetingBySlug(slug)
  if (!meeting) notFound()

  const status = getMeetingStatus(meeting)
  const disciplineCount = meeting.events.filter((event) => event.isPrimary).length
  const firstStartTime = meeting.events.map((event) => event.startTime).filter(Boolean).sort()[0]
  const countdownTarget = firstStartTime && meeting.timezone
    ? venueDateTimeToUtc(meeting.date, firstStartTime, meeting.timezone)?.toISOString()
    : undefined
  const officialSource = typeof meeting.source === 'object' && meeting.source ? meeting.source : null

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="pt-8">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Todas as etapas
        </Link>
      </div>

      {/* Cabeçalho da etapa */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>Rodada {meeting.round} de 15</span>
            {meeting.isFinal && (
              <span className="rounded-sm bg-primary px-1.5 py-0.5 font-bold uppercase tracking-wider text-primary-foreground">
                Final
              </span>
            )}
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CountryFlag code={meeting.country} className="h-8 w-12 rounded" />
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {meeting.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {meeting.stadium}, {meeting.city}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatFullDate(meeting)}
              </span>
            </div>
          </div>

          {status !== 'completed' && countdownTarget && (
            <div className="lg:text-right">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {status === 'live' ? 'Sessão em andamento' : 'Até a primeira prova'}
              </p>
              <Countdown target={countdownTarget} />
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{disciplineCount}</span> listas/provas publicadas
          </span>
          <span className="rounded-full bg-chart-4/15 px-2.5 py-1 text-xs font-semibold text-chart-4">
            {dataStatePtBr(meeting.state)}
          </span>
          {meeting.updatedAt && <span className="text-xs text-muted-foreground">Atualizado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(meeting.updatedAt))} (Brasília)</span>}
          <a
            href={officialSource?.url ?? meeting.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Consultar fonte oficial
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>

      {/* Modalidades e resultados */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
          {status === 'completed' ? 'Resultados' : 'Programa'}
        </h2>
        <EventBrowser
          events={meeting.events}
          meetingDate={meeting.date}
          venueTimeZone={meeting.timezone ?? 'UTC'}
          venueName={`${meeting.stadium}, ${meeting.city}`}
        />
      </section>

      {status === 'completed' && (
        <section className="mt-8">
          <NoteLegend />
        </section>
      )}
    </main>
  )
}
