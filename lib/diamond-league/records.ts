import type { EventRecord } from './types'

const PRIORITY: Record<string, number> = {
  'World Record': 0,
  'Diamond League Record': 1,
  'Meeting Record': 2,
  'Area Record': 3,
  'National Record': 4,
  'World Lead': 5,
}

export function prioritizeRecords(records: EventRecord[] = [], eventDate?: string) {
  const eventTime = eventDate ? Date.parse(eventDate) : Number.POSITIVE_INFINITY
  const grouped = new Map<string, EventRecord[]>()

  for (const record of records) {
    const current = grouped.get(record.name) ?? []
    current.push(record)
    grouped.set(record.name, current)
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => (PRIORITY[left] ?? 99) - (PRIORITY[right] ?? 99))
    .flatMap(([, candidates]) => {
      const establishedBeforeEvent = candidates.filter((record) => {
        const date = record.date ? Date.parse(record.date) : Number.NaN
        return Number.isNaN(date) || date < eventTime
      })
      return (establishedBeforeEvent.length ? establishedBeforeEvent : candidates)
        .sort((left, right) => Date.parse(right.date ?? '') - Date.parse(left.date ?? ''))
        .slice(0, 1)
    })
}

export function formatRecordDate(date?: string) {
  if (!date) return 'Data não informada pela fonte'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed)
}

export function recordMeeting(record: EventRecord) {
  return record.meeting || record.location || 'Meeting não informado pela fonte'
}
