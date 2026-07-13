export type TimeDisplayMode = 'venue' | 'user'

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function venueDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const zoned = partsInZone(new Date(guess), timeZone)
  const represented = Date.UTC(
    Number(zoned.year), Number(zoned.month) - 1, Number(zoned.day),
    Number(zoned.hour), Number(zoned.minute), Number(zoned.second),
  )
  return new Date(guess - (represented - guess))
}

export function displayEventTime(
  date: string,
  time: string,
  venueTimeZone: string,
  mode: TimeDisplayMode,
) {
  if (mode === 'venue') return time
  const instant = venueDateTimeToUtc(date, time, venueTimeZone)
  if (!instant) return time
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(instant)
}

export function userTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
