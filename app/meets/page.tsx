'use client'

import { useEffect, useState } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Meeting {
  round: number
  slug: string
  name: string
  city: string
  state: 'confirmado_oficial' | 'aguardando_publicacao' | 'erro_coleta'
  events: unknown
}

interface LiveData {
  season: number
  meetings: Meeting[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Meeting['state'], string> = {
  confirmado_oficial: 'Oficial',
  aguardando_publicacao: 'Em breve',
  erro_coleta: 'Erro',
}

const STATUS_DOT: Record<Meeting['state'], string> = {
  confirmado_oficial: 'bg-chart-4',        // verde
  aguardando_publicacao: 'bg-chart-5',     // âmbar
  erro_coleta: 'bg-destructive',           // vermelho
}

const STATUS_BADGE: Record<Meeting['state'], string> = {
  confirmado_oficial: 'text-chart-4 bg-chart-4/10',
  aguardando_publicacao: 'text-chart-5 bg-chart-5/10',
  erro_coleta: 'text-destructive bg-destructive/10',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MeetingSkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-md bg-muted"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}

// ─── Menu lateral ─────────────────────────────────────────────────────────────

function MeetingListItem({
  meeting,
  isSelected,
  onClick,
}: {
  meeting: Meeting
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        'group w-full rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-muted',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        {/* Número da etapa */}
        <span
          className={[
            'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold tabular-nums',
            isSelected
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          {meeting.round}
        </span>

        {/* Nome */}
        <span className="flex-1 truncate text-sm font-semibold leading-tight">
          {meeting.name}
        </span>

        {/* Indicador de estado */}
        <span
          className={[
            'size-2 shrink-0 rounded-full',
            STATUS_DOT[meeting.state],
          ].join(' ')}
          aria-label={STATUS_LABEL[meeting.state]}
        />
      </div>

      {/* Cidade */}
      <p
        className={[
          'mt-0.5 ml-7 text-xs leading-tight',
          isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground',
        ].join(' ')}
      >
        {meeting.city}
      </p>
    </button>
  )
}

// ─── Painel principal ─────────────────────────────────────────────────────────

function MeetingDetail({ meeting }: { meeting: Meeting }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Etapa {meeting.round} · Temporada 2026
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
              {meeting.name}
            </h2>
            <p className="mt-1 text-base text-muted-foreground">{meeting.city}</p>
          </div>

          {/* Badge de status */}
          <span
            className={[
              'mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              STATUS_BADGE[meeting.state],
            ].join(' ')}
          >
            <span className={['size-1.5 rounded-full', STATUS_DOT[meeting.state]].join(' ')} />
            {STATUS_LABEL[meeting.state]}
          </span>
        </div>
      </div>

      {/* Placeholder para os próximos níveis */}
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Próxima etapa de desenvolvimento
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modalidades e atletas serão carregados aqui
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

const LIVE_DATA_URL =
  'https://7xjypg3bbjvaaipt.public.blob.vercel-storage.com/diamond-league/live-data-Ty5Ewc8BS5Jb1PROi4OIxYzEj3kkCQ.json'

export default function MeetsPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchLiveData() {
      try {
        const res = await fetch(LIVE_DATA_URL, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: LiveData = await res.json()
        setLiveData(data)
        setSelectedMeeting(data.meetings[0] ?? null)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Não foi possível carregar os dados. Tente novamente.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-10">
      {/* Cabeçalho da seção */}
      <section className="mb-8">
        <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {liveData ? `Temporada ${liveData.season}` : 'Diamond League'}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Etapas
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Selecione uma etapa para ver o calendário de modalidades e os atletas inscritos.
        </p>
      </section>

      {/* Erro global */}
      {error && (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Layout dividido: menu lateral + painel principal */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ── NÍVEL 1: Menu lateral de etapas ── */}
        <aside aria-label="Lista de etapas">
          <div className="sticky top-20">
            <p className="mb-2 px-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Etapas {liveData?.season ?? '2026'}
            </p>

            <div className="rounded-xl border border-border bg-card p-2">
              {loading ? (
                <MeetingSkeleton />
              ) : (
                <nav className="space-y-0.5">
                  {liveData?.meetings
                    .filter((m) => m.name)
                    .map((meeting) => (
                      <MeetingListItem
                        key={meeting.slug}
                        meeting={meeting}
                        isSelected={selectedMeeting?.slug === meeting.slug}
                        onClick={() => setSelectedMeeting(meeting)}
                      />
                    ))}
                </nav>
              )}
            </div>
          </div>
        </aside>

        {/* ── Painel principal ── */}
        <section aria-label="Detalhes da etapa selecionada">
          {loading ? (
            // Skeleton do painel
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="h-64 animate-pulse rounded-xl bg-muted" style={{ animationDelay: '80ms' }} />
            </div>
          ) : selectedMeeting ? (
            <MeetingDetail meeting={selectedMeeting} />
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-32">
              <p className="text-sm text-muted-foreground">Nenhuma etapa disponível.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
