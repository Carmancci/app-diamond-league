import fs from 'node:fs'
import path from 'node:path'

export function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${process.pid}.tmp`
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 })
  const verification = JSON.parse(fs.readFileSync(temporary, 'utf8'))
  if (!verification || typeof verification !== 'object') throw new Error(`Falha ao verificar staging de ${filePath}`)
  fs.renameSync(temporary, filePath)
}
