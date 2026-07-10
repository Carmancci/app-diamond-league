const NOTES: { code: string; label: string }[] = [
  { code: 'WL', label: 'Melhor marca mundial do ano' },
  { code: 'DLR', label: 'Recorde da Diamond League' },
  { code: 'MR', label: 'Recorde do meeting' },
  { code: 'AR', label: 'Recorde de área/continental' },
  { code: 'NR', label: 'Recorde nacional' },
  { code: 'PB', label: 'Recorde pessoal' },
  { code: 'SB', label: 'Melhor marca da temporada' },
]

/** Mapa código → rótulo, para tooltips em qualquer parte do app. */
export const NOTE_LABELS: Record<string, string> = Object.fromEntries(
  NOTES.map((n) => [n.code, n.label]),
)

export function NoteLegend() {
  return (
    <details className="group rounded-xl border border-border bg-card px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
        Legenda das siglas
        <span className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {NOTES.map((n) => (
          <li key={n.code} className="flex items-center gap-2 text-xs">
            <span className="w-9 shrink-0 rounded bg-muted px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-foreground">
              {n.code}
            </span>
            <span className="text-muted-foreground">{n.label}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
