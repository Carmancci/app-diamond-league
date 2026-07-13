'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight } from 'lucide-react'
import type { AthleteProfile } from '@/lib/diamond-league/athletes'
import { AthleteAvatar } from '@/components/athlete-avatar'
import { CountryFlag } from '@/components/country-flag'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (!response.ok) throw new Error('Não foi possível carregar o perfil.')
  return (await response.json()) as { athlete: AthleteProfile }
})

export function AthleteQuickView() {
  const [athleteId, setAthleteId] = useState<string | null>(null)
  const { data, error, isLoading } = useSWR(athleteId ? `/api/athletes/${athleteId}` : null, fetcher)

  useEffect(() => {
    const openFromUrl = () => setAthleteId(new URL(window.location.href).searchParams.get('atleta'))
    const controller = new AbortController()
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-athlete-quick-view]')
      if (!link || link.target === '_blank') return
      const id = link.pathname.split('/').filter(Boolean)[1]
      if (!id) return
      event.preventDefault()
      const url = new URL(window.location.href)
      url.searchParams.set('atleta', id)
      window.history.pushState({}, '', url)
      setAthleteId(id)
    }
    openFromUrl()
    document.addEventListener('click', onClick, { capture: true, signal: controller.signal })
    window.addEventListener('popstate', openFromUrl, { signal: controller.signal })
    return () => controller.abort()
  }, [])

  const close = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('atleta')
    window.history.replaceState({}, '', url)
    setAthleteId(null)
  }

  const athlete = data?.athlete
  const best = athlete?.byDiscipline[0]?.best

  return (
    <Dialog open={Boolean(athleteId)} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogTitle className="sr-only">Perfil rápido do atleta</DialogTitle>
        <DialogDescription className="sr-only">Resumo da temporada sem sair da página atual.</DialogDescription>
        {isLoading && <div className="flex flex-col gap-4" aria-label="Carregando perfil"><Skeleton className="size-20 rounded-full" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-28 w-full" /></div>}
        {error && <div className="py-10 text-center"><p className="font-semibold">Perfil indisponível</p><p className="mt-2 text-sm text-muted-foreground">Tente novamente ou abra a página completa.</p></div>}
        {athlete && (
          <div className="flex flex-col gap-6">
            <header className="flex items-center gap-4 pr-10">
              <AthleteAvatar id={athlete.id} name={athlete.name} country={athlete.country} className="size-20 shrink-0" />
              <div className="min-w-0"><div className="flex items-center gap-2"><CountryFlag code={athlete.country} className="size-5" /><span className="text-xs text-muted-foreground">{athlete.country}</span></div><h2 className="mt-1 text-balance text-2xl font-bold">{athlete.name}</h2><p className="text-sm text-muted-foreground">{athlete.gender === 'men' ? 'Masculino' : 'Feminino'} · {athlete.meetingsCount} etapas</p></div>
            </header>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Melhor marca" value={best?.mark ?? '—'} />
              <Metric label="Vitórias" value={String(athlete.wins)} />
              <Metric label="Pontos" value={String(athlete.totalPoints)} />
            </div>
            <div className="flex flex-wrap gap-2">{athlete.byDiscipline.map((item) => <span key={item.discipline} className="rounded-full border border-border bg-muted px-3 py-1 text-xs">{item.discipline}</span>)}</div>
            <Link href={`/athletes/${athlete.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Ver perfil completo <ArrowUpRight className="size-4" /></Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-lg font-bold text-primary">{value}</p></div>
}
