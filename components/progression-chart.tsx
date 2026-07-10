'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'

export interface ProgressionPoint {
  label: string
  value: number
  display: string
  meeting: string
}

const chartConfig = {
  value: { label: 'Marca', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function ProgressionChart({
  data,
  invert,
}: {
  data: ProgressionPoint[]
  /** Para provas de tempo, menor é melhor: invertemos o eixo Y. */
  invert?: boolean
}) {
  if (data.length < 2) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        Dados insuficientes para traçar a progressão (é preciso ao menos duas marcas válidas).
      </p>
    )
  }

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.15 || 1

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          domain={[min - pad, max + pad]}
          reversed={invert}
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => v.toFixed(2)}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const p = payload[0].payload as ProgressionPoint
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                <p className="font-semibold text-foreground">{p.display}</p>
                <p className="text-muted-foreground">{p.meeting}</p>
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--color-value)' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
