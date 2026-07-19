/**
 * Utilidades de moneda del ERP (catálogo monedas + tasas_cambio + formateo UI).
 * Estándar: importes DECIMAL(18,2) — siempre 2 decimales visibles.
 * Evita IDs hardcodeados y tasas fijas en services/UI.
 */
import { monedasApi, type MonedaDto } from '@/services/api/monedasApi'
import { tasasCambioApi } from '@/services/api/tasasCambioApi'

export type MonedaCodigoUi = 'DOP' | 'USD' | 'EUR' | 'COP' | string

export type MonedaCatalog = Pick<MonedaDto, 'id' | 'code' | 'name' | 'symbol' | 'isDefault'>

const SYMBOL_BY_CODE: Record<string, string> = {
  DOP: 'RD$',
  USD: 'USD',
  EUR: 'EUR',
  COP: 'COP',
}

let cache: MonedaCatalog[] | null = null

export function roundMoney(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Formateador monetario único del ERP.
 * Miles con coma, exactamente 2 decimales (ej. RD$ 120,486.00).
 * Estilo numérico fijo en-US para cumplir el estándar LibroSys en toda la UI.
 */
export function formatMoney(amount: number, currency: MonedaCodigoUi = 'DOP'): string {
  const code = String(currency || 'DOP').toUpperCase()
  const symbol = SYMBOL_BY_CODE[code] ?? `${code}`
  const n = roundMoney(Number(amount) || 0)
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol} ${body}`.replace(/\s+/g, ' ').trim()
}

/** Atajo DOP — delega en formatMoney. */
export function formatDop(amount: number): string {
  return formatMoney(amount, 'DOP')
}

export async function loadMonedas(force = false): Promise<MonedaCatalog[]> {
  if (!force && cache?.length) return cache
  const list = await monedasApi.list()
  cache = list.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    symbol: m.symbol,
    isDefault: m.isDefault,
  }))
  return cache
}

export function clearMonedasCache(): void {
  cache = null
}

export function monedaIdFromCode(code: string, monedas: MonedaCatalog[]): number {
  const c = code.trim().toUpperCase()
  const found = monedas.find((m) => m.code.toUpperCase() === c)
  if (found) {
    const id = Number(found.id)
    if (Number.isFinite(id) && id > 0) return id
  }
  const dop = monedas.find((m) => m.code.toUpperCase() === 'DOP' || m.isDefault)
  const fallback = Number(dop?.id ?? 1)
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 1
}

export function monedaCodeFromId(monedaId: number | string, monedas: MonedaCatalog[]): string {
  const id = String(monedaId)
  const found = monedas.find((m) => String(m.id) === id)
  return found?.code?.toUpperCase() ?? 'DOP'
}

/**
 * Obtiene tasa vigente origen → destino (default DOP) desde API.
 * DOP→DOP = 1. Lanza si no hay tasa.
 */
export async function resolveTasaCambio(
  fromCode: string,
  toCode = 'DOP',
): Promise<number> {
  const from = fromCode.trim().toUpperCase()
  const to = toCode.trim().toUpperCase()
  if (from === to) return 1

  const rates = await tasasCambioApi.list({ estado: 'activa' })
  const match = rates.find((r) => {
    const o = String(r.fromCurrency ?? r.origen_codigo ?? '').toUpperCase()
    const d = String(r.toCurrency ?? r.destino_codigo ?? '').toUpperCase()
    const status = String(r.status ?? r.estado ?? 'active')
    return o === from && d === to && (status === 'active' || status === 'activa')
  })
  const value = Number(match?.value ?? match?.tasa ?? match?.rate)
  if (!(value > 0)) {
    throw new Error(`No hay tasa de cambio vigente ${from} → ${to}. Configure tasas en Administración.`)
  }
  return value
}
