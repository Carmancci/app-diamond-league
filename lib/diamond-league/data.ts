import type { AthleteResult, EventResult, Meeting, MeetingSummary } from './types'
import indexJson from './generated/index.json'

import shanghai from './generated/shanghai.json'
import xiamen from './generated/xiamen.json'
import rabat from './generated/rabat.json'
import rome from './generated/rome.json'
import stockholm from './generated/stockholm.json'
import oslo from './generated/oslo.json'
import doha from './generated/doha.json'
import paris from './generated/paris.json'
import eugene from './generated/eugene.json'
import monaco from './generated/monaco.json'
import london from './generated/london.json'
import lausanne from './generated/lausanne.json'
import silesia from './generated/silesia.json'
import zurich from './generated/zurich.json'
import brussels from './generated/brussels.json'

/**
 * Wanda Diamond League 2026.
 * Os resultados abaixo são REAIS, extraídos e convertidos dos PDFs oficiais
 * (Swiss Timing / diamondleague.com) pelo script em `scripts/ingest.mjs`.
 * Etapas futuras ficam sem provas até o PDF oficial ser publicado.
 */
export const SEASON_YEAR: number = (indexJson as { season: number }).season ?? 2026

/** Pontuação Diamond League por colocação em provas regulares (top 8). */
const POINTS_BY_RANK = [8, 7, 6, 5, 4, 3, 2, 1]
/** Final: pontuação em dobro para o campeão de cada disciplina. */
const FINAL_POINTS_BY_RANK = [8, 7, 6, 5, 4, 3, 2, 1]

function withPoints(event: EventResult, isFinal: boolean): EventResult {
  if (!event.isPrimary || !event.listType?.startsWith('resultados')) return event
  const table = isFinal ? FINAL_POINTS_BY_RANK : POINTS_BY_RANK
  const results: AthleteResult[] = event.results.map((r) => {
    if (r.rank && r.rank >= 1 && r.rank <= table.length) {
      return { ...r, points: table[r.rank - 1] }
    }
    return r
  })
  return { ...event, results }
}

function hydrate(raw: unknown): Meeting {
  const m = raw as Meeting
  return {
    ...m,
    events: (m.events ?? []).map((e) => withPoints(e, Boolean(m.isFinal))),
  }
}

const RAW_MEETINGS = [
  shanghai, xiamen, rabat, rome, stockholm, oslo, doha, paris, eugene,
  monaco, london, lausanne, silesia, zurich, brussels,
]

export const MEETINGS: Meeting[] = RAW_MEETINGS.map(hydrate).sort((a, b) => a.round - b.round)

export const MEETING_INDEX: MeetingSummary[] =
  (indexJson as { meetings: MeetingSummary[] }).meetings ?? []
