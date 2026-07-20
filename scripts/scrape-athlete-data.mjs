#!/usr/bin/env node
/**
 * scrape-athlete-data.mjs
 *
 * Coleta perfis de atletas da Diamond League e salva em cache.
 *
 * Argumentos:
 *   --limit  N      Limitar a N atletas por execução (padrão: 10)
 *   --id    DLID    Processar um único atleta pelo DL_ID numérico
 *   --force         Reprocessar mesmo que cache já exista (inclusive permanent_error)
 *
 * Exit codes:
 *   0  Execução normal — inclui casos onde todos os erros já eram permanentes
 *   1  Erro fatal (arquivo de mapa não encontrado, argumento inválido, etc.)
 *   2  Alguma falha temporária ocorreu (convida a re-execução)
 *
 * O script nunca faz commit, push ou altera JSONs de resultado oficial.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  STATUS,
  parseProfileHtml,
  classifyHttpStatus,
  shouldSkipCache,
  buildSuccessCache,
  buildPermanentErrorCache,
  buildTemporaryErrorCache,
} from './lib/athlete-profile.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const ID_MAP_FILE = path.join(ROOT, '.dl-id-map.json')

// ---------------------------------------------------------------------------
// Configurações de retry
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3          // tentativas totais (1 inicial + 2 retries)
const MIN_DELAY_MS = 500       // intervalo mínimo entre requests (throttle)
const RETRY_BASE_DELAY_MS = 1500  // backoff progressivo: 1.5s → 3s → 6s

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

if (!fs.existsSync(ID_MAP_FILE)) {
  console.error('[scraper] FATAL: .dl-id-map.json não encontrado. Execute pnpm ingest primeiro.')
  process.exit(1)
}

const idMap = JSON.parse(fs.readFileSync(ID_MAP_FILE, 'utf-8'))

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)

const limitIdx = args.indexOf('--limit')
const rawLimit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 10
if (limitIdx >= 0 && !Number.isFinite(rawLimit)) {
  console.error('[scraper] FATAL: --limit requer um número inteiro.')
  process.exit(1)
}

const idIdx = args.indexOf('--id')
const singleId = idIdx >= 0 ? args[idIdx + 1] : null

const force = args.includes('--force')

// ---------------------------------------------------------------------------
// Filtrar entradas a processar
// ---------------------------------------------------------------------------
let entries = Object.entries(idMap)

if (singleId) {
  entries = entries.filter(([id]) => id === singleId)
  if (entries.length === 0) {
    console.error(`[scraper] FATAL: DL_ID "${singleId}" não encontrado no mapa.`)
    process.exit(1)
  }
} else {
  // Aplicar decisão de cache para cada entrada
  entries = entries.filter(([id]) => {
    const cacheFile = path.join(CACHE_DIR, `${id}.json`)
    if (!fs.existsSync(cacheFile)) return true
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
    return !shouldSkipCache(cached, force)
  })

  if (Number.isFinite(rawLimit)) {
    entries = entries.slice(0, rawLimit)
  }
}

// ---------------------------------------------------------------------------
// Função de fetch com retry
// ---------------------------------------------------------------------------

/**
 * Faz fetch com retry automático para erros temporários.
 * Injetável para testes: passe fetchFn como parâmetro.
 *
 * @param {string} url
 * @param {{ fetchFn?: typeof fetch }} [opts]
 * @returns {Promise<{ httpStatus: number|null, html: string|null, attempts: number }>}
 */
export async function fetchWithRetry(url, { fetchFn = fetch } = {}) {
  let attempt = 0
  let lastStatus = null

  while (attempt < MAX_RETRIES) {
    attempt++
    try {
      const res = await fetchFn(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiamondLeagueScraper/2.0)' },
        signal: AbortSignal.timeout(12000),
      })
      lastStatus = res.status

      const httpClass = classifyHttpStatus(res.status)

      if (httpClass === STATUS.SUCCESS) {
        const html = await res.text()
        return { httpStatus: res.status, html, attempts: attempt }
      }

      if (httpClass === STATUS.PERMANENT_ERROR) {
        return { httpStatus: res.status, html: null, attempts: attempt }
      }

      // TEMPORARY — back-off e retry
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * (2 ** (attempt - 1))
        await sleep(delay)
      }

    } catch (err) {
      // Timeout ou erro de rede → temporário
      lastStatus = null
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * (2 ** (attempt - 1))
        await sleep(delay)
      }
    }
  }

  return { httpStatus: lastStatus, html: null, attempts: attempt }
}

// ---------------------------------------------------------------------------
// Loop principal (só executa quando chamado diretamente, não em import)
// ---------------------------------------------------------------------------
async function main() {
  const counters = {
    processed: 0,
    success: 0,
    permanentErrors: 0,
    temporaryErrors: 0,
    skippedCache: 0,
    retries: 0,
  }

  const totalInMap = Object.keys(idMap).length
  counters.skippedCache = totalInMap - entries.length - (singleId ? totalInMap - 1 : 0)
  if (counters.skippedCache < 0) counters.skippedCache = 0

  console.log(`\n[scraper] ${entries.length} atleta(s) para processar\n`)

  if (entries.length === 0) {
    console.log('Nenhum atleta novo para processar.')
    printSummary(counters)
    return 0
  }

  for (let i = 0; i < entries.length; i++) {
    const [dlId, info] = entries[i]
    const pad = String(i + 1).padStart(String(entries.length).length, ' ')
    const officialProfileUrl = `https://www.diamondleague.com/athlete/${dlId}`

    process.stdout.write(`[${pad}/${entries.length}] ${info.athlete.padEnd(40)} `)
    counters.processed++

    const { httpStatus, html, attempts } = await fetchWithRetry(officialProfileUrl)

    if (attempts > 1) {
      counters.retries += attempts - 1
    }

    const httpClass = classifyHttpStatus(httpStatus)

    // --- HTTP permanente (4xx exceto 429) ---
    if (httpClass === STATUS.PERMANENT_ERROR) {
      console.log(`HTTP ${httpStatus} (permanente)`)
      counters.permanentErrors++
      saveCache(dlId, buildPermanentErrorCache({
        dlId, athleteId: info.athleteId, athlete: info.athlete, country: info.country,
        errorMessage: `HTTP ${httpStatus}`,
        officialProfileUrl,
      }))
      await sleep(MIN_DELAY_MS)
      continue
    }

    // --- Erro temporário esgotou retries ---
    if (httpClass === STATUS.TEMPORARY_ERROR || html === null) {
      console.log(`TEMPORÁRIO (${attempts} tentativa(s))`)
      counters.temporaryErrors++
      // Não persistir como permanente — permite nova tentativa futura
      await sleep(MIN_DELAY_MS)
      continue
    }

    // --- HTTP 200 recebido — parsear HTML ---
    const parsed = parseProfileHtml(html)
    const hasData = parsed.dob || Object.keys(parsed.pb).length > 0 || Object.keys(parsed.sb).length > 0

    if (!hasData) {
      // Página oficial vazia (200 mas sem dados)
      console.log('VAZIA (permanent_error)')
      counters.permanentErrors++
      saveCache(dlId, buildPermanentErrorCache({
        dlId, athleteId: info.athleteId, athlete: info.athlete, country: info.country,
        errorMessage: 'empty_page: HTTP 200 sem DOB, PB ou SB',
        officialProfileUrl,
      }))
      await sleep(MIN_DELAY_MS)
      continue
    }

    // --- Sucesso ---
    const dobStr = parsed.dob ? 'DOB✓' : 'DOB✗'
    const pbStr = `PB:${Object.keys(parsed.pb).length}`
    const sbStr = `SB:${Object.keys(parsed.sb).length}`
    console.log(`${dobStr} | ${pbStr} | ${sbStr}`)
    counters.success++

    // Preservar nome real do mapa quando o parser não encontrou nome limpo
    const finalName = parsed.name ?? info.athlete

    saveCache(dlId, buildSuccessCache({
      dlId, athleteId: info.athleteId,
      athlete: finalName,
      country: info.country,
      parsed,
      officialProfileUrl,
    }))

    if (i < entries.length - 1) {
      await sleep(MIN_DELAY_MS)
    }
  }

  // Resumo final
  printSummary(counters)
  return counters.temporaryErrors > 0 ? 2 : 0
} // fim main()

// Guard: só executa quando chamado diretamente (não quando importado em testes)
const isMain = process.argv[1]?.endsWith('scrape-athlete-data.mjs')
if (isMain) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error('[scraper] FATAL:', err)
    process.exit(1)
  })
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function saveCache(dlId, data) {
  fs.writeFileSync(path.join(CACHE_DIR, `${dlId}.json`), JSON.stringify(data, null, 2))
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function printSummary(counters) {
  const sep = '='.repeat(60)
  console.log(`\n${sep}`)
  console.log('[scraper] Resumo da execução')
  console.log(sep)
  console.log(`  Processados       : ${counters.processed}`)
  console.log(`  Sucessos          : ${counters.success}`)
  console.log(`  Falhas permanentes: ${counters.permanentErrors}`)
  console.log(`  Falhas temporárias: ${counters.temporaryErrors}`)
  console.log(`  Ignorados (cache) : ${counters.skippedCache}`)
  console.log(`  Retries executados: ${counters.retries}`)
  console.log(sep)
  console.log(`  Exit code: ${counters.temporaryErrors > 0 ? '2 (falhas temporárias)' : '0 (normal)'}`)
  console.log(`${sep}\n`)
}
