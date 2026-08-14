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

/** Código secuencial PREFIX-NNN según valores existentes (scriptdb: EMB-001, FP-001, …). */
export function nextSequentialCode(prefix: string, existingValues: string[], pad = 3): string {
  const base = `${prefix}-`
  let max = 0
  for (const value of existingValues) {
    if (!value?.startsWith(base)) continue
    const n = Number.parseInt(value.slice(base.length), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${base}${String(max + 1).padStart(pad, '0')}`
}

/** Código embarque secuencial (Embarque.codigo_embarque en scriptdb). */
export function nextEmbarqueCode(existingCodes: string[]): string {
  return nextSequentialCode('EMB', existingCodes)
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
