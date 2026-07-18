#!/usr/bin/env node
/**
 * Aplica dados do cache de atletas nos JSONs gerados
 *
 * Lê todos os arquivos em .athlete-cache e mescla os dados
 * de DOB, PB e SB nos JSONs da temporada em lib/diamond-league/generated/
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, '.athlete-cache')
const GENERATED_DIR = path.join(ROOT, 'lib', 'diamond-league', 'generated')

console.log(`\n[Apply Cache] Carregando cache de atletas...\n`)

// Carregar todo o cache
const cache = new Map()
if (fs.existsSync(CACHE_DIR)) {
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    try {
      const dlId = file.replace('.json', '')
      const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8'))
      cache.set(dlId, data)
    } catch {
      // Ignorar erros de parse
    }
  }
}

console.log(`Carregado: ${cache.size} entradas de cache\n`)

if (cache.size === 0) {
  console.log('Nenhum cache de atleta disponível. Execute primeiro:\n  node scripts/scrape-athlete-data.mjs\n')
  process.exit(0)
}

// Processar cada JSON gerado
let totalMerged = 0
let dogsAdded = 0
let pbsAdded = 0
let sbsAdded = 0

const files = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json')

for (const file of files) {
  const filePath = path.join(GENERATED_DIR, file)
  const meeting = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  // Processar cada evento
  const updatedEvents = (meeting.events || []).map((event) => {
    // Processar results
    if (event.results) {
      event.results = event.results.map((result) => {
        if (result.dlId && cache.has(result.dlId)) {
          const cached = cache.get(result.dlId)
          if (cached && !cached.error) {
            if (cached.dob && !result.dob) {
              result.dob = cached.dob
              dogsAdded++
            }
            if (cached.pb && event.discipline && cached.pb[event.discipline] && !result.personalBest) {
              result.personalBest = cached.pb[event.discipline]
              pbsAdded++
            }
            if (cached.sb && event.discipline && cached.sb[event.discipline] && !result.seasonBest) {
              result.seasonBest = cached.sb[event.discipline]
              sbsAdded++
            }
            totalMerged++
          }
        }
        return result
      })
    }

    // Processar startList
    if (event.startList) {
      event.startList = event.startList.map((entry) => {
        if (entry.dlId && cache.has(entry.dlId)) {
          const cached = cache.get(entry.dlId)
          if (cached && !cached.error) {
            if (cached.dob && !entry.dob) {
              entry.dob = cached.dob
              dogsAdded++
            }
            if (cached.pb && event.discipline && cached.pb[event.discipline] && !entry.personalBest) {
              entry.personalBest = cached.pb[event.discipline]
              pbsAdded++
            }
            if (cached.sb && event.discipline && cached.sb[event.discipline] && !entry.seasonBest) {
              entry.seasonBest = cached.sb[event.discipline]
              sbsAdded++
            }
            totalMerged++
          }
        }
        return entry
      })
    }

    return event
  })

  meeting.events = updatedEvents

  // Salvar JSON atualizado
  fs.writeFileSync(filePath, JSON.stringify(meeting, null, 2))
  console.log(`✓ ${file}`)
}

console.log(`\n${'='.repeat(70)}`)
console.log(`Aplicação de cache concluída!`)
console.log(`Total mesclado: ${totalMerged} registros`)
console.log(`DOB adicionados: ${dogsAdded}`)
console.log(`PB adicionados: ${pbsAdded}`)
console.log(`SB adicionados: ${sbsAdded}`)
console.log(`${'='.repeat(70)}\n`)
