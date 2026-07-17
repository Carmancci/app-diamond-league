#!/usr/bin/env node

/**
 * Visualizador de estatísticas de enriquecimento
 * Mostra cobertura de DOB, SB, PB por meeting
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENRICHED_DIR = path.join(__dirname, '../.enriched-data')
const STATS_FILE = path.join(ENRICHED_DIR, 'enrichment-stats.json')

function main() {
  if (!fs.existsSync(STATS_FILE)) {
    console.error(`Stats file not found: ${STATS_FILE}`)
    console.log('Run: pnpm enrich')
    process.exit(1)
  }

  const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'))

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║       Diamond League Athlete Data Enrichment Report       ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  console.log(`Total Athletes Processed: ${stats.totalAthletes}`)
  console.log(`Athletes Enriched: ${stats.enrichedAthletes} (${((stats.enrichedAthletes / stats.totalAthletes) * 100).toFixed(1)}%)\n`)

  console.log(`DOB Found: ${stats.dobFound}/${stats.totalAthletes} (${((stats.dobFound / stats.totalAthletes) * 100).toFixed(1)}%)`)
  console.log(`PB/SB Found: ${stats.pbFound}/${stats.totalAthletes} (${((stats.pbFound / stats.totalAthletes) * 100).toFixed(1)}%)\n`)

  console.log('Per Meeting:\n')
  console.log('│ Meeting         │ Athletes │ Enriched │ DOB    │ PB/SB  │')
  console.log('├─────────────────┼──────────┼──────────┼────────┼────────┤')

  Object.entries(stats.meetings).forEach(([name, data]) => {
    const dobPct = ((data.withDob / data.athletesProcessed) * 100).toFixed(1)
    const pbPct = ((data.withPb / data.athletesProcessed) * 100).toFixed(1)
    const enrichPct = ((data.enriched / data.athletesProcessed) * 100).toFixed(1)

    console.log(
      `│ ${name.padEnd(15)} │ ${String(data.athletesProcessed).padStart(8)} │ ${String(enrichPct + '%').padStart(8)} │ ${dobPct.padStart(5)}% │ ${pbPct.padStart(5)}% │`,
    )
  })

  console.log('└─────────────────┴──────────┴──────────┴────────┴────────┘\n')

  console.log('Recommendations:')
  if (stats.dobFound / stats.totalAthletes < 0.5) {
    console.log('  ⚠  Low DOB coverage — consider manual review of top athletes')
  }
  if (stats.pbFound / stats.totalAthletes < 0.4) {
    console.log('  ⚠  Low PB/SB coverage — some athlete records may be incomplete')
  }
  if (stats.enrichedAthletes / stats.totalAthletes > 0.8) {
    console.log('  ✓  Good enrichment coverage — most athletes have been enhanced')
  }

  console.log('\n')
}

main()
