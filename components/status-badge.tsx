import { cn } from '@/lib/utils'
import type { MeetingStatus } from '@/lib/diamond-league/types'

const CONFIG: Record<MeetingStatus, { label: string; className: string; dot: string }> = {
  completed: {
    label: 'Encerrada',
    className: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  live: {
    label: 'Ao vivo',
    className: 'border-destructive/40 bg-destructive/15 text-destructive',
    dot: 'bg-destructive animate-pulse',
  },
  upcoming: {
    label: 'Em breve',
    className: 'border-primary/40 bg-primary/15 text-primary',
    dot: 'bg-primary',
  },
}

export function StatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  const c = CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-widest',
        c.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
