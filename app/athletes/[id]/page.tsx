import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getAthleteById, ageFromDob } from '@/lib/diamond-league/athletes'
import { countryName } from '@/lib/diamond-league/countries'
import { displayName } from '@/lib/diamond-league/format'
import { GENDER_LABELS } from '@/lib/diamond-league/utils'
import { CountryFlag } from '@/components/country-flag'
import { AthleteAvatar } from '@/components/athlete-avatar'
import { AthleteDisciplines } from '@/components/athlete-disciplines'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const athlete = getAthleteById(id)
  if (!athlete) return { title: 'Atleta não encontrado' }
  return {
    title: `${displayName(athlete.name)} — Diamond League 2026`,
    description: `Perfil, marcas e resultados de ${displayName(athlete.name)} (${athlete.country}) na Wanda Diamond League 2026.`,
  }
}

export default async function AthletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const athlete = getAthleteById(id)
  if (!athlete) notFound()

  const age = ageFromDob(athlete.dob)
  const name = displayName(athlete.name)

  const stats = [
    { label: 'Pontos DL', value: athlete.totalPoints },
    { label: 'Vitórias', value: athlete.wins },
    { label: 'Pódios', value: athlete.podiums },
    { label: 'Etapas', value: athlete.meetingsCount },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/athletes"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os atletas
      </Link>

      {/* Cabeçalho do perfil */}
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <AthleteAvatar
            id={athlete.legacyId}
            name={athlete.name}
            country={athlete.country}
            className="size-24 shrink-0 text-2xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-pretty text-3xl font-bold tracking-tight">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag code={athlete.country} className="size-4" />
                {countryName(athlete.country)}
              </span>
              <span aria-hidden="true">•</span>
              <span>{GENDER_LABELS[athlete.gender]}</span>
              <span aria-hidden="true">•</span>
              <span>{age !== null ? `${age} anos` : 'Idade não informada pela fonte'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {athlete.disciplines.slice(0, 4).map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {d}
                </span>
              ))}
            </div>
            {athlete.officialProfileUrl && (
              <a
                href={athlete.officialProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Perfil oficial Diamond League
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-4 border-t border-border">
          {stats.map((s) => (
            <div key={s.label} className="border-r border-border px-3 py-4 text-center last:border-r-0">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Marcas e resultados por disciplina */}
      <div className="mt-8">
        <AthleteDisciplines athlete={athlete} />
      </div>
    </main>
  )
}
