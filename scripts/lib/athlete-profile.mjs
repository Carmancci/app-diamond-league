const MONTHS = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

export function decodeHtml(value = '') {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
}

function textContent(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function dateToIso(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i)
  if (!match || !MONTHS[match[2].toUpperCase()]) return null
  return `${match[3]}-${MONTHS[match[2].toUpperCase()]}-${match[1].padStart(2, '0')}`
}

export function normalizeDisciplineKey(value = '') {
  return decodeHtml(value)
    .replace(/^(women|men)(?:'s|s)?\s+/i, '')
    .replace(/\bmetres?\b/gi, 'm')
    .replace(/(\d)\s+m\b/gi, '$1m')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function sectionTable(html, headingPattern) {
  const heading = html.search(headingPattern)
  if (heading < 0) return ''
  const remainder = html.slice(heading)
  const table = remainder.match(/<table\b[\s\S]*?<\/table>/i)
  return table?.[0] ?? ''
}

function parseMarkTable(table) {
  const marks = {}
  for (const row of table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textContent(match[1]))
    if (cells.length < 2 || !cells[0] || !cells[1]) continue
    marks[normalizeDisciplineKey(cells[0])] = {
      discipline: cells[0],
      mark: cells[1],
      venue: cells[2] || undefined,
      date: cells[3] || undefined,
    }
  }
  return marks
}

export function markDetailsForDiscipline(marks, discipline) {
  const wanted = normalizeDisciplineKey(discipline)
  const direct = marks?.[wanted]
  const value = direct ?? Object.entries(marks ?? {}).find(([key]) => normalizeDisciplineKey(key) === wanted)?.[1]
  if (!value) return undefined
  return typeof value === 'string' ? { mark: value } : value
}

export function markForDiscipline(marks, discipline) {
  return markDetailsForDiscipline(marks, discipline)?.mark
}

export function parseAthleteProfileHtml(html) {
  const bornBlock = html.match(/>\s*Born\s*<[\s\S]{0,500}?(\d{1,2}\s+[A-Z]{3}\s+\d{4})/i)
  const nameMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const worldAthleticsMatch = html.match(/href=["'](https:\/\/worldathletics\.org\/athletes\/[^"']+)["']/i)

  return {
    name: nameMatch ? textContent(nameMatch[1]) : undefined,
    dob: dateToIso(bornBlock?.[1]),
    pb: parseMarkTable(sectionTable(html, />\s*Personal Best\s*</i)),
    sb: parseMarkTable(sectionTable(html, />\s*Season(?:'|&rsquo;|')s Best\s*</i)),
    worldAthleticsUrl: worldAthleticsMatch?.[1],
  }
}

// ---------------------------------------------------------------------------
// Classificação de status de fetch e helpers de cache
// ---------------------------------------------------------------------------

/** Valores canónicos de status para entradas de cache. */
export const STATUS = /** @type {const} */ ({
  SUCCESS: 'success',
  PERMANENT_ERROR: 'permanent_error',
  TEMPORARY_ERROR: 'temporary_error',
  SKIPPED_CACHE: 'skipped_cache',
})

/**
 * Classifica um código HTTP em SUCCESS, PERMANENT_ERROR ou TEMPORARY_ERROR.
 * null/undefined (timeout, fetch failed) é considerado TEMPORARY_ERROR.
 *
 * @param {number | null | undefined} httpStatus
 * @returns {'success' | 'permanent_error' | 'temporary_error'}
 */
export function classifyHttpStatus(httpStatus) {
  if (httpStatus == null) return STATUS.TEMPORARY_ERROR
  if (httpStatus === 200) return STATUS.SUCCESS
  if (httpStatus === 429 || httpStatus >= 500) return STATUS.TEMPORARY_ERROR
  // 4xx exceto 429
  if (httpStatus >= 400 && httpStatus < 500) return STATUS.PERMANENT_ERROR
  // 3xx e outros inesperados
  return STATUS.TEMPORARY_ERROR
}

/**
 * Verifica se uma entrada de cache deve ser ignorada (skip) numa nova execução.
 * Compatível com caches legados que não têm campo `status`.
 *
 * @param {object | null} cached
 * @returns {boolean}
 */
export function shouldSkipCache(cached) {
  if (!cached) return false
  // Cache novo: respeitar o campo status
  if (cached.status === STATUS.SUCCESS) return true
  if (cached.status === STATUS.PERMANENT_ERROR) return true
  if (cached.status === STATUS.TEMPORARY_ERROR) return false
  // Cache legado sem campo status: skip se tiver dados úteis
  const hasDob = Boolean(cached.dob)
  const hasPb = Object.keys(cached.pb ?? {}).length > 0
  const hasSb = Object.keys(cached.sb ?? {}).length > 0
  return hasDob || hasPb || hasSb
}

/**
 * Constrói uma entrada de cache para status = success.
 *
 * @param {{ dlId: string, athleteId: string, athlete: string, country: string,
 *           parsed: ReturnType<typeof parseAthleteProfileHtml>,
 *           officialProfileUrl: string }} opts
 */
export function buildSuccessCache({ dlId, athleteId, athlete, country, parsed, officialProfileUrl }) {
  return {
    status: STATUS.SUCCESS,
    dlId,
    athleteId,
    athlete: parsed.name || athlete,
    country,
    dob: parsed.dob ?? null,
    pb: parsed.pb,
    sb: parsed.sb,
    officialProfileUrl,
    worldAthleticsUrl: parsed.worldAthleticsUrl ?? null,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
  }
}

/**
 * Constrói uma entrada de cache para status = permanent_error.
 *
 * @param {{ dlId: string, athleteId: string, athlete: string, country: string,
 *           errorMessage: string, officialProfileUrl: string }} opts
 */
export function buildPermanentErrorCache({ dlId, athleteId, athlete, country, errorMessage, officialProfileUrl }) {
  return {
    status: STATUS.PERMANENT_ERROR,
    dlId,
    athleteId,
    athlete,
    country,
    dob: null,
    pb: {},
    sb: {},
    officialProfileUrl,
    worldAthleticsUrl: null,
    error: errorMessage,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
  }
}
