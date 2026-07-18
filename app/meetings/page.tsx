import type { Metadata } from 'next'
import { MeetingSelector } from '@/components/meetings/meeting-selector'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MeetingState =
  | 'confirmado_oficial'
  | 'aguardando_publicacao'
  | 'erro_coleta'

export interface MeetingSummary {
  round: number
  slug: string
  name: string
  city: string
  state: MeetingState
  updatedAt?: string
  events: unknown
}

interface LiveData {
  season: number
  generatedAt: string
  meetings: MeetingSummary[]
}

// ─── Metadados ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Etapas — Diamond League 2026',
  description: 'Calendário completo das 15 etapas da Wanda Diamond League 2026.',
}

// ─── Constante ────────────────────────────────────────────────────────────────

const DATA_URL =
  'https://7xjypg3bbjvaaipt.public.blob.vercel-storage.com/diamond-league/live-data-Ty5Ewc8BS5Jb1PROi4OIxYzEj3kkCQ.json'

// ─── Server Component ─────────────────────────────────────────────────────────

export default async function MeetingsPage() {
  let meetings: MeetingSummary[] = []
  let fetchError: string | null = null

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' })

    if (!res.ok) {
      fetchError = `Erro ao carregar dados (HTTP ${res.status}).`
    } else {
      const data: LiveData = await res.json()

      if (!Array.isArray(data.meetings)) {
        fetchError = 'Formato de dados inesperado — meetings não é uma lista.'
      } else {
        meetings = data.meetings.filter((m) => Boolean(m.name))
      }
    }
  } catch {
    fetchError = 'Não foi possível conectar ao servidor de dados.'
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <section className="pt-12 sm:pt-16">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Temporada 2026
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Etapas
        </h1>
      </section>

      <div className="mt-10">
        <MeetingSelector meetings={meetings} fetchError={fetchError} />
      </div>
    </main>
  )
}
