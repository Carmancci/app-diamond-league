const DISCIPLINES: Record<string, string> = {
  'Pole Vault': 'Salto com vara', 'High Jump': 'Salto em altura', 'Long Jump': 'Salto em distância',
  'Triple Jump': 'Salto triplo', 'Shot Put': 'Arremesso de peso', 'Discus Throw': 'Lançamento de disco',
  'Javelin Throw': 'Lançamento de dardo', 'Hammer Throw': 'Lançamento de martelo',
  '100m Hurdles': '100 m com barreiras', '110m Hurdles': '110 m com barreiras',
  '400m Hurdles': '400 m com barreiras', '3000m Steeplechase': '3.000 m com obstáculos',
  '1 Mile': '1 milha',
}

const RECORDS: Record<string, string> = {
  'World Record': 'Recorde mundial', 'World Lead': 'Melhor marca mundial do ano',
  'Area Record': 'Recorde continental', 'Diamond League Record': 'Recorde da Diamond League',
  'Meeting Record': 'Recorde da etapa', 'National Record': 'Recorde nacional',
}

const LISTS: Record<string, string> = {
  Results: 'Resultados', 'Entry List': 'Lista de inscritos', 'Start List': 'Lista de largada',
  'Qualification standings': 'Classificação para a final', Records: 'Recordes',
}

export function disciplinePtBr(value: string) {
  return DISCIPLINES[value] ?? value.replace(/(\d+)m\b/g, '$1 m')
}

export function recordPtBr(value: string) {
  return RECORDS[value] ?? value
}

export function listLabelPtBr(value?: string, type?: string) {
  if (value && LISTS[value]) return LISTS[value]
  if (type === 'inscritos') return 'Lista de inscritos'
  if (type === 'resultados_parciais') return 'Resultados parciais'
  if (type === 'resultados_finais') return 'Resultados oficiais'
  return value ?? 'Programa'
}

export function phasePtBr(value?: string) {
  if (!value) return undefined
  return value
    .replace(/^Final$/i, 'Final')
    .replace(/^Heat\s*(\d+)/i, 'Série $1')
    .replace(/^Qualification/i, 'Qualificação')
    .replace(/^Round\s*(\d+)/i, 'Rodada $1')
}

export function dataStatePtBr(state?: string) {
  const labels: Record<string, string> = {
    aguardando_fonte: 'Aguardando publicação oficial', coletado: 'Coletado', validando: 'Em validação',
    confirmado_oficial: 'Confirmado pela fonte oficial', parcial: 'Dados parciais',
    divergente: 'Divergência em análise', falha_coleta: 'Falha de atualização', desatualizado: 'Pode estar desatualizado',
  }
  return labels[state ?? ''] ?? 'Estado não informado'
}
