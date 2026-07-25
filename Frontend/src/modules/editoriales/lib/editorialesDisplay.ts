/**
 * Utilidades de presentación del módulo Editoriales (fechas + texto UTF-8).
 */

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

/** Corrige mojibake típico UTF-8 leído como Latin-1 (EspaÃ±a → España). */
export function fixUtf8Text(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  const s = String(value)
  // Señales de mojibake: Ã, Â, â€
  if (!/[ÃÂ]/.test(s) && !/â€/.test(s)) return s
  try {
    const bytes = Uint8Array.from(s, (ch) => ch.charCodeAt(0) & 0xff)
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    if (decoded && !decoded.includes('\uFFFD') && decoded !== s) return decoded
  } catch {
    /* keep original */
  }
  return s
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
}

/**
 * Normaliza cualquier fecha entrante a `YYYY-MM-DD` (para lógica e input date).
 * Acepta ISO, Date string JS ("Wed Dec 30 2026 …") y ya-normalizadas.
 */
export function toDateInputValue(raw: string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Fecha de UI unificada: `30/12/2026`. */
export function formatEditorialDate(raw: string | null | undefined): string {
  const iso = toDateInputValue(raw)
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Variante corta: `30 dic 2026` (exports/subtítulos). */
export function formatEditorialDateLong(raw: string | null | undefined): string {
  const iso = toDateInputValue(raw)
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const month = MONTHS_ES[Number(m) - 1] ?? m
  return `${Number(d)} ${month} ${y}`
}

export function normalizeEditorialFields<T extends Record<string, unknown>>(row: T): T {
  const next = { ...row } as Record<string, unknown>
  for (const key of ['name', 'country', 'contact', 'email', 'phone', 'contractType', 'code', 'title', 'author', 'category', 'publisher'] as const) {
    if (typeof next[key] === 'string') next[key] = fixUtf8Text(next[key] as string)
  }
  if ('contractExpiry' in next) {
    next.contractExpiry = toDateInputValue(next.contractExpiry as string)
  }
  return next as T
}
