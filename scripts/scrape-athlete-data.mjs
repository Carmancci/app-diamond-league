#!/usr/bin/env node
/**
 * Coleta DOB, PB e SB dos perfis oficiais e mantém um cache por DL_ID.
 *
 * Status de cache:
 *   success          — HTTP 200 com pelo menos DOB, PB ou SB encontrado.
 *   permanent_error  — HTTP 4xx (exceto 429) ou HTTP 200 sem dados.
 *                      Não será reprocessado sem --force.
 *   temporary_error  — timeout, HTTP 429, 5xx. Não persiste; será
 *                      retentado na próxima execução automaticamente.
 *   skipped_cache    — entrada válida já em disco; contabilizada mas
 *                      não reprocessada.
 *
 * Exit codes:
 *   0  — normal (zero ou mais sucessos, sem erros temporários).
 *   1  — entradas para processar mas zero sucessos (falha total).
 *   2  — pelo menos uma falha temporária (retry na próxima execução).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseAthleteProfileHtml,
  classifyHttpStatus,
  shouldSkipCache,
  buildSuccessCache,
  buildPermanentErrorCache,
  STATUS,
} from './lib/athlete-profile.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const GENERATED_DIR = path.join(ROOT, 'lib', 'diamond-league', 'generated')
const ID_MAP_FILE = path.join(ROOT, '.dl-id-map.json')

// Backoff injetável via variável de ambiente (útil em testes / CI)
const BASE_DELAY_MS = Number(process.env.SCRAPER_BASE_DELAY_MS ?? 1_500)
const MAX_RETRIES = 3

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const valueAfter = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const requestedLimit = Number(valueAfter('--limit') ?? 100)
const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 100
const singleId = valueAfter('--id')
const force = args.includes('--force')

// ---------------------------------------------------------------------------
// Helpers de filesystem
// ---------------------------------------------------------------------------
fs.mkdirSync(CACHE_DIR, { recursive: true })

function readCache(dlId) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CACHE_DIR, `${dlId}.json`), 'utf8'))
  } catch {
    return null
  }
}

function writeCache(dlId, entry) {
  fs.writeFileSync(path.join(CACHE_DIR, `${dlId}.json`), `${JSON.stringify(entry, null, 2)}\n`)
}

function collectAthleteIds() {
  const idMap = {}
  const files = fs
    .readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
  for (const file of files) {
    const meeting = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), 'utf8'))
    for (const event of meeting.events ?? []) {
      for (const result of [...(event.results ?? []), ...(event.startList ?? [])]) {
        if (!result.dlId || idMap[result.dlId]) continue
        idMap[result.dlId] = {
          athleteId: result.athleteId,
          // nome vem sempre do mapa (fonte confiável), nunca do <title> do site
          athlete: result.athlete,
          country: result.country,
        }
      }
    }
  }
  fs.writeFileSync(ID_MAP_FILE, `${JSON.stringify(idMap, null, 2)}\n`)
  return idMap
}

// ---------------------------------------------------------------------------
// Fetch com retry e backoff exponencial
// ---------------------------------------------------------------------------
export async function fetchWithRetry(url, { maxRetries = MAX_RETRIES, baseDelayMs = BASE_DELAY_MS, _fetch } = {}) {
  /** @type {(u: string) => Promise<{ok: boolean, status: number, text: () => Promise<string>}>} */
  const doFetch = _fetch ?? ((u) =>
    fetch(u, {
      headers: { 'User-Agent': 'app-diamond-league/1.0 (+athlete-data)' },
      signal: AbortSignal.timeout(15_000),
    })
  )

  let lastStatus = null
  let attempts = 0

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt
    let httpStatus = null
    let html = null

    try {
      const response = await doFetch(url)
      httpStatus = response.status
      if (response.ok) html = await response.text()
    } catch {
      // timeout ou fetch failed — httpStatus permanece null
    }

    lastStatus = httpStatus
    const cls = classifyHttpStatus(httpStatus)

    if (cls === STATUS.SUCCESS) {
      return { httpStatus, html, attempts }
    }

    if (cls === STATUS.PERMANENT_ERROR) {
      // 4xx definitivo: não adianta retry
      return { httpStatus, html: null, attempts }
    }

    // TEMPORARY_ERROR (null, 429, 5xx): retry com backoff se não for a última tentativa
    if (attempt < maxRetries) {
      const delay = baseDelayMs * 2 ** (attempt - 1) // 1.5s, 3s, 6s
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return { httpStatus: lastStatus, html: null, attempts }
}

// ---------------------------------------------------------------------------
// main() — execução isolada (não roda em import/teste)
// ---------------------------------------------------------------------------
export async function main({ _fetchFn = fetchWithRetry } = {}) {
  const idMap = collectAthleteIds()
  let entries = Object.entries(idMap)

  if (singleId) {
    entries = entries.filter(([id]) => id === singleId)
    if (!entries.length) {
      console.error(`[scraper] DL_ID ${singleId} não encontrado nos dados gerados.`)
      return 1
    }
  } else if (!force) {
    entries = entries.filter(([id]) => !shouldSkipCache(readCache(id)))
  }

  const skippedCache = Object.keys(idMap).length - entries.length
  entries = entries.slice(0, limit)

  const counters = {
    processed: 0,
    success: 0,
    permanentErrors: 0,
    temporaryErrors: 0,
    skippedCache,
    retries: 0,
  }

  console.log(`\n[scraper] ${entries.length} atleta(s) para processar\n`)

  if (entries.length === 0) {
    printSummary(counters)
    return 0
  }

  for (let i = 0; i < entries.length; i++) {
    const [dlId, info] = entries[i]
    const pad = String(i + 1).padStart(String(entries.length).length, ' ')
    const officialProfileUrl = `https://www.diamondleague.com/athlete/${dlId}`

    process.stdout.write(`[${pad}/${entries.length}] ${info.athlete.padEnd(40)} `)
    counters.processed++

    const { httpStatus, html, attempts } = await _fetchFn(officialProfileUrl)
    if (attempts > 1) counters.retries += attempts - 1

    const cls = classifyHttpStatus(httpStatus)

    if (cls === STATUS.PERMANENT_ERROR) {
      // HTTP 4xx definitivo
      console.log(`HTTP ${httpStatus} (permanente)`)
      counters.permanentErrors++
      writeCache(
        dlId,
        buildPermanentErrorCache({
          dlId,
          athleteId: info.athleteId,
          athlete: info.athlete,
          country: info.country,
          errorMessage: `HTTP ${httpStatus}`,
          officialProfileUrl,
        }),
      )
      continue
    }

    if (cls === STATUS.TEMPORARY_ERROR || html === null) {
      // timeout / 429 / 5xx — não persiste; permite retry futuro
      console.log(`TEMPORÁRIO (${attempts} tentativa(s))`)
      counters.temporaryErrors++
      continue
    }

    // HTTP 200 — parsear HTML
    const parsed = parseAthleteProfileHtml(html)
    const hasData =
      parsed.dob || Object.keys(parsed.pb).length > 0 || Object.keys(parsed.sb).length > 0

    if (!hasData) {
      // 200 sem dados reconhecíveis — página vazia ou estrutura alterada
      console.log('VAZIA (permanent_error)')
      counters.permanentErrors++
      writeCache(
        dlId,
        buildPermanentErrorCache({
          dlId,
          athleteId: info.athleteId,
          athlete: info.athlete,
          country: info.country,
          errorMessage: 'empty_page: HTTP 200 sem DOB, PB ou SB',
          officialProfileUrl,
        }),
      )
      continue
    }

    // Sucesso
    const dobStr = parsed.dob ? 'DOB:sim' : 'DOB:não'
    console.log(`OK — ${dobStr} PB:${Object.keys(parsed.pb).length} SB:${Object.keys(parsed.sb).length}`)
    counters.success++

    writeCache(
      dlId,
      buildSuccessCache({
        dlId,
        athleteId: info.athleteId,
        // nome: preservar o do mapa; só sobrescrever se o parser retornou algo
        athlete: info.athlete,
        country: info.country,
        parsed,
        officialProfileUrl,
      }),
    )

    if (i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS))
    }
  }

  printSummary(counters)

  if (counters.temporaryErrors > 0) return 2
  if (entries.length > 0 && counters.success === 0 && counters.permanentErrors === entries.length) return 0
  if (entries.length > 0 && counters.success === 0) return 1
  return 0
}

function printSummary(counters) {
  const sep = '─'.repeat(56)
  console.log(`\n${sep}`)
  console.log(' [scraper] Resumo da execução')
  console.log(sep)
  console.log(` Processados       : ${counters.processed}`)
  console.log(` Sucessos          : ${counters.success}`)
  console.log(` Falhas permanentes: ${counters.permanentErrors}`)
  console.log(` Falhas temporárias: ${counters.temporaryErrors}`)
  console.log(` Ignorados (cache) : ${counters.skippedCache}`)
  console.log(` Retries executados: ${counters.retries}`)
  console.log(sep)
  const exitCode =
    counters.temporaryErrors > 0
      ? 2
      : counters.processed > 0 && counters.success === 0 && counters.temporaryErrors === 0
        ? 0 // tudo permanent_error — não há o que retentar
        : 0
  console.log(` Exit code esperado: ${exitCode}`)
  console.log(`${sep}\n`)
}

// Guard: só executa quando chamado diretamente
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  main().then((code) => {
    process.exitCode = code
  }).catch((err) => {
    console.error('[scraper] FATAL:', err)
    process.exitCode = 1
  })
}
