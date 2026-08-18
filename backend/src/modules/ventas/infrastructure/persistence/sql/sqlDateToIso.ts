/** Convierte Date/string SQL a ISO para persistencia Ventas. */
export function sqlDateToIso(v: Date | string): string {
  if (v instanceof Date) return v.toISOString()
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString()
}
