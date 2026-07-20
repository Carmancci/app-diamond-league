/**
 * athlete-profile.mjs
 *
 * Parser e classificador de perfis de atletas da Diamond League.
 * Centraliza toda a lógica de:
 *   - classificação de resultado (success | permanent_error | temporary_error | skipped_cache)
 *   - parsing de DOB, PB e SB do HTML
 *   - decisão sobre cache (shouldSkip / shouldForce)
 *   - sanitização de nomes vindos do site oficial
 *
 * Nenhuma função aqui faz I/O nem rede — facilita testes sem mocks pesados.
 */

// ---------------------------------------------------------------------------
// Constantes públicas
// ---------------------------------------------------------------------------

/** Status possíveis para cada tentativa de scraping */
export const STATUS = /** @type {const} */ ({
  SUCCESS: 'success',
  PERMANENT_ERROR: 'permanent_error',
  TEMPORARY_ERROR: 'temporary_error',
  SKIPPED_CACHE: 'skipped_cache',
})

/** Sufixo indesejado que o site injeta no <title> de páginas vazias */
const WANDA_SUFFIX = /\s*-\s*Wanda Diamond League\s*$/i

/** HTTP status codes que indicam erro temporário (retriável) */
const TEMPORARY_HTTP_CODES = new Set([429, 500, 502, 503, 504])

// ---------------------------------------------------------------------------
// Sanitização de strings vindas do site
// ---------------------------------------------------------------------------

/**
 * Remove o sufixo "- Wanda Diamond League" do nome capturado do <title>.
 * Retorna null se o resultado ficar vazio.
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function sanitizeName(raw) {
  if (!raw) return null
  const cleaned = raw.replace(WANDA_SUFFIX, '').trim()
  return cleaned.length > 0 ? cleaned : null
}

// ---------------------------------------------------------------------------
// Extração de DOB, PB e SB do HTML
// ---------------------------------------------------------------------------

const MONTH_MAP = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04',
  MAY: '05', JUN: '06', JUL: '07', AUG: '08',
  SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

/**
 * Converte "16 JUL 1994" → "1994-07-16".
 * @param {string} raw
 * @returns {string | null}
 */
export function parseDobString(raw) {
  const m = raw.match(/^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})$/i)
  if (!m) return null
  const [, day, month, year] = m
  return `${year}-${MONTH_MAP[month.toUpperCase()]}-${day.padStart(2, '0')}`
}

/**
 * Extrai DOB do HTML da página de perfil.
 * @param {string} html
 * @returns {string | null}  ISO 8601 (YYYY-MM-DD) ou null
 */
export function extractDob(html) {
  const m = html.match(/(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})/i)
  if (!m) return null
  return parseDobString(`${m[1]} ${m[2]} ${m[3]}`)
}

/**
 * Extrai nome do HTML. Nunca retorna strings com o sufixo Wanda.
 * @param {string} html
 * @returns {string | null}
 */
export function extractName(html) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
  const title = html.match(/<title>([^<]+)<\/title>/)
  return sanitizeName((h1 ?? title)?.[1] ?? null)
}

/**
 * Extrai país do HTML.
 * @param {string} html
 * @returns {string | null}
 */
export function extractCountry(html) {
  const m =
    html.match(/country['"]\s*:\s*['"]([A-Z]{3})['"]/i) ??
    html.match(/<span[^>]*class="athlete-country"[^>]*>([A-Z]{3})</i)
  return m ? m[1] : null
}

/**
 * Extrai mapa de modalidade → marca de uma seção nomeada do HTML.
 * Decodifica entidades HTML básicas (&#039; → apostrofo).
 * @param {string} html
 * @param {string} sectionName  ex: "Personal Best" ou "Season Best"
 * @returns {Record<string, string>}
 */
export function extractMarks(html, sectionName) {
  const marks = /** @type {Record<string, string>} */ ({})

  const sectionRe = new RegExp(`${sectionName}[\\s\\S]*?<table[\\s\\S]*?</table>`, 'i')
  const sectionHtml = html.match(sectionRe)?.[0]
  if (!sectionHtml) return marks

  const rows = sectionHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([^<]*)<\/td>/gi) ?? []
    if (cells.length < 2) continue
    const getText = (c) => c.replace(/<td[^>]*>/, '').replace(/<\/td>/i, '').trim()
    const discipline = decodeHtmlEntities(getText(cells[0]))
      .replace(/^(Women's|Men's)\s+/i, '')
      .trim()
    const mark = decodeHtmlEntities(getText(cells[1])).trim()
    if (discipline && mark && !/^\s*-\s*$/.test(mark)) {
      marks[discipline] = mark
    }
  }
  return marks
}

/**
 * Decodifica entidades HTML numéricas e as mais comuns.
 * @param {string} str
 * @returns {string}
 */
export function decodeHtmlEntities(str) {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/**
 * Extrai todos os campos de interesse de um HTML de perfil.
 * @param {string} html
 * @returns {{ name: string|null, country: string|null, dob: string|null, pb: Record<string,string>, sb: Record<string,string> }}
 */
export function parseProfileHtml(html) {
  return {
    name: extractName(html),
    country: extractCountry(html),
    dob: extractDob(html),
    pb: extractMarks(html, 'Personal Best'),
    sb: extractMarks(html, 'Season Best'),
  }
}

// ---------------------------------------------------------------------------
// Classificação de HTTP response
// ---------------------------------------------------------------------------

/**
 * Dado um código HTTP (ou null para timeout/rede), decide o status da tentativa.
 * @param {number | null} httpStatus
 * @returns {'success' | 'permanent_error' | 'temporary_error'}
 */
export function classifyHttpStatus(httpStatus) {
  if (httpStatus === null) return STATUS.TEMPORARY_ERROR   // timeout / rede
  if (httpStatus >= 200 && httpStatus < 300) return STATUS.SUCCESS
  if (TEMPORARY_HTTP_CODES.has(httpStatus)) return STATUS.TEMPORARY_ERROR
  // 4xx que não sejam 429 → permanente (recurso não existe ou acesso negado)
  return STATUS.PERMANENT_ERROR
}

// ---------------------------------------------------------------------------
// Decisão de cache
// ---------------------------------------------------------------------------

/**
 * Decide se um entrada de cache deve ser ignorada numa execução normal.
 *
 * Regras de compatibilidade com formatos legados:
 *   - sem campo `status`  + tem dob/pb/sb    → tratar como success → skip
 *   - sem campo `status`  + sem dob/pb/sb    → tratar como falha antiga → reprocessar
 *   - status === 'success'                   → skip
 *   - status === 'permanent_error'           → skip (já marcado como definitivo)
 *   - status === 'temporary_error'           → reprocessar
 *   - qualquer outro valor                   → reprocessar (defensivo)
 *
 * @param {Record<string, unknown>} cached  Objeto JSON do cache
 * @param {boolean} force  Flag --force da CLI
 * @returns {boolean}  true = ignorar / false = (re)processar
 */
export function shouldSkipCache(cached, force) {
  if (force) return false

  const s = cached?.status

  // Legado sem campo status
  if (s === undefined || s === null) {
    const hasDob = Boolean(cached.dob)
    const hasPb = typeof cached.pb === 'object' && cached.pb !== null && Object.keys(cached.pb).length > 0
    const hasSb = typeof cached.sb === 'object' && cached.sb !== null && Object.keys(cached.sb).length > 0
    return hasDob || hasPb || hasSb  // só pula se tiver algum dado útil
  }

  if (s === STATUS.SUCCESS) return true
  if (s === STATUS.PERMANENT_ERROR) return true
  // temporary_error e qualquer outro → reprocessar
  return false
}

// ---------------------------------------------------------------------------
// Construção dos objetos de cache
// ---------------------------------------------------------------------------

/**
 * Monta o objeto de cache para um perfil com dados válidos.
 */
export function buildSuccessCache({ dlId, athleteId, athlete, country, parsed, officialProfileUrl, worldAthleticsUrl }) {
  return {
    dlId,
    athleteId,
    athlete,
    country: parsed.country ?? country,
    dob: parsed.dob,
    pb: parsed.pb,
    sb: parsed.sb,
    officialProfileUrl,
    ...(worldAthleticsUrl ? { worldAthleticsUrl } : {}),
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
    status: STATUS.SUCCESS,
  }
}

/**
 * Monta o objeto de cache para um perfil com erro permanente.
 * Preserva o nome real do atleta vindo do dl-id-map, nunca o título da página.
 */
export function buildPermanentErrorCache({ dlId, athleteId, athlete, country, errorMessage, officialProfileUrl }) {
  return {
    dlId,
    athleteId,
    athlete,   // nome vem do mapa, não do HTML
    country,
    officialProfileUrl,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
    status: STATUS.PERMANENT_ERROR,
    error: errorMessage,
  }
}

/**
 * Monta o objeto de cache para um erro temporário (não deve ser persistido
 * como definitivo — apenas registra para fins de log). O chamador decide
 * se salva ou não.
 */
export function buildTemporaryErrorCache({ dlId, athleteId, athlete, country, errorMessage, officialProfileUrl }) {
  return {
    dlId,
    athleteId,
    athlete,
    country,
    officialProfileUrl,
    scrapedAt: new Date().toISOString(),
    source: 'diamondleague.com',
    status: STATUS.TEMPORARY_ERROR,
    error: errorMessage,
  }
}
