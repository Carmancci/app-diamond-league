const VALID_GENDERS = new Set(['men', 'women'])
const VALID_STATES = new Set(['aguardando_fonte', 'coletado', 'validando', 'confirmado_oficial', 'parcial', 'divergente', 'falha_coleta', 'desatualizado'])

export function validateMeeting(meeting, previous) {
  const errors = []
  const warnings = []
  if (!meeting.slug || !meeting.date || !meeting.officialUrl) errors.push('Metadados obrigatórios ausentes.')
  if (!VALID_STATES.has(meeting.state)) errors.push(`Estado inválido: ${meeting.state}`)
  if (!Array.isArray(meeting.events)) errors.push('events precisa ser uma lista.')

  const eventIds = new Set()
  for (const event of meeting.events ?? []) {
    if (!event.id || eventIds.has(event.id)) errors.push(`ID de prova duplicado ou ausente: ${event.id}`)
    eventIds.add(event.id)
    if (!event.discipline || !VALID_GENDERS.has(event.gender)) errors.push(`Prova inválida: ${event.id}`)
    const athleteKeys = new Set()
    for (const athlete of event.results ?? []) {
      if (!athlete.athlete || !athlete.country) warnings.push(`${event.id}: atleta sem nome ou país.`)
      const key = athlete.athleteId || `${athlete.athlete}|${athlete.country}|${athlete.rank}`
      if (athleteKeys.has(key)) errors.push(`${event.id}: atleta duplicado (${athlete.athlete}).`)
      athleteKeys.add(key)
    }
  }

  const priorAthletes = previous?.events?.reduce((sum, event) => sum + (event.results?.length ?? 0), 0) ?? 0
  const currentAthletes = meeting.events?.reduce((sum, event) => sum + (event.results?.length ?? 0), 0) ?? 0
  if (priorAthletes >= 20 && currentAthletes < priorAthletes * 0.5) {
    errors.push(`Regressão anormal: ${priorAthletes} para ${currentAthletes} linhas de atletas.`)
  }
  if (previous?.events?.length >= 5 && meeting.events.length < previous.events.length * 0.5) {
    errors.push(`Regressão anormal: ${previous.events.length} para ${meeting.events.length} provas.`)
  }

  return { valid: errors.length === 0, errors, warnings, counts: { events: meeting.events?.length ?? 0, athletes: currentAthletes } }
}

export function validateDataset(index, meetings) {
  const errors = []
  if (index.season !== 2026) errors.push('Temporada inesperada no índice.')
  if (index.meetings.length !== meetings.length) errors.push('Índice e arquivos de etapa divergem.')
  for (const meeting of meetings) {
    const result = validateMeeting(meeting)
    errors.push(...result.errors.map((error) => `${meeting.slug}: ${error}`))
  }
  return { valid: errors.length === 0, errors }
}
