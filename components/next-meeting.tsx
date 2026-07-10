import Link from 'next/link'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { Countdown } from '@/components/countdown'
import { StatusBadge } from '@/components/status-badge'
import type { Meeting } from '@/lib/diamond-league/types'
import {
  flagEmoji,
  formatFullDate,
  getMeetingStatus,
} from '@/lib/diamond-league/utils'

export function NextMeeting({ meeting }: { meeting: Meeting }) {
  const status = getMeetingStatus(meeting)
  const isLive = status === 'live'

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {isLive ? 'Acontecendo agora' : 'Próxima etapa'}
          </span>
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-4xl leading-none" aria-hidden="true">
              {flagEmoji(meeting.country)}
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {meeting.name}
            </h2>
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

          <div className="lg:text-right">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {isLive ? 'Início da sessão' : 'Contagem regressiva'}
            </p>
            <Countdown target={`${meeting.date}T18:00:00Z`} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/meetings/${meeting.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ver programa completo
            <ArrowUpRight className="size-4" />
          </Link>
          <a
            href={meeting.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50"
          >
            Site oficial
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
