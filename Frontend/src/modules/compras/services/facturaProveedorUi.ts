import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import type { PurchaseOrder, Reception } from '@/types/domain'
import type { OrdenCompraDto } from '@/services/api/comprasApi'
import {
  isFacturaAnulada,
  nextNumeroFacturaProveedor,
} from '@/modules/compras/services/comprasScriptdb'

export { nextNumeroFacturaProveedor } from '@/modules/compras/services/comprasScriptdb'

/** OC con recepción confirmada (nacional) u orden aprobada (internacional), sin factura activa. */
export function ordersEligibleForFactura(
  orders: PurchaseOrder[],
  receptions: Reception[],
  invoices: SupplierInvoice[]
): PurchaseOrder[] {
  const invoicedOrderCodes = new Set(
    invoices.filter((i) => !isFacturaAnulada(i)).map((i) => i.orderId)
  )
  const receivedOrderCodes = new Set(
    receptions.filter((r) => r.status === 'complete').map((r) => r.orderId)
  )
  const approvedOrderCodes = new Set(
    orders.filter((o) => o.status === 'approved' || o.status === 'received').map((o) => o.id)
  )

  return orders.filter((o) => {
    if (invoicedOrderCodes.has(o.id)) return false
    if (o.purchaseType === 'international') {
      return approvedOrderCodes.has(o.id)
    }
    return receivedOrderCodes.has(o.id)
  })
}

/** Alta local alineada a FacturaProveedores + CuentasPorPagar (scriptdb). Monto se define al pagar. */
export function registerLocalSupplierInvoice(
  order: PurchaseOrder,
  input: {
    ncf?: string
    fechaEmision: string
    fechaVencimiento?: string
  },
  existingInvoices: SupplierInvoice[] = []
): SupplierInvoice {
  const duplicate = existingInvoices.some(
    (i) => i.orderId === order.id && !isFacturaAnulada(i)
  )
  if (duplicate) {
    throw new Error('Esta orden ya tiene una factura registrada.')
  }

  const codigo = nextNumeroFacturaProveedor(existingInvoices)
  const vencimiento =
    input.fechaVencimiento ||
    (() => {
      const d = new Date(input.fechaEmision)
      d.setDate(d.getDate() + 30)
      return d.toISOString().slice(0, 10)
    })()

  return {
    id: codigo,
    supplier: order.supplier,
    orderId: order.id,
    date: input.fechaEmision,
    amount: 0,
    status: 'pending',
    currency: order.currency || 'DOP',
    purchaseType: order.purchaseType,
    numeroFactura: codigo,
    ncf: input.ncf?.trim() || undefined,
    documentEstado: 'Pendiente',
    estadoPago: 'Pendiente',
    fechaVencimiento: vencimiento,
  }
}

export function buildRegistrarFacturaBody(
  orden: OrdenCompraDto,
  input: {
    ncf?: string
    fechaEmision: string
    fechaVencimiento?: string
    fechaRecepcionDocumento?: string
  }
): Record<string, unknown> {
  const detalles = orden.detalles ?? []
  if (!detalles.length) {
    throw new Error('La orden no tiene líneas de detalle para facturar.')
  }

  return {
    ordenCompraId: orden.id,
    proveedorId: orden.proveedorId,
    ncf: input.ncf?.trim() || null,
    monedaId: orden.monedaId,
    condicionPagoId: orden.condicionPagoId,
    fechaEmision: input.fechaEmision,
    fechaVencimiento: input.fechaVencimiento || undefined,
    fechaRecepcionDocumento: input.fechaRecepcionDocumento || undefined,
    lineas: detalles.map((d) => ({
      productoId: d.productoId,
      detalleOrdenCompraId: d.id,
      cantidad: Number(d.cantidadSolicitada),
      costoUnitario: 0,
      descuento: 0,
      impuesto: 0,
    })),
  }
}
