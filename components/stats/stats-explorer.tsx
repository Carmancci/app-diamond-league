'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DisciplineKey } from '@/lib/diamond-league/stats'
import type { CountryRow, SeasonInsights } from '@/lib/diamond-league/stats'
import type { Gender } from '@/lib/diamond-league/types'
import { TopListTab } from '@/components/stats/top-list-tab'
import { CountryTab } from '@/components/stats/country-tab'
import { RecordsTab, type RecordItem } from '@/components/stats/records-tab'
import { HeadToHeadTab, type H2HAthlete } from '@/components/stats/head-to-head-tab'
import { InsightsTab } from '@/components/stats/insights-tab'

const TABS = [
  { key: 'top', label: 'Top Lists' },
  { key: 'countries', label: 'Países' },
  { key: 'records', label: 'Recordes' },
  { key: 'h2h', label: 'Confronto direto' },
  { key: 'insights', label: 'Destaques' },
] as const

type TabKey = (typeof TABS)[number]['key']

export interface StatsExplorerProps {
  disciplines: DisciplineKey[]
  countries: CountryRow[]
  records: RecordItem[]
  insights: SeasonInsights
  athletes: H2HAthlete[]
}

export function StatsExplorer({
  disciplines,
  countries,
  records,
  insights,
  athletes,
}: StatsExplorerProps) {
  const [tab, setTab] = useState<TabKey>('top')

  return (
    <div>
      <div className="sticky top-14 z-10 -mx-4 mb-6 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur sm:top-16">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'top' && <TopListTab disciplines={disciplines} />}
      {tab === 'countries' && <CountryTab countries={countries} />}
      {tab === 'records' && <RecordsTab records={records} />}
      {tab === 'h2h' && <HeadToHeadTab athletes={athletes} />}
      {tab === 'insights' && <InsightsTab insights={insights} />}
    </div>
  )
}
