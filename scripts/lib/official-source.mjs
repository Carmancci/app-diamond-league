import { createHash } from 'node:crypto'

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function fetchOfficialJson(url, { attempts = 3, timeout = 15_000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'DiamondLeagueBrasil/2.0 (+dados esportivos oficiais)' },
        signal: controller.signal,
      })
      if (response.status === 404) return { kind: 'not-published', status: 404 }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const contentType = response.headers.get('content-type') ?? ''
      const text = await response.text()
      if (!contentType.includes('json') && !text.trimStart().startsWith('{')) {
        throw new Error(`Content-Type inesperado: ${contentType || 'ausente'}`)
      }
      if (text.length < 100) throw new Error('Resposta oficial vazia ou curta demais.')
      const raw = JSON.parse(text)
      return {
        kind: 'success',
        raw,
        checksum: createHash('sha256').update(text).digest('hex'),
      }
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(400 * 2 ** (attempt - 1))
    } finally {
      clearTimeout(timer)
    }
  }
  return { kind: 'failure', error: lastError instanceof Error ? lastError.message : String(lastError) }
}
