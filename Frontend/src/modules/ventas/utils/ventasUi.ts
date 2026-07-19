import type { EstadoVentaDto } from '@/services/api/ventasApi'
import { formatDop as formatDopShared, formatMoney } from '@/lib/money'

export { formatMoney }

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold'

/** Estados visuales alineados a VEN-DOM (máquina emitida | anulada). */
export function ventaEstadoBadge(estado: EstadoVentaDto): BadgeVariant {
  return estado === 'anulada' ? 'danger' : 'success'
}

export function ventaEstadoLabel(estado: EstadoVentaDto): string {
  return estado === 'anulada' ? 'Anulada' : 'Emitida'
}

export function tipoVentaLabel(tipo: string): string {
  return tipo === 'cliente_registrado' ? 'Cliente registrado' : 'Consumidor final'
}

export function formaPagoLabel(forma: string): string {
  const map: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    nota_credito: 'Nota de crédito',
  }
  return map[forma] ?? forma
}

/** Estados visibles de NC (diseño aprobado). */
export function notaCreditoEstadoLabel(estado: string): string {
  const map: Record<string, string> = {
    emitida: 'Disponible',
    parcialmente_aplicada: 'Parcialmente utilizada',
    aplicada: 'Utilizada',
    anulada: 'Anulada',
  }
  return map[estado] ?? estado
}

export function notaCreditoEstadoBadge(
  estado: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold' {
  if (estado === 'emitida') return 'success'
  if (estado === 'parcialmente_aplicada') return 'warning'
  if (estado === 'aplicada') return 'neutral'
  if (estado === 'anulada') return 'danger'
  return 'info'
}

/** Etiquetas legibles para referencias del universo Joselito (sin mostrar IDs técnicos). */
const REF_LABELS: Record<string, string> = {
  'suc-central': 'Sucursal Central',
  'suc-santiago': 'Sucursal Santiago',
  'suc-polanco': 'Sucursal Polanco',
  'suc-villa': 'Sucursal Villa Olga',
  'alm-central': 'Almacén Central',
  'alm-polanco': 'Almacén Central',
  'alm-santiago': 'Almacén Santiago',
  'usr-cajero': 'Cajero',
  'usr-supervisor': 'Supervisor',
  'usr-admin': 'Administrador',
  'cli-mostrador': 'Cliente de Mostrador',
  'cli-lasalle': 'Colegio La Salle',
  'cli-iberia': 'Instituto Iberia',
  'cli-pucmm': 'PUCMM',
  'cli-utesa': 'UTESA',
  'cli-sagrado': 'Colegio Sagrado Corazón',
  'cli-libuni': 'Librería Universitaria',
  'cli-fundacion': 'Fundación Madre y Maestra',
  'cli-maria': 'María González',
  'CLI-000001': 'Colegio La Salle',
  'CLI-000002': 'Instituto Iberia',
  'CLI-000003': 'PUCMM',
  'CLI-000004': 'UTESA',
  'CLI-000005': 'Colegio Sagrado Corazón',
  'CLI-000006': 'Librería Universitaria',
  'CLI-000007': 'Fundación Madre y Maestra',
  'CLI-000008': 'Cliente de Mostrador',
}

export function refLabel(id: string | undefined | null, fallback = '—'): string {
  if (!id?.trim()) return fallback
  return REF_LABELS[id] ?? id
}

/** Formato DOP vía helper central del ERP (siempre 2 decimales). */
export function formatDop(n: number): string {
  return formatDopShared(n)
}

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
