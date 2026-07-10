'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, User, CalendarDays, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountryFlag } from '@/components/country-flag'
import type { SearchIndexItem } from '@/app/api/search-index/route'

const TYPE_META = {
  athlete: { icon: User, label: 'Atletas' },
  meeting: { icon: CalendarDays, label: 'Etapas' },
  discipline: { icon: BarChart3, label: 'Modalidades' },
} as const

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchIndexItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Atalho de teclado Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Carrega o índice na primeira abertura
  useEffect(() => {
    if (open && !index && !loading) {
      setLoading(true)
      fetch('/api/search-index')
        .then((r) => r.json())
        .then((d) => setIndex(d.items ?? []))
        .catch(() => setIndex([]))
        .finally(() => setLoading(false))
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, index, loading])

  const results = useMemo(() => {
    if (!index || query.trim().length < 2) return []
    const q = normalize(query)
    return index
      .filter((it) => normalize(it.label).includes(q) || normalize(it.sub).includes(q))
      .slice(0, 24)
  }, [index, query])

  const grouped = useMemo(() => {
    const g: Record<string, SearchIndexItem[]> = { athlete: [], meeting: [], discipline: [] }
    for (const r of results) g[r.type].push(r)
    return g
  }, [results])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Buscar"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar atletas, etapas...</span>
        <kbd className="ml-2 hidden rounded border border-border px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-background/70 p-4 pt-[10vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar atletas, etapas ou modalidades..."
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Digite ao menos 2 caracteres para buscar.
                </p>
              ) : loading ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Carregando…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado para “{query}”.
                </p>
              ) : (
                (['athlete', 'meeting', 'discipline'] as const).map((type) =>
                  grouped[type].length === 0 ? null : (
                    <div key={type} className="mb-2">
                      <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {TYPE_META[type].label}
                      </div>
                      {grouped[type].map((it) => {
                        const Icon = TYPE_META[it.type].icon
                        return (
                          <button
                            key={it.href}
                            type="button"
                            onClick={() => go(it.href)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary"
                          >
                            {it.country ? (
                              <CountryFlag code={it.country} className="size-5 shrink-0" />
                            ) : (
                              <Icon className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {it.label}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {it.sub}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
