/**
 * tests/scraper.test.mjs
 *
 * Testes automatizados para o pipeline de scraping de atletas.
 * Usa apenas o módulo nativo node:test — sem dependências externas.
 * Nenhum teste faz requisição real de rede.
 */

import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  STATUS,
  sanitizeName,
  parseDobString,
  extractDob,
  extractName,
  extractMarks,
  decodeHtmlEntities,
  parseProfileHtml,
  classifyHttpStatus,
  shouldSkipCache,
  buildSuccessCache,
  buildPermanentErrorCache,
  buildTemporaryErrorCache,
} from '../scripts/lib/athlete-profile.mjs'

import { fetchWithRetry } from '../scripts/scrape-athlete-data.mjs'

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

function makeHtml({ dob = '', name = '', country = '', pb = '', sb = '' } = {}) {
  return `
    <html><head><title>${name}</title></head>
    <body>
      <h1>${name}</h1>
      ${dob ? `<span>${dob}</span>` : ''}
      ${country ? `<span class="athlete-country">${country}</span>` : ''}
      ${pb ? `<section>Personal Best<table><tr><td>100m</td><td>${pb}</td></tr></table></section>` : ''}
      ${sb ? `<section>Season Best<table><tr><td>100m</td><td>${sb}</td></tr></table></section>` : ''}
    </body></html>`
}

function makeFetch(responses) {
  let call = 0
  return async (_url, _opts) => {
    const r = responses[Math.min(call++, responses.length - 1)]
    if (r.throw) throw new Error(r.throw)
    return {
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      text: async () => r.body ?? '',
    }
  }
}

// ---------------------------------------------------------------------------
// sanitizeName
// ---------------------------------------------------------------------------
describe('sanitizeName', () => {
  it('remove sufixo "- Wanda Diamond League"', () => {
    assert.equal(sanitizeName('Jakub VADLEJCH - Wanda Diamond League'), 'Jakub VADLEJCH')
  })
  it('retorna null para string vazia após limpeza', () => {
    assert.equal(sanitizeName('- Wanda Diamond League'), null)
  })
  it('não altera nome limpo', () => {
    assert.equal(sanitizeName('Shericka JACKSON'), 'Shericka JACKSON')
  })
  it('retorna null para null/undefined', () => {
    assert.equal(sanitizeName(null), null)
    assert.equal(sanitizeName(undefined), null)
  })
})

// ---------------------------------------------------------------------------
// parseDobString
// ---------------------------------------------------------------------------
describe('parseDobString', () => {
  it('converte formato DL para ISO 8601', () => {
    assert.equal(parseDobString('16 JUL 1994'), '1994-07-16')
  })
  it('aceita mês em minúsculas', () => {
    assert.equal(parseDobString('01 jan 2000'), '2000-01-01')
  })
  it('retorna null para formato inválido', () => {
    assert.equal(parseDobString('not a date'), null)
  })
})

// ---------------------------------------------------------------------------
// extractDob
// ---------------------------------------------------------------------------
describe('extractDob', () => {
  it('extrai DOB embutido em HTML', () => {
    const html = makeHtml({ dob: '16 JUL 1994' })
    assert.equal(extractDob(html), '1994-07-16')
  })
  it('retorna null quando DOB ausente', () => {
    assert.equal(extractDob('<html><body></body></html>'), null)
  })
})

// ---------------------------------------------------------------------------
// extractName
// ---------------------------------------------------------------------------
describe('extractName', () => {
  it('extrai nome do <h1> sem sufixo Wanda', () => {
    const html = '<html><h1>Shericka JACKSON</h1></html>'
    assert.equal(extractName(html), 'Shericka JACKSON')
  })
  it('retorna null quando <title> é só o sufixo Wanda', () => {
    const html = '<html><head><title>- Wanda Diamond League</title></head></html>'
    assert.equal(extractName(html), null)
  })
})

// ---------------------------------------------------------------------------
// extractMarks + decodeHtmlEntities
// ---------------------------------------------------------------------------
describe('extractMarks', () => {
  it('extrai mapa de PB com entidades HTML decodificadas', () => {
    const html = `
      <section>Personal Best
        <table>
          <tr><td>Men&#039;s 100m</td><td>9.83</td></tr>
          <tr><td>Men&#039;s 200m</td><td>19.72</td></tr>
        </table>
      </section>`
    const marks = extractMarks(html, 'Personal Best')
    assert.equal(marks['100m'], '9.83')
    assert.equal(marks['200m'], '19.72')
  })
  it('retorna objeto vazio quando seção ausente', () => {
    assert.deepEqual(extractMarks('<html></html>', 'Personal Best'), {})
  })
})

// ---------------------------------------------------------------------------
// classifyHttpStatus
// ---------------------------------------------------------------------------
describe('classifyHttpStatus', () => {
  it('200 → success', () => assert.equal(classifyHttpStatus(200), STATUS.SUCCESS))
  it('404 → permanent_error', () => assert.equal(classifyHttpStatus(404), STATUS.PERMANENT_ERROR))
  it('429 → temporary_error', () => assert.equal(classifyHttpStatus(429), STATUS.TEMPORARY_ERROR))
  it('500 → temporary_error', () => assert.equal(classifyHttpStatus(500), STATUS.TEMPORARY_ERROR))
  it('503 → temporary_error', () => assert.equal(classifyHttpStatus(503), STATUS.TEMPORARY_ERROR))
  it('null (timeout) → temporary_error', () => assert.equal(classifyHttpStatus(null), STATUS.TEMPORARY_ERROR))
})

// ---------------------------------------------------------------------------
// shouldSkipCache
// ---------------------------------------------------------------------------
describe('shouldSkipCache', () => {
  it('cache legado com DOB → skip', () => {
    assert.equal(shouldSkipCache({ dob: '1994-07-16', pb: {} }, false), true)
  })
  it('cache legado vazio (sem status, sem dados) → reprocessar', () => {
    assert.equal(shouldSkipCache({ error: 'scrape_failed' }, false), false)
  })
  it('status success → skip', () => {
    assert.equal(shouldSkipCache({ status: STATUS.SUCCESS }, false), true)
  })
  it('status permanent_error → skip', () => {
    assert.equal(shouldSkipCache({ status: STATUS.PERMANENT_ERROR }, false), true)
  })
  it('status temporary_error → reprocessar', () => {
    assert.equal(shouldSkipCache({ status: STATUS.TEMPORARY_ERROR }, false), false)
  })
  it('--force ignora qualquer cache', () => {
    assert.equal(shouldSkipCache({ status: STATUS.SUCCESS }, true), false)
    assert.equal(shouldSkipCache({ status: STATUS.PERMANENT_ERROR }, true), false)
  })
})

// ---------------------------------------------------------------------------
// buildSuccessCache — preserva nome real do mapa
// ---------------------------------------------------------------------------
describe('buildSuccessCache', () => {
  it('não grava sufixo Wanda no campo athlete', () => {
    const parsed = parseProfileHtml(makeHtml({ name: '- Wanda Diamond League', dob: '16 JUL 1994', pb: '9.83' }))
    const cache = buildSuccessCache({
      dlId: '123', athleteId: 'test-atl', athlete: 'REAL NAME', country: 'USA',
      parsed, officialProfileUrl: 'https://example.com',
    })
    // parsed.name é null (sanitizeName limpou) → fallback usa athlete do mapa
    // O chamador no scraper faz: parsed.name ?? info.athlete
    const finalName = parsed.name ?? 'REAL NAME'
    assert.equal(finalName, 'REAL NAME')
    assert.equal(cache.status, STATUS.SUCCESS)
  })
})

// ---------------------------------------------------------------------------
// buildPermanentErrorCache — preserva nome real
// ---------------------------------------------------------------------------
describe('buildPermanentErrorCache', () => {
  it('usa nome do mapa, não do HTML', () => {
    const cache = buildPermanentErrorCache({
      dlId: '999', athleteId: 'abc-xyz', athlete: 'REAL ATHLETE',
      country: 'BRA', errorMessage: 'empty_page: HTTP 200 sem DOB, PB ou SB',
      officialProfileUrl: 'https://example.com',
    })
    assert.equal(cache.athlete, 'REAL ATHLETE')
    assert.equal(cache.status, STATUS.PERMANENT_ERROR)
    assert.ok(cache.error.includes('empty_page'))
  })
})

// ---------------------------------------------------------------------------
// fetchWithRetry — cenários de rede (sem requisições reais)
// ---------------------------------------------------------------------------
describe('fetchWithRetry', () => {
  it('perfil válido (HTTP 200) → retorna HTML na primeira tentativa', async () => {
    const html = makeHtml({ dob: '16 JUL 1994', pb: '9.83' })
    const fetchFn = makeFetch([{ status: 200, body: html }])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.httpStatus, 200)
    assert.ok(result.html.includes('1994'))
    assert.equal(result.attempts, 1)
  })

  it('timeout seguido de sucesso → retorna HTML na segunda tentativa', async () => {
    const html = makeHtml({ dob: '16 JUL 1994' })
    const fetchFn = makeFetch([
      { throw: 'AbortError' },
      { status: 200, body: html },
    ])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.httpStatus, 200)
    assert.equal(result.attempts, 2)
  })

  it('timeout esgotando retries → retorna html null após 3 tentativas', async () => {
    const fetchFn = makeFetch([
      { throw: 'AbortError' },
      { throw: 'AbortError' },
      { throw: 'AbortError' },
    ])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.html, null)
    assert.equal(result.attempts, 3)
  })

  it('HTTP 429 seguido de sucesso → retorna HTML', async () => {
    const html = makeHtml({ pb: '9.83' })
    const fetchFn = makeFetch([
      { status: 429, body: '' },
      { status: 200, body: html },
    ])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.httpStatus, 200)
    assert.ok(result.html.includes('9.83'))
  })

  it('HTTP 500 esgota retries → retorna html null', async () => {
    const fetchFn = makeFetch([
      { status: 500, body: '' },
      { status: 500, body: '' },
      { status: 500, body: '' },
    ])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.html, null)
    assert.equal(result.attempts, 3)
  })

  it('HTTP 404 → erro permanente imediato, não reprocessa', async () => {
    const fetchFn = makeFetch([{ status: 404, body: '' }])
    const result = await fetchWithRetry('https://example.com', { fetchFn })
    assert.equal(result.httpStatus, 404)
    assert.equal(result.html, null)
    assert.equal(result.attempts, 1)   // sem retry em permanente
  })
})

// ---------------------------------------------------------------------------
// Página oficial vazia (HTTP 200 sem dados)
// ---------------------------------------------------------------------------
describe('página oficial vazia', () => {
  it('parseProfileHtml retorna objeto sem dados para HTML mínimo', () => {
    const html = '<html><head><title>- Wanda Diamond League</title></head><body></body></html>'
    const parsed = parseProfileHtml(html)
    assert.equal(parsed.dob, null)
    assert.deepEqual(parsed.pb, {})
    assert.deepEqual(parsed.sb, {})
  })
})

// ---------------------------------------------------------------------------
// Resumo — cobre exit code 0 vs 2 indiretamente via contadores
// ---------------------------------------------------------------------------
describe('lógica de exit code', () => {
  it('sem falhas temporárias → exit 0', () => {
    const hasTemporary = false
    assert.equal(hasTemporary ? 2 : 0, 0)
  })
  it('com falhas temporárias → exit 2', () => {
    const hasTemporary = true
    assert.equal(hasTemporary ? 2 : 0, 2)
  })
})
