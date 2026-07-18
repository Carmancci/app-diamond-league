#!/usr/bin/env node

/**
 * Script para enriquecer dados de atletas
 * Usa base de dados verificada + fallback para dados oficiais
 *
 * Uso: pnpm enrich
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getVerifiedAthlete } from './lib/verified-athletes-db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = path.join(__dirname, '../lib/diamond-league/generated')
const ENRICHED_DIR = path.join(__dirname, '../.enriched-data')

// Garantir diretório de enriquecimento
if (!fs.existsSync(ENRICHED_DIR)) {
  fs.mkdirSync(ENRICHED_DIR, { recursive: true })
}

/**
 * Extrair nomes de atletas do JSON normalizado
 * @param {object} meeting
 * @returns {Array<{firstName, lastName, country, athleteId}>}
 */
function extractAthletesFromMeeting(meeting) {
  const athletes = new Map() // Deduplicar por athleteId

  ;(meeting.events || []).forEach((event) => {
    ;(event.results || []).forEach((result) => {
      if (!result.athlete || !result.country) return
      if (athletes.has(result.athleteId)) return

      const [lastName, ...firstNameParts] = result.athlete.split(' ')
      const firstName = firstNameParts.join(' ')

      athletes.set(result.athleteId, {
        athleteId: result.athleteId,
        firstName: firstName || '',
        lastName: lastName || '',
        country: result.country,
      })
    })
    ;(event.startList || []).forEach((entry) => {
      if (!entry.athlete || !entry.country) return
      if (athletes.has(entry.athleteId)) return

      const [lastName, ...firstNameParts] = entry.athlete.split(' ')
      const firstName = firstNameParts.join(' ')

      athletes.set(entry.athleteId, {
        athleteId: entry.athleteId,
        firstName: firstName || '',
        lastName: lastName || '',
        country: entry.country,
      })
    })
  })

  return Array.from(athletes.values())
}

/**
 * Enriquecer eventos inline nos JSONs oficiais
 */
function enrichMeeting(meeting) {
  const enriched = { ...meeting }
  let dobCount = 0
  let pbCount = 0

  enriched.events = (enriched.events || []).map((event) => {
    const enrichedEvent = { ...event }

    // Enriquecer results
    if (enrichedEvent.results) {
      enrichedEvent.results = enrichedEvent.results.map((result) => {
        const verified = getVerifiedAthlete(result.athleteId)
        if (verified) {
          if (verified.dob && !result.dob) {
            result.dob = verified.dob
            dobCount++
          }
          if (verified.pb?.[event.discipline] && !result.personalBest) {
            result.personalBest = verified.pb[event.discipline]
            pbCount++
          }
          if (verified.sb?.[event.discipline] && !result.seasonBest) {
            result.seasonBest = verified.sb[event.discipline]
          }
        }
        return result
      })
    }

    // Enriquecer startList
    if (enrichedEvent.startList) {
      enrichedEvent.startList = enrichedEvent.startList.map((entry) => {
        const verified = getVerifiedAthlete(entry.athleteId)
        if (verified) {
          if (verified.dob && !entry.dob) {
            entry.dob = verified.dob
            dobCount++
          }
          if (verified.pb?.[event.discipline] && !entry.personalBest) {
            entry.personalBest = verified.pb[event.discipline]
            pbCount++
          }
          if (verified.sb?.[event.discipline] && !entry.seasonBest) {
            entry.seasonBest = verified.sb[event.discipline]
          }
        }
        return entry
      })
    }

    return enrichedEvent
  })

  return { enriched, dobCount, pbCount }
}

/**
 * Processar todos os meetings e enriquecer
 */
function main() {
  console.log('[Enrich] Starting verified database enrichment...\n')

  const meetings = fs
    .readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'schema.json')
    .sort()

  const enrichmentStats = {
    totalAthletes: 0,
    enrichedAthletes: 0,
    dobFound: 0,
    pbFound: 0,
    meetings: {},
  }

  for (const file of meetings) {
    const meetingName = file.replace('.json', '')
    const filePath = path.join(GENERATED_DIR, file)

    console.log(`[Enrich] Processing ${meetingName}...`)

    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const meeting = JSON.parse(content)

      const athletes = extractAthletesFromMeeting(meeting)
      const { enriched, dobCount, pbCount } = enrichMeeting(meeting)

      enrichmentStats.totalAthletes += athletes.length
      enrichmentStats.dobFound += dobCount
      enrichmentStats.pbFound += pbCount
      enrichmentStats.enrichedAthletes += athletes.filter((a) => getVerifiedAthlete(a.athleteId)).length

      enrichmentStats.meetings[meetingName] = {
        athletesTotal: athletes.length,
        athletesEnriched: athletes.filter((a) => getVerifiedAthlete(a.athleteId)).length,
        dobAdded: dobCount,
        pbAdded: pbCount,
      }

      // Salvar JSON enriquecido
      fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2))
      console.log(`  ✓ DOB: +${dobCount}, PB: +${pbCount}`)
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
    }
  }

  // Salvar estatísticas
  const statsFile = path.join(ENRICHED_DIR, 'enrichment-stats.json')
  fs.writeFileSync(statsFile, JSON.stringify(enrichmentStats, null, 2))

  console.log('\n╔════════════════════════════════════════╗')
  console.log('║    Enrichment Complete                 ║')
  console.log('╚════════════════════════════════════════╝')
  console.log(`Total Athletes: ${enrichmentStats.totalAthletes}`)
  console.log(`DOB Added: ${enrichmentStats.dobFound}`)
  console.log(`PB Added: ${enrichmentStats.pbFound}`)
  console.log(`Coverage: ${((enrichmentStats.enrichedAthletes / enrichmentStats.totalAthletes) * 100).toFixed(1)}%\n`)
}

main()
