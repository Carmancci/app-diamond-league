'use client'

import { CountryFlag } from '@/components/country-flag'
import { countryName } from '@/lib/diamond-league/countries'
import type { CountryRow } from '@/lib/diamond-league/stats'

export function CountryTab({ countries }: { countries: CountryRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-2 py-3 font-medium">País</th>
              <th className="px-2 py-3 text-center font-medium" title="Ouro">
                <span className="inline-block size-3 rounded-full bg-[gold]" aria-label="Ouro" />
              </th>
              <th className="px-2 py-3 text-center font-medium" title="Prata">
                <span className="inline-block size-3 rounded-full bg-[silver]" aria-label="Prata" />
              </th>
              <th className="px-2 py-3 text-center font-medium" title="Bronze">
                <span className="inline-block size-3 rounded-full bg-[#cd7f32]" aria-label="Bronze" />
              </th>
              <th className="px-2 py-3 text-center font-medium">Pódios</th>
              <th className="px-2 py-3 text-center font-medium">Atletas</th>
              <th className="px-4 py-3 text-right font-medium">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c, i) => (
              <tr key={c.country} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-3">
                  <span className="flex items-center gap-2">
                    <CountryFlag code={c.country} className="size-4 shrink-0" />
                    <span className="font-medium">{countryName(c.country)}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">{c.country}</span>
                  </span>
                </td>
                <td className="px-2 py-3 text-center font-semibold tabular-nums">{c.golds || '—'}</td>
                <td className="px-2 py-3 text-center tabular-nums">{c.silvers || '—'}</td>
                <td className="px-2 py-3 text-center tabular-nums">{c.bronzes || '—'}</td>
                <td className="px-2 py-3 text-center tabular-nums">{c.podiums || '—'}</td>
                <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{c.athletes}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{c.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
