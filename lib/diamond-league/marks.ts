import type { EventCategory } from './types'

/** Marcas que não representam um resultado válido. */
export const INVALID_MARKS = new Set([
  'DNF', 'DNS', 'DQ', 'NM', 'NH', 'DID NOT START', 'DID NOT FINISH', 'DNQ', 'ABD', 'r',
])

/** Categorias de pista (tempo — menor é melhor). */
const TRACK_CATEGORIES: EventCategory[] = ['sprints', 'middle', 'distance', 'hurdles']

/** True quando a modalidade é medida por tempo (menor é melhor). */
export function isTimedCategory(category: EventCategory): boolean {
  return TRACK_CATEGORIES.includes(category)
}

/**
 * Converte uma marca textual em valor numérico comparável.
 * - Tempos ("9.86", "1:43.55", "12:35.36") → segundos.
 * - Distâncias/alturas ("8.34", "90.12", "2.34") → metros.
 * Retorna null para marcas inválidas (DNF/DNS/DQ/NM...).
 */
export function parseMark(mark: string): number | null {
  if (!mark) return null
  const raw = mark.trim()
  const upper = raw.toUpperCase()
  if (INVALID_MARKS.has(upper)) return null

  // remove sufixos como "w" (vento), "q", "Q", "*", "PB"/etc já vêm em campo separado
  const cleaned = raw.replace(/[^0-9:.]/g, '')
  if (!cleaned) return null

  if (cleaned.includes(':')) {
    const parts = cleaned.split(':').map((p) => Number.parseFloat(p))
    if (parts.some((n) => Number.isNaN(n))) return null
    // suporta mm:ss.xx e hh:mm:ss.xx
    return parts.reduce((acc, n) => acc * 60 + n, 0)
  }

  const val = Number.parseFloat(cleaned)
  return Number.isNaN(val) ? null : val
}

/**
 * Compara duas marcas dentro da mesma categoria.
 * Retorna negativo se `a` é melhor que `b`.
 */
export function compareMarks(a: number, b: number, category: EventCategory): number {
  return isTimedCategory(category) ? a - b : b - a
}

/** Extrai o valor de vento (m/s) de uma string como "+1.5 m/s". */
export function parseWind(wind?: string): number | null {
  if (!wind) return null
  const m = wind.match(/([+-]?\d+(?:\.\d+)?)/)
  return m ? Number.parseFloat(m[1]) : null
}

/** Vento é relevante (e pode ser "ilegal") para velocidade curta e saltos horizontais. */
export function windMatters(discipline: string, category: EventCategory): boolean {
  if (category === 'sprints') return /100m|200m|hurdles|barreiras/i.test(discipline) && !/400/.test(discipline)
  if (category === 'hurdles') return /100m|110m/i.test(discipline)
  if (category === 'jumps') return /long|triple|dist[âa]ncia|triplo/i.test(discipline)
  return false
}

/** Vento legal para fins de recordes: ≤ +2.0 m/s. */
export function isLegalWind(wind: number | null): boolean {
  return wind === null || wind <= 2.0
}
