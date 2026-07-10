import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import type { Meeting } from '@/lib/diamond-league/types'
import { formatMeetingDate, getMeetingStatus } from '@/lib/diamond-league/utils'
import { CountryFlag } from '@/components/country-flag'

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const status = getMeetingStatus(meeting)

  return (
    <Link
      href={`/meetings/${meeting.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            R{String(meeting.round).padStart(2, '0')}
          </span>
          {meeting.isFinal && (
            <span className="rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Final
            </span>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-6">
        <CountryFlag code={meeting.country} className="h-6 w-9 rounded" />
        <h3 className="mt-2 text-lg font-semibold text-balance text-foreground">
          {meeting.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {meeting.city}, {meeting.countryName}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="font-mono text-sm font-medium text-foreground">
          {formatMeetingDate(meeting)}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
          {status === 'completed' ? 'Ver resultados' : 'Ver programa'}
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </Link>
  )
}
