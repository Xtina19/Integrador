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

export function nextSimpleId(prefix: string): string {
  counters[prefix] = (counters[prefix] ?? 0) + 1
  return `${prefix}-${Date.now()}-${counters[prefix]}`
}
