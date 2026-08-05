/**
 * Compras — alineación con public/scriptdb (MODULO COMPRAS Y FINANCIERO).
 *
 * FacturaProveedores.estado: Pendiente | Pagada | Vencida | Anulada
 * CuentasPorPagar.estado: Pendiente | Pagado Parcial | Pagado | Vencido
 */
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

/** Estado unificado leído desde FacturaProveedores.estado (scriptdb). */
export function facturaProveedoresEstado(
  invoice: Pick<SupplierInvoice, 'documentEstado' | 'estadoPago' | 'status'>
): string {
  const raw = invoice.documentEstado ?? invoice.estadoPago ?? invoice.status ?? ''
  const e = String(raw).toLowerCase()
  if (e === 'paid' || e === 'pagada') return 'Pagada'
  if (e === 'pending' || e === 'pendiente') return 'Pendiente'
  if (e === 'partial' || e === 'parcial') return 'Pagado Parcial'
  if (e === 'anulada') return 'Anulada'
  if (e === 'vencida') return 'Vencida'
  if (e === 'registrada' || e === 'contabilizada') return 'Pendiente'
  return String(raw)
}

export function isFacturaAnulada(
  invoice: Pick<SupplierInvoice, 'documentEstado' | 'estadoPago' | 'status'>
): boolean {
  return facturaProveedoresEstado(invoice) === 'Anulada'
}

export function isFacturaPagada(
  invoice: Pick<SupplierInvoice, 'documentEstado' | 'estadoPago' | 'status'>
): boolean {
  return facturaProveedoresEstado(invoice) === 'Pagada'
}

/** Código secuencial FP-NNN según FacturaProveedores.numero_factura en scriptdb. */
export function nextNumeroFacturaProveedor(existingInvoices: SupplierInvoice[] = []): string {
  const prefix = 'FP-'
  let max = 0
  for (const inv of existingInvoices) {
    if (isFacturaAnulada(inv)) continue
    for (const value of [inv.id, inv.numeroFactura]) {
      if (!value?.startsWith(prefix)) continue
      const n = Number.parseInt(value.slice(prefix.length), 10)
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}
