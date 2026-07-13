'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

const subscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="grid size-9 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
      aria-label={!mounted ? 'Alternar tema' : isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {/* Evita descasamento de hidratação mostrando o ícone só após montar */}
      {mounted ? (
        isDark ? <Sun className="size-5" /> : <Moon className="size-5" />
      ) : (
        <span className="size-5" />
      )}
    </button>
  )
}
