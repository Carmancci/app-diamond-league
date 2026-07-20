'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import useSWR from 'swr'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { AthleteAvatar } from '@/components/athlete-avatar'
import { CountryFlag } from '@/components/country-flag'
import { Skeleton } from '@/components/ui/skeleton'
import { displayName } from '@/lib/diamond-league/format'
import { disciplinePtBr } from '@/lib/diamond-league/i18n'
import { ageFromDob, type AthleteProfile } from '@/lib/diamond-league/athletes'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Perfil indisponível')
  const payload = (await response.json()) as { athlete: AthleteProfile }
  return payload.athlete
}

interface AthleteDisclosureProps {
  athleteId: string
  children: React.ReactNode
  className?: string
  triggerClassName?: string
  panelClassName?: string
}

export function AthleteDisclosure({
  athleteId,
  children,
  className,
  triggerClassName,
  panelClassName,
}: AthleteDisclosureProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const { data: athlete, error, isLoading } = useSWR(
    open ? `/api/athletes/${athleteId}` : null,
    fetcher,
  )

  return (
    <div className={cn('min-w-0', className)} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) setOpen(false)
    }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn('group flex w-full min-w-0 items-center gap-2 text-left', triggerClassName)}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180 text-primary')}
        />
        <span className="sr-only">{open ? 'Fechar resumo do atleta' : 'Abrir resumo do atleta'}</span>
      </button>

      {open && (
        <div
          id={panelId}
          className={cn('col-span-full mt-2 w-full min-w-0 break-words rounded-lg border border-border bg-muted/30 p-4 text-left', panelClassName)}
        >
          {isLoading && <DisclosureSkeleton />}
          {error && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-destructive">Não foi possível carregar o resumo agora.</p>
              <Link href={`/athletes/${athleteId}`} className="font-semibold text-primary hover:underline">
                Abrir perfil completo
              </Link>
            </div>
          )}
          {athlete && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AthleteAvatar id={athlete.legacyId} name={athlete.name} country={athlete.country} className="size-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-snug text-foreground">{displayName(athlete.name)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    <CountryFlag code={athlete.country} className="size-4 shrink-0" />
                    <span>{athlete.country}</span>
                    <span aria-hidden="true">·</span>
                    <span>{athlete.gender === 'men' ? 'Masculino' : 'Feminino'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ageFromDob(athlete.dob) !== null ? `${ageFromDob(athlete.dob)} anos` : 'Idade não informada pela fonte'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Pontos" value={athlete.totalPoints} />
                <Metric label="Vitórias" value={athlete.wins} />
                <Metric label="Pódios" value={athlete.podiums} />
                <Metric label="Etapas" value={athlete.meetingsCount} />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Modalidades e melhores marcas</p>
                <div className="mt-2 grid gap-2">
                  {athlete.byDiscipline.map((summary) => (
                    <div key={summary.discipline} className="rounded-md bg-background p-3">
                      <p className="break-words text-sm font-semibold text-foreground">{disciplinePtBr(summary.discipline)}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-2">
                        <Mark label="Season Best (SB)" value={summary.seasonBest} />
                        <Mark label="Personal Best (PB)" value={summary.personalBest} />
                      </dl>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/athletes/${athlete.id}`}
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Ver perfil completo
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Mark({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-mono text-sm font-bold text-foreground">
        {value ?? 'Não informado pela fonte'}
      </dd>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background p-2">
      <p className="font-mono text-base font-bold text-foreground">{value}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{label}</p>
    </div>
  )
}

function DisclosureSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Carregando resumo do atleta">
      <div className="flex items-center gap-3"><Skeleton className="size-14 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-5 w-40 max-w-full" /><Skeleton className="h-4 w-24" /></div></div>
      <Skeleton className="h-16 w-full" />
    </div>
  )
}
