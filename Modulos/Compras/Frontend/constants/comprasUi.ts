/**
 * Constantes de UI del módulo Compras (no son datos de negocio).
 * Estados alineados con el DER / modelos backend (sin inventar estados nuevos).
 */
import type { PurchaseStatus } from '@/types/domain'
import { purchaseStatusLabels } from '@/constants/stateMachines'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

export const purchaseStatusVariants: Record<
  PurchaseStatus | string,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  received: 'success',
  finalized: 'success',
  cancelled: 'danger',
}

/** Mapa label + variant para badges de OC. */
export const purchaseStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = Object.fromEntries(
  (Object.keys(purchaseStatusLabels) as PurchaseStatus[]).map((status) => [
    status,
    { label: purchaseStatusLabels[status], variant: purchaseStatusVariants[status] },
  ])
)

/**
 * Estado de pago de factura proveedor (DER: pendiente | parcial | pagada).
 * El documento usa registrada | contabilizada | anulada (sin borrador).
 */
export const invoiceStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  partial: { label: 'Parcial', variant: 'info' },
  paid: { label: 'Pagada', variant: 'success' },
  anulada: { label: 'Anulada', variant: 'danger' },
}

/**
 * Recepción (DER: borrador | confirmada).
 * Misma nomenclatura oficial que el resto de Compras.
 */
export const receptionStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Borrador', variant: 'neutral' },
  complete: { label: 'Confirmada', variant: 'success' },
}

/**
 * Edición UI solo si el documento está en BORRADOR (regla oficial LibroSys).
 * Compatibilidad DER: factura_proveedor.estado = registrada|contabilizada|anulada
 * (sin valor 'borrador'). Mientras el DER no evolucione, canEdit permanece en false
 * para datos reales; backend rechaza PUT/actualizar si estado ≠ borrador.
 */
export function canEditFacturaProveedor(invoice: Pick<SupplierInvoice, 'documentEstado'>): boolean {
  return String(invoice.documentEstado ?? '').toLowerCase() === 'borrador'
}

/**
 * Pendiente/parcial: visualizar y anular (con permisos).
 * Pagada / anulada: solo lectura.
 */
export function canAnularFacturaProveedor(
  invoice: Pick<SupplierInvoice, 'status' | 'documentEstado' | 'estadoPago'>
): boolean {
  const doc = String(invoice.documentEstado ?? '').toLowerCase()
  const pago = String(invoice.estadoPago ?? invoice.status ?? '').toLowerCase()
  if (doc === 'anulada') return false
  if (pago === 'pagada' || invoice.status === 'paid') return false
  return true
}
