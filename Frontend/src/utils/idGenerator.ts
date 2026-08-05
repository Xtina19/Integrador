let counters: Record<string, number> = {
  OC: 90,
  REC: 34,
  TR: 93,
  EMB: 13,
  EV: 4,
  AJ: 13,
  K: 4,
  NOT: 0,
  ACT: 0,
}

export function nextId(prefix: string, year = 2026): string {
  counters[prefix] = (counters[prefix] ?? 0) + 1
  const num = String(counters[prefix]).padStart(3, '0')
  return `${prefix}-${year}-${num}`
}

/** Código OC secuencial según órdenes existentes (nacional e internacional). */
export function nextOrdenCompraCode(
  existingIds: string[],
  purchaseType: 'national' | 'international',
  year = new Date().getFullYear()
): string {
  const base = purchaseType === 'international' ? `OC-INT-${year}-` : `OC-${year}-`
  let max = 0
  for (const id of existingIds) {
    if (!id.startsWith(base)) continue
    const n = Number.parseInt(id.slice(base.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${base}${String(max + 1).padStart(3, '0')}`
}

export function nextSimpleId(prefix: string): string {
  counters[prefix] = (counters[prefix] ?? 0) + 1
  return `${prefix}-${Date.now()}-${counters[prefix]}`
}
