const WORLD_ATHLETICS_API = 'https://api.worldathletics.org'

// Criar cache local para não sobrecarregar a API
const cacheMap = new Map()

/**
 * Busca perfil de atleta na World Athletics API
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} country ISO 3-letter code
 * @returns {Promise<{dob?: string, pb?: object, sb?: object, name?: string} | null>}
 */
export async function enrichAthleteFromWorldAthletics(firstName, lastName, country) {
  const cacheKey = `${firstName}-${lastName}-${country}`.toLowerCase()
  if (cacheMap.has(cacheKey)) {
    console.log(`[WA Cache Hit] ${cacheKey}`)
    return cacheMap.get(cacheKey)
  }

  try {
    // Busca por nome e país na API de busca
    const searchUrl = `${WORLD_ATHLETICS_API}/athletes?search=${encodeURIComponent(
      `${firstName} ${lastName}`,
    )}&country=${country}`

    console.log(`[WA API] Searching: ${cacheKey}`)
    const searchRes = await fetch(searchUrl, { timeout: 8000 })

    if (!searchRes.ok) {
      console.warn(`[WA API] Search failed for ${cacheKey}: ${searchRes.status}`)
      cacheMap.set(cacheKey, null)
      return null
    }

    const searchData = await searchRes.json()
    if (!searchData.results || searchData.results.length === 0) {
      console.warn(`[WA API] No results for ${cacheKey}`)
      cacheMap.set(cacheKey, null)
      return null
    }

    // Pegar primeiro resultado
    const athlete = searchData.results[0]
    const athleteId = athlete.id || athlete.urlSlug

    if (!athleteId) {
      cacheMap.set(cacheKey, null)
      return null
    }

    // Buscar perfil completo do atleta
    const profileUrl = `${WORLD_ATHLETICS_API}/athletes/${athleteId}`
    const profileRes = await fetch(profileUrl, { timeout: 8000 })

    if (!profileRes.ok) {
      console.warn(`[WA API] Profile fetch failed for ${athleteId}: ${profileRes.status}`)
      cacheMap.set(cacheKey, null)
      return null
    }

    const profile = await profileRes.json()

    // Extrair dados
    const enriched = {
      waId: athleteId,
      name: profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : undefined,
      dob: profile.birthDate,
      country: profile.country?.id,
    }

    // Tentar buscar PBs por modalidade
    if (profile.competitors && Array.isArray(profile.competitors)) {
      const pbsByEvent = {}
      profile.competitors.forEach((comp) => {
        if (comp.records && Array.isArray(comp.records)) {
          comp.records.forEach((record) => {
            if (record.mark && (record.recordType === 'PB' || record.recordType === 'SB')) {
              const event = comp.eventId || record.discipline
              if (event && !pbsByEvent[event]) {
                pbsByEvent[event] = {
                  pb: record.recordType === 'PB' ? record.mark : undefined,
                  sb: record.recordType === 'SB' ? record.mark : undefined,
                }
              }
            }
          })
        }
      })
      if (Object.keys(pbsByEvent).length > 0) {
        enriched.pbsByEvent = pbsByEvent
      }
    }

    console.log(`[WA API] Enriched ${cacheKey}:`, enriched)
    cacheMap.set(cacheKey, enriched)
    return enriched
  } catch (error) {
    console.error(`[WA API] Error enriching ${cacheKey}:`, error.message)
    cacheMap.set(cacheKey, null)
    return null
  }
}

/**
 * Enriquecer múltiplos atletas
 * @param {Array} athletes Array de {firstName, lastName, country}
 * @returns {Promise<Map>}
 */
export async function enrichAthletes(athletes) {
  const enriched = new Map()
  const batch = 5 // Controlar concorrência

  for (let i = 0; i < athletes.length; i += batch) {
    const chunk = athletes.slice(i, i + batch)
    const promises = chunk.map((a) =>
      enrichAthleteFromWorldAthletics(a.firstName, a.lastName, a.country)
        .then((data) => {
          if (data) {
            enriched.set(`${a.firstName}-${a.lastName}-${a.country}`, data)
          }
        })
        .catch((err) => console.error(`Failed to enrich ${a.firstName} ${a.lastName}:`, err.message)),
    )
    await Promise.all(promises)
    console.log(`[WA Enrich] Processed ${Math.min(i + batch, athletes.length)}/${athletes.length}`)
  }

  return enriched
}
