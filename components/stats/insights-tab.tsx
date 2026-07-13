'use client'

import { Trophy, Globe, Users, Zap, Award, Cake } from 'lucide-react'
import { CountryFlag } from '@/components/country-flag'
import { AthleteDisclosure } from '@/components/athlete-disclosure'
import { displayName } from '@/lib/diamond-league/format'

interface PerfLite {
  athlete: string
  athleteId: string
  country: string
  discipline: string
  mark: string
  meetingName: string
  age: number | null
}

export interface Insights {
  totalPerformances: number
  totalAthletes: number
  totalCountries: number
  worldLeads: number
  meetingRecords: number
  nationalRecords: number
  mostWins: { athleteId: string; name: string; country: string; wins: number } | null
  mostWorldLeads: { athleteId: string; name: string; country: string; count: number } | null
  youngestPodium: PerfLite | null
  oldestPodium: PerfLite | null
}

export function InsightsTab({ insights }: { insights: Insights }) {
  return (
    <div className="space-y-6">
      {/* Números da temporada */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Zap className="size-4" />} label="Resultados" value={insights.totalPerformances} />
        <StatCard icon={<Users className="size-4" />} label="Atletas" value={insights.totalAthletes} />
        <StatCard icon={<Globe className="size-4" />} label="Países" value={insights.totalCountries} />
        <StatCard icon={<Trophy className="size-4" />} label="World Leads" value={insights.worldLeads} accent />
        <StatCard icon={<Award className="size-4" />} label="Rec. Meeting" value={insights.meetingRecords} />
        <StatCard icon={<Award className="size-4" />} label="Rec. Nacionais" value={insights.nationalRecords} />
      </div>

      {/* Destaques */}
      <div className="grid gap-3 md:grid-cols-2">
        {insights.mostWins && (
          <HighlightCard
            title="Mais vitórias na temporada"
            athleteId={insights.mostWins.athleteId}
            name={insights.mostWins.name}
            country={insights.mostWins.country}
            value={`${insights.mostWins.wins} vitórias`}
            icon={<Trophy className="size-5 text-primary" />}
          />
        )}
        {insights.mostWorldLeads && (
          <HighlightCard
            title="Mais melhores marcas mundiais (WL)"
            athleteId={insights.mostWorldLeads.athleteId}
            name={insights.mostWorldLeads.name}
            country={insights.mostWorldLeads.country}
            value={`${insights.mostWorldLeads.count} WL`}
            icon={<Zap className="size-5 text-primary" />}
          />
        )}
        {insights.youngestPodium && (
          <HighlightCard
            title="Pódio mais jovem"
            athleteId={insights.youngestPodium.athleteId}
            name={insights.youngestPodium.athlete}
            country={insights.youngestPodium.country}
            value={`${insights.youngestPodium.age} anos`}
            sub={`${insights.youngestPodium.discipline} · ${insights.youngestPodium.mark}`}
            icon={<Cake className="size-5 text-accent" />}
          />
        )}
        {insights.oldestPodium && (
          <HighlightCard
            title="Pódio mais experiente"
            athleteId={insights.oldestPodium.athleteId}
            name={insights.oldestPodium.athlete}
            country={insights.oldestPodium.country}
            value={`${insights.oldestPodium.age} anos`}
            sub={`${insights.oldestPodium.discipline} · ${insights.oldestPodium.mark}`}
            icon={<Cake className="size-5 text-accent" />}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={accent ? 'text-primary' : 'text-muted-foreground'}>{icon}</div>
      <p className="mt-2 font-mono text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function HighlightCard({
  title,
  athleteId,
  name,
  country,
  value,
  sub,
  icon,
}: {
  title: string
  athleteId: string
  name: string
  country: string
  value: string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <AthleteDisclosure athleteId={athleteId} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40" triggerClassName="items-start gap-4">
      <div className="grid size-11 place-items-center rounded-full bg-muted">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="flex flex-wrap items-center gap-2 break-words text-base font-semibold leading-snug text-foreground">
          <CountryFlag code={country} className="size-4 shrink-0" />
          {displayName(name)}
        </p>
        {sub && <p className="break-words text-xs leading-relaxed text-muted-foreground">{sub}</p>}
      </div>
      <span className="shrink-0 font-mono text-sm font-bold text-primary">{value}</span>
    </AthleteDisclosure>
  )
}
