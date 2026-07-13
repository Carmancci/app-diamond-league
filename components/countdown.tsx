'use client'

import { useEffect, useState } from 'react'

interface CountdownProps {
  target: string // ISO date
  className?: string
}

function diff(target: Date) {
  const total = target.getTime() - Date.now()
  const clamped = Math.max(0, total)
  return {
    total,
    days: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    hours: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((clamped / (1000 * 60)) % 60),
    seconds: Math.floor((clamped / 1000) % 60),
  }
}

export function Countdown({ target }: CountdownProps) {
  const [time, setTime] = useState<ReturnType<typeof diff> | null>(null)

  useEffect(() => {
    const update = () => setTime(diff(new Date(target)))
    const initial = window.setTimeout(update, 0)
    const interval = window.setInterval(update, 1000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [target])

  const units = [
    { label: 'Dias', value: time?.days },
    { label: 'Horas', value: time?.hours },
    { label: 'Min', value: time?.minutes },
    { label: 'Seg', value: time?.seconds },
  ]

  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-live="off">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-14 flex-1 flex-col items-center rounded-lg border border-border bg-card px-2 py-3 sm:min-w-16"
        >
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {u.value === undefined ? '--' : String(u.value).padStart(2, '0')}
          </span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  )
}
