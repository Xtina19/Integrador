/**
 * Constantes de UI del módulo Compras.
 * Estados de factura: public/scriptdb → FacturaProveedores.estado
 */
import type { PurchaseStatus } from '@/types/domain'
import { purchaseStatusLabels } from '@/constants/stateMachines'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import {
  facturaProveedoresEstado,
  isFacturaAnulada,
  isFacturaPagada,
} from '@/modules/compras/services/comprasScriptdb'

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

export const purchaseStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = Object.fromEntries(
  (Object.keys(purchaseStatusLabels) as PurchaseStatus[]).map((status) => [
    status,
    { label: purchaseStatusLabels[status], variant: purchaseStatusVariants[status] },
  ])
)

/** FacturaProveedores.estado — public/scriptdb */
export const invoiceStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  Pendiente: { label: 'Pendiente', variant: 'warning' },
  Pagada: { label: 'Pagada', variant: 'success' },
  Vencida: { label: 'Vencida', variant: 'danger' },
  Anulada: { label: 'Anulada', variant: 'danger' },
  'Pagado Parcial': { label: 'Parcial', variant: 'info' },
  pending: { label: 'Pendiente', variant: 'warning' },
  partial: { label: 'Parcial', variant: 'info' },
  paid: { label: 'Pagada', variant: 'success' },
  anulada: { label: 'Anulada', variant: 'danger' },
}

export const receptionStatusMap: Record<
  string,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Borrador', variant: 'neutral' },
  complete: { label: 'Confirmada', variant: 'success' },
}

export function invoiceStatusBadge(invoice: Pick<SupplierInvoice, 'documentEstado' | 'estadoPago' | 'status'>) {
  const estado = facturaProveedoresEstado(invoice)
  return invoiceStatusMap[estado] ?? { label: estado, variant: 'warning' as const }
}

export function canEditFacturaProveedor(invoice: Pick<SupplierInvoice, 'documentEstado'>): boolean {
  return String(invoice.documentEstado ?? '').toLowerCase() === 'borrador'
}

export function canAnularFacturaProveedor(
  invoice: Pick<SupplierInvoice, 'status' | 'documentEstado' | 'estadoPago'>
): boolean {
  if (isFacturaAnulada(invoice) || isFacturaPagada(invoice)) return false
  return true
}

/** Pendiente o parcial — registrar pago (actualiza FacturaProveedores + CuentasPorPagar). */
export function canRegistrarPagoFacturaProveedor(
  invoice: Pick<SupplierInvoice, 'status' | 'documentEstado' | 'estadoPago'>
): boolean {
  if (isFacturaAnulada(invoice) || isFacturaPagada(invoice)) return false
  return true
}
