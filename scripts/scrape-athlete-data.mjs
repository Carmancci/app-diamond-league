#!/usr/bin/env node
/** Coleta DOB, PB e SB dos perfis oficiais e mantém um cache por DL_ID. */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAthleteProfileHtml } from './lib/athlete-profile.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const GENERATED_DIR = path.join(ROOT, 'lib', 'diamond-league', 'generated')
const ID_MAP_FILE = path.join(ROOT, '.dl-id-map.json')

const args = process.argv.slice(2)
const valueAfter = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const requestedLimit = Number(valueAfter('--limit') ?? 100)
const limit = Number.isFinite(requestedLimit) ? requestedLimit : 100
const singleId = valueAfter('--id')
const force = args.includes('--force')

fs.mkdirSync(CACHE_DIR, { recursive: true })

function collectAthleteIds() {
  const idMap = {}
  const files = fs.readdirSync(GENERATED_DIR).filter((file) => file.endsWith('.json') && file !== 'index.json')
  for (const file of files) {
    const meeting = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), 'utf8'))
    for (const event of meeting.events ?? []) {
      for (const result of [...(event.results ?? []), ...(event.startList ?? [])]) {
        if (!result.dlId || idMap[result.dlId]) continue
        idMap[result.dlId] = {
          athleteId: result.athleteId,
          athlete: result.athlete,
          country: result.country,
        }
      }
    }
  }
  fs.writeFileSync(ID_MAP_FILE, `${JSON.stringify(idMap, null, 2)}\n`)
  return idMap
}

function hasUsefulCache(dlId) {
  try {
    const cached = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, `${dlId}.json`), 'utf8'))
    return !cached.error && Boolean(cached.dob || Object.keys(cached.pb ?? {}).length || Object.keys(cached.sb ?? {}).length)
  } catch {
    return false
  }
}

const idMap = collectAthleteIds()
let entries = Object.entries(idMap)
if (singleId) {
  entries = entries.filter(([id]) => id === singleId)
  if (!entries.length) throw new Error(`DL_ID ${singleId} não encontrado nos dados gerados.`)
} else if (!force) {
  entries = entries.filter(([id]) => !hasUsefulCache(id))
}
entries = entries.slice(0, limit)

console.log(`\n[Scraper] ${entries.length} atleta(s) para processar\n`)

async function fetchProfile(dlId) {
  const url = `https://www.diamondleague.com/athlete/${dlId}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'app-diamond-league/1.0 (+athlete-data)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return { url, profile: parseAthleteProfileHtml(await response.text()) }
}

let success = 0
let failed = 0
for (let index = 0; index < entries.length; index++) {
  const [dlId, info] = entries[index]
  process.stdout.write(`[${index + 1}/${entries.length}] ${info.athlete} `)
  try {
    const { url, profile } = await fetchProfile(dlId)
    if (!profile.dob && !Object.keys(profile.pb).length && !Object.keys(profile.sb).length) {
      throw new Error('perfil sem dados reconhecidos')
    }
    const cacheEntry = {
      dlId,
      athleteId: info.athleteId,
      athlete: profile.name || info.athlete,
      country: info.country,
      dob: profile.dob,
      pb: profile.pb,
      sb: profile.sb,
      officialProfileUrl: url,
      worldAthleticsUrl: profile.worldAthleticsUrl,
      scrapedAt: new Date().toISOString(),
      source: 'diamondleague.com',
    }
    fs.writeFileSync(path.join(CACHE_DIR, `${dlId}.json`), `${JSON.stringify(cacheEntry, null, 2)}\n`)
    success++
    console.log(`OK — DOB:${profile.dob ?? '–'} PB:${Object.keys(profile.pb).length} SB:${Object.keys(profile.sb).length}`)
  } catch (error) {
    failed++
    console.log(`FALHOU — ${error.message}`)
  }
  if (index < entries.length - 1) await new Promise((resolve) => setTimeout(resolve, 500))
}

console.log(`\nResultado: ${success} sucesso(s), ${failed} falha(s).`)
if (entries.length && !success) process.exitCode = 1
