'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { MeetingSummary, MeetingState } from '@/app/meetings/page'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MeetingState, string> = {
  confirmado_oficial: 'Confirmado',
  aguardando_publicacao: 'Aguardando publicação',
  erro_coleta: 'Dados indisponíveis',
}

const STATUS_STYLES: Record<MeetingState, { dot: string; badge: string }> = {
  confirmado_oficial: {
    dot: 'bg-chart-4',
    badge: 'bg-chart-4/10 text-chart-4',
  },
  aguardando_publicacao: {
    dot: 'bg-chart-5',
    badge: 'bg-chart-5/10 text-chart-5',
  },
  erro_coleta: {
    dot: 'bg-destructive',
    badge: 'bg-destructive/10 text-destructive',
  },
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: MeetingState }) {
  const { badge } = STATUS_STYLES[state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        badge,
      )}
    >
      <span className={cn('size-1.5 rounded-full', STATUS_STYLES[state].dot)} />
      {STATUS_LABEL[state]}
    </span>
  )
}

function MeetingListItem({
  meeting,
  isSelected,
  onClick,
}: {
  meeting: MeetingSummary
  isSelected: boolean
  onClick: () => void
}) {
  const { dot } = STATUS_STYLES[meeting.state]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-left transition-colors',
        isSelected
          ? 'border-primary/40 bg-primary/8 text-foreground'
          : 'border-transparent bg-card hover:border-border hover:bg-card/80 text-foreground',
      )}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              R{String(meeting.round).padStart(2, '0')}
            </span>
            <span
              className={cn('size-1.5 shrink-0 rounded-full', dot)}
              aria-hidden="true"
            />
          </div>
          <p
            className={cn(
              'mt-0.5 truncate text-sm font-semibold leading-tight',
              isSelected ? 'text-primary' : 'text-foreground',
            )}
          >
            {meeting.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meeting.city}
          </p>
        </div>
      </div>
    </button>
  )
}

function MeetingDetail({ meeting }: { meeting: MeetingSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      {/* Rodada */}
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Rodada {meeting.round}
      </p>

      {/* Nome */}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {meeting.name}
      </h2>

      {/* Cidade */}
      <p className="mt-2 text-xl text-muted-foreground">{meeting.city}</p>

      {/* Status */}
      <div className="mt-6">
        <StatusBadge state={meeting.state} />
      </div>

      {/* Atualizado em */}
      {meeting.updatedAt && (
        <p className="mt-6 text-xs text-muted-foreground/60">
          Atualizado em{' '}
          {new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(new Date(meeting.updatedAt))}
        </p>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  meetings: MeetingSummary[]
  fetchError: string | null
}

export function MeetingSelector({ meetings, fetchError }: Props) {
  const [selected, setSelected] = useState<MeetingSummary | null>(
    meetings.length > 0 ? meetings[0] : null,
  )

  // Estado de erro (fetch falhou no servidor)
  if (fetchError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
        <p className="text-sm font-medium text-destructive">{fetchError}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  // Lista vazia após fetch bem-sucedido
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma etapa disponível no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── Menu lateral ───────────────────────────────────────────── */}
      <aside
        aria-label="Lista de etapas"
        className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
      >
        {/* Mobile: select */}
        <div className="lg:hidden">
          <label htmlFor="meeting-select" className="sr-only">
            Selecionar etapa
          </label>
          <select
            id="meeting-select"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={selected?.slug ?? ''}
            onChange={(e) => {
              const m = meetings.find((m) => m.slug === e.target.value)
              if (m) setSelected(m)
            }}
          >
            {meetings.map((m) => (
              <option key={m.slug} value={m.slug}>
                R{String(m.round).padStart(2, '0')} — {m.name} ({m.city})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: lista clicável */}
        <div className="hidden flex-col gap-1 lg:flex">
          {meetings.map((meeting) => (
            <MeetingListItem
              key={meeting.slug}
              meeting={meeting}
              isSelected={selected?.slug === meeting.slug}
              onClick={() => setSelected(meeting)}
            />
          ))}
        </div>
      </aside>

      {/* ── Área principal ─────────────────────────────────────────── */}
      <section aria-label="Detalhes da etapa selecionada">
        {selected ? (
          <MeetingDetail meeting={selected} />
        ) : (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Selecione uma etapa para ver os detalhes.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
