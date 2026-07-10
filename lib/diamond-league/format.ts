/**
 * Os PDFs trazem nomes como "SOBRENOME Nome" (sobrenome em caixa alta).
 * Aqui reordenamos para exibição no estilo "Nome SOBRENOME".
 */
export function splitName(raw: string): { given: string; family: string } {
  const tokens = raw.trim().split(/\s+/)
  const family: string[] = []
  const given: string[] = []
  for (const t of tokens) {
    const isUpper = t.length > 1 && t === t.toUpperCase() && /[A-ZÀ-Þ]/.test(t)
    if (isUpper && given.length === 0) family.push(t)
    else given.push(t)
  }
  // fallback: se tudo caiu num lado só
  if (given.length === 0) return { given: '', family: family.join(' ') }
  if (family.length === 0) return { given: given.join(' '), family: '' }
  return { given: given.join(' '), family: family.join(' ') }
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s'\-])([a-zà-þ])/g, (_, p, c) => p + c.toUpperCase())
}

/** Nome para exibição: "Nome SOBRENOME". */
export function displayName(raw: string): string {
  const { given, family } = splitName(raw)
  if (!given) return family
  if (!family) return titleCase(given)
  return `${titleCase(given)} ${family}`
}

/** Iniciais para avatar (ex.: "NL"). */
export function initials(raw: string): string {
  const { given, family } = splitName(raw)
  const a = (given || family).charAt(0)
  const b = family ? family.charAt(0) : (given.split(/\s+/)[1]?.charAt(0) ?? '')
  return (a + b).toUpperCase() || raw.slice(0, 2).toUpperCase()
}
