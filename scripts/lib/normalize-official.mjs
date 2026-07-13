import { categoryFor } from './parse-pdf.mjs'

export const NORMALIZER_VERSION = '2.0.0'

const STATUS_VALUES = new Set(['DNS', 'DNF', 'DQ', 'NM', 'DSQ', 'WD'])

function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return value.Result ? asArray(value.Result) : [value]
}

function normalizeDiscipline(name = '') {
  return name.replace(/\s+(Men|Women)$/i, '').trim()
}

function listType(info, meetingDate) {
  const name = String(info?.List_Name ?? '').toLowerCase()
  if (name.includes('entr') || name.includes('start')) return 'inscritos'
  if (!name.includes('result')) return 'programa'
  const hasEnded = new Date(`${meetingDate}T23:59:59Z`).getTime() < Date.now()
  return hasEnded ? 'resultados_finais' : 'resultados_parciais'
}

function eventPhase(info) {
  const names = info?.Round_Names
  if (typeof names === 'string') return names
  if (names && typeof names === 'object') return names.en ?? names.fr
  return info?.IsFinal ? 'Final' : undefined
}

function athleteSlug(name, country) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${slug}-${String(country).toLowerCase()}`
}

function normalizeAthlete(row) {
  const status = row.Status ?? row.ResultStatus ?? (STATUS_VALUES.has(row.BestPerformance) ? row.BestPerformance : undefined)
  const notes = [row.RecordFlag, row.QualificationMark, row.Note].filter(Boolean).join(',') || undefined
  const athlete = row.Athlete ?? [row.Lastname, row.Firstname].filter(Boolean).join(' ')
  const country = row.Nation ?? row.Country ?? ''
  return {
    rank: Number.isFinite(Number(row.Rank)) ? Number(row.Rank) : null,
    athlete,
    athleteId: athleteSlug(athlete, country),
    country,
    dob: row.DateOfBirth ?? row.BirthDate,
    bib: row.Bib,
    mark: String(row.BestPerformance ?? row.Performance ?? row.Result ?? status ?? ''),
    note: notes,
    points: Number.isFinite(Number(row.Points)) ? Number(row.Points) : undefined,
    qualificationRank: Number.isFinite(Number(row.DR_Rank)) ? Number(row.DR_Rank) : undefined,
    qualificationPoints: Number.isFinite(Number(row.DR_Points)) ? Number(row.DR_Points) : undefined,
    seasonBest: row.SB ?? row.SeasonBest,
    personalBest: row.PB ?? row.PersonalBest,
    status,
  }
}

function normalizeRecords(records) {
  return asArray(records).map((record) => ({
    name: record.Name ?? '',
    performance: String(record.Performance ?? ''),
    holder: record.Holder,
    holderCountry: record.Holder_Nation,
    location: record.Location,
    date: record.IsoDate ?? record.Date,
  })).filter((record) => record.name && record.performance)
}

function eventId(slug, eventCode, listCode, discipline, gender) {
  const suffix = `${eventCode}-${listCode}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const readable = `${discipline}-${gender}`.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase()
  return `${slug}-${readable}-${suffix}`
}

export function normalizeOfficialMeeting(raw, entry, metadata) {
  const events = []
  const resultData = raw?.Data?.ResultData
  if (!resultData || typeof resultData !== 'object') throw new Error('Feed sem Data.ResultData.')

  for (const [eventCode, event] of Object.entries(resultData)) {
    const discipline = normalizeDiscipline(event.Name)
    const gender = event.Gender === 'M' || /\bMen$/i.test(event.Name) ? 'men' : 'women'
    for (const [listCode, list] of Object.entries(event.Data ?? {})) {
      const info = list.Info ?? {}
      const rows = asArray(list.Results).map(normalizeAthlete).filter((row) => row.athlete)
      events.push({
        id: eventId(entry.slug, eventCode, listCode, discipline, gender),
        discipline,
        category: categoryFor(discipline),
        gender,
        phase: eventPhase(info),
        isPrimary: event.IsDiamondRace !== false,
        isDiamondRace: Boolean(event.IsDiamondRace ?? info.Diamond_Race),
        listType: listType(info, entry.date),
        listLabel: info.List_Name,
        wind: info.Wind,
        startTime: info.Time,
        startDate: info.Date,
        records: normalizeRecords(list.Records),
        results: rows,
      })
    }
  }

  const athleteCount = events.reduce((total, event) => total + event.results.length, 0)
  const isPast = new Date(`${entry.endDate ?? entry.date}T23:59:59Z`).getTime() < Date.now()
  return {
    id: entry.slug,
    slug: entry.slug,
    round: entry.round,
    name: entry.name,
    city: entry.city,
    country: entry.country,
    countryName: entry.countryName,
    stadium: entry.stadium,
    date: entry.date,
    endDate: entry.endDate,
    timezone: entry.timezone,
    isFinal: entry.isFinal ?? false,
    officialUrl: `https://${entry.slug}.diamondleague.com`,
    state: events.length && athleteCount ? 'confirmado_oficial' : isPast ? 'parcial' : 'coletado',
    source: metadata,
    updatedAt: metadata.collectedAt,
    eventCount: events.length,
    athleteCount,
    events,
  }
}

export function sportsFingerprint(meeting) {
  const copy = structuredClone(meeting)
  delete copy.updatedAt
  if (copy.source) {
    delete copy.source.collectedAt
    delete copy.source.diagnosis
  }
  return JSON.stringify(copy)
}
