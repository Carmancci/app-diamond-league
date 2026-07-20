/**
 * Testes de resiliência do scraper de perfis de atletas.
 * Usa node:test + node:assert. Sem rede real.
 *
 * Execução: node --test tests/scraper.test.mjs
 *         (ou: SCRAPER_BASE_DELAY_MS=0 node --test tests/scraper.test.mjs)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyHttpStatus,
  shouldSkipCache,
  buildSuccessCache,
  buildPermanentErrorCache,
  STATUS,
  parseAthleteProfileHtml,
  decodeHtml,
  dateToIso,
  normalizeDisciplineKey,
  markForDiscipline,
} from '../scripts/lib/athlete-profile.mjs'
import { fetchWithRetry } from '../scripts/scrape-athlete-data.mjs'

// ---------------------------------------------------------------------------
// classifyHttpStatus
// ---------------------------------------------------------------------------
describe('classifyHttpStatus', () => {
  it('200 → SUCCESS', () => {
    assert.equal(classifyHttpStatus(200), STATUS.SUCCESS)
  })
  it('null (timeout/fetch failed) → TEMPORARY_ERROR', () => {
    assert.equal(classifyHttpStatus(null), STATUS.TEMPORARY_ERROR)
  })
  it('undefined → TEMPORARY_ERROR', () => {
    assert.equal(classifyHttpStatus(undefined), STATUS.TEMPORARY_ERROR)
  })
  it('429 → TEMPORARY_ERROR', () => {
    assert.equal(classifyHttpStatus(429), STATUS.TEMPORARY_ERROR)
  })
  it('500 → TEMPORARY_ERROR', () => {
    assert.equal(classifyHttpStatus(500), STATUS.TEMPORARY_ERROR)
  })
  it('503 → TEMPORARY_ERROR', () => {
    assert.equal(classifyHttpStatus(503), STATUS.TEMPORARY_ERROR)
  })
  it('404 → PERMANENT_ERROR', () => {
    assert.equal(classifyHttpStatus(404), STATUS.PERMANENT_ERROR)
  })
  it('403 → PERMANENT_ERROR', () => {
    assert.equal(classifyHttpStatus(403), STATUS.PERMANENT_ERROR)
  })
  it('400 → PERMANENT_ERROR', () => {
    assert.equal(classifyHttpStatus(400), STATUS.PERMANENT_ERROR)
  })
})

// ---------------------------------------------------------------------------
// shouldSkipCache
// ---------------------------------------------------------------------------
describe('shouldSkipCache', () => {
  it('null → não pular', () => {
    assert.equal(shouldSkipCache(null), false)
  })
  it('status=success → pular', () => {
    assert.equal(shouldSkipCache({ status: STATUS.SUCCESS, dob: '1999-01-01', pb: {}, sb: {} }), true)
  })
  it('status=permanent_error → pular', () => {
    assert.equal(shouldSkipCache({ status: STATUS.PERMANENT_ERROR, dob: null, pb: {}, sb: {} }), true)
  })
  it('status=temporary_error → NÃO pular (retry)', () => {
    assert.equal(shouldSkipCache({ status: STATUS.TEMPORARY_ERROR, dob: null, pb: {}, sb: {} }), false)
  })
  it('legado com DOB → pular', () => {
    assert.equal(shouldSkipCache({ dob: '1990-03-15', pb: {}, sb: {} }), true)
  })
  it('legado com PB → pular', () => {
    assert.equal(shouldSkipCache({ dob: null, pb: { '100m': { mark: '9.95' } }, sb: {} }), true)
  })
  it('legado com PB e SB vazios e sem DOB → NÃO pular', () => {
    assert.equal(shouldSkipCache({ dob: null, pb: {}, sb: {} }), false)
  })
  it('legado com campo error (permanent sem status) → NÃO pular', () => {
    // Entrada gerada por versão anterior: tem error mas não tem status
    assert.equal(shouldSkipCache({ error: 'HTTP 404', dob: null, pb: {}, sb: {} }), false)
  })
})

// ---------------------------------------------------------------------------
// buildSuccessCache
// ---------------------------------------------------------------------------
describe('buildSuccessCache', () => {
  it('gera entrada com status=success', () => {
    const parsed = { name: 'Shericka Jackson', dob: '1994-07-16', pb: { '200m': { mark: '21.45' } }, sb: {}, worldAthleticsUrl: null }
    const entry = buildSuccessCache({
      dlId: '14325599', athleteId: 'jackson-shericka-jam',
      athlete: 'JACKSON Shericka', country: 'JAM',
      parsed, officialProfileUrl: 'https://www.diamondleague.com/athlete/14325599',
    })
    assert.equal(entry.status, STATUS.SUCCESS)
    assert.equal(entry.dob, '1994-07-16')
    assert.equal(entry.pb['200m'].mark, '21.45')
    assert.equal(entry.source, 'diamondleague.com')
    assert.ok(entry.scrapedAt)
  })

  it('preserva nome do atleta do mapa quando parsed.name é undefined', () => {
    const parsed = { name: undefined, dob: '1994-07-16', pb: {}, sb: {}, worldAthleticsUrl: null }
    const entry = buildSuccessCache({
      dlId: '1', athleteId: 'test', athlete: 'NOME DO MAPA', country: 'BRA',
      parsed, officialProfileUrl: 'https://www.diamondleague.com/athlete/1',
    })
    // buildSuccessCache usa `parsed.name || athlete`
    assert.equal(entry.athlete, 'NOME DO MAPA')
  })
})

// ---------------------------------------------------------------------------
// buildPermanentErrorCache
// ---------------------------------------------------------------------------
describe('buildPermanentErrorCache', () => {
  it('gera entrada com status=permanent_error', () => {
    const entry = buildPermanentErrorCache({
      dlId: '99', athleteId: 'foo', athlete: 'FOO Bar', country: 'USA',
      errorMessage: 'HTTP 404',
      officialProfileUrl: 'https://www.diamondleague.com/athlete/99',
    })
    assert.equal(entry.status, STATUS.PERMANENT_ERROR)
    assert.equal(entry.error, 'HTTP 404')
    assert.deepEqual(entry.pb, {})
    assert.deepEqual(entry.sb, {})
    assert.equal(entry.dob, null)
  })

  it('marca empty_page como permanent_error', () => {
    const entry = buildPermanentErrorCache({
      dlId: '100', athleteId: 'bar', athlete: 'BAR Baz', country: 'KEN',
      errorMessage: 'empty_page: HTTP 200 sem DOB, PB ou SB',
      officialProfileUrl: 'https://www.diamondleague.com/athlete/100',
    })
    assert.equal(entry.status, STATUS.PERMANENT_ERROR)
    assert.match(entry.error, /empty_page/)
  })
})

// ---------------------------------------------------------------------------
// fetchWithRetry — mocks sem rede
// ---------------------------------------------------------------------------
describe('fetchWithRetry', () => {
  const FAST = { baseDelayMs: 0, maxRetries: 3 }

  it('sucesso na primeira tentativa retorna HTML', async () => {
    const html = '<h1>Atleta</h1>'
    const mockFetch = async () => ({ ok: true, status: 200, text: async () => html })
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(result.httpStatus, 200)
    assert.equal(result.html, html)
    assert.equal(result.attempts, 1)
  })

  it('404 retorna permanent_error sem retry', async () => {
    let calls = 0
    const mockFetch = async () => { calls++; return { ok: false, status: 404, text: async () => '' } }
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(result.httpStatus, 404)
    assert.equal(result.html, null)
    assert.equal(calls, 1) // sem retry
    assert.equal(result.attempts, 1)
  })

  it('429 retenta e eventualmente retorna null após maxRetries', async () => {
    let calls = 0
    const mockFetch = async () => { calls++; return { ok: false, status: 429, text: async () => '' } }
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(result.httpStatus, 429)
    assert.equal(result.html, null)
    assert.equal(calls, 3)
    assert.equal(result.attempts, 3)
  })

  it('timeout (throw) retenta e retorna httpStatus null', async () => {
    let calls = 0
    const mockFetch = async () => { calls++; throw new Error('The operation was aborted') }
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(result.httpStatus, null)
    assert.equal(result.html, null)
    assert.equal(calls, 3)
  })

  it('5xx retenta e na 3ª tentativa retorna null', async () => {
    let calls = 0
    const mockFetch = async () => { calls++; return { ok: false, status: 503, text: async () => '' } }
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(calls, 3)
    assert.equal(result.attempts, 3)
    assert.equal(result.html, null)
  })

  it('sucesso na 2ª tentativa (após 1 falha temporária)', async () => {
    let calls = 0
    const html = '<h1>OK</h1>'
    const mockFetch = async () => {
      calls++
      if (calls === 1) return { ok: false, status: 503, text: async () => '' }
      return { ok: true, status: 200, text: async () => html }
    }
    const result = await fetchWithRetry('https://example.com', { ...FAST, _fetch: mockFetch })
    assert.equal(result.httpStatus, 200)
    assert.equal(result.html, html)
    assert.equal(result.attempts, 2)
  })
})

// ---------------------------------------------------------------------------
// parseAthleteProfileHtml — parser do commit base (não alterado)
// ---------------------------------------------------------------------------
describe('parseAthleteProfileHtml — parser legado preservado', () => {
  it('extrai DOB, PB e SB de HTML completo', () => {
    const html = `
      <h1>Shericka Jackson</h1>
      <div>Born <span>16 JUL 1994</span></div>
      <h2>Personal Best</h2>
      <table><tr><td>200 metres Women</td><td>21.45</td><td>Eugene</td><td>2022</td></tr></table>
      <h2>Season's Best</h2>
      <table><tr><td>200 metres Women</td><td>21.80</td><td>Monaco</td><td>2024</td></tr></table>
      <a href="https://worldathletics.org/athletes/jamaica/shericka-jackson">WA</a>
    `
    const result = parseAthleteProfileHtml(html)
    // normalizeDisciplineKey('200 metres Women') → '200m women'
    assert.equal(result.dob, '1994-07-16')
    assert.ok(result.pb['200m women'], `pb keys: ${Object.keys(result.pb).join(', ')}`)
    assert.equal(result.pb['200m women'].mark, '21.45')
    assert.ok(result.sb['200m women'])
    assert.equal(result.sb['200m women'].mark, '21.80')
    assert.match(result.worldAthleticsUrl, /worldathletics\.org/)
  })

  it('retorna dob null e pb/sb vazios para HTML sem dados', () => {
    const result = parseAthleteProfileHtml('<html><body>Wanda Diamond League - Athlete</body></html>')
    assert.equal(result.dob, null)
    assert.deepEqual(result.pb, {})
    assert.deepEqual(result.sb, {})
  })
})

// ---------------------------------------------------------------------------
// Funções auxiliares do parser
// ---------------------------------------------------------------------------
describe('dateToIso', () => {
  it('converte formato DD MON YYYY', () => assert.equal(dateToIso('16 JUL 1994'), '1994-07-16'))
  it('retorna null para string inválida', () => assert.equal(dateToIso('nada'), null))
  it('retorna null para null', () => assert.equal(dateToIso(null), null))
})

describe('decodeHtml', () => {
  it('decodifica &#039; em aspas simples', () => assert.equal(decodeHtml('Women&#039;s'), "Women's"))
  it('decodifica &amp;', () => assert.equal(decodeHtml('P&amp;G'), 'P&G'))
})

describe('normalizeDisciplineKey', () => {
  it('remove prefixo gendered', () => assert.equal(normalizeDisciplineKey("Women's 200 metres"), '200m'))
  it('colapsa espaços', () => assert.equal(normalizeDisciplineKey('  100  metres  '), '100m'))
})

describe('markForDiscipline', () => {
  const marks = { '200m': { mark: '21.45' }, 'shot put': { mark: '22.00' } }
  it('encontra por chave normalizada', () => assert.equal(markForDiscipline(marks, '200 metres'), '21.45'))
  it('retorna undefined quando não encontra', () => assert.equal(markForDiscipline(marks, '100m'), undefined))
})
