import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import type { PurchaseOrder, Reception } from '@/types/domain'
import type { OrdenCompraDto } from '@/services/api/comprasApi'
import {
  isFacturaAnulada,
  nextNumeroFacturaProveedor,
} from '@/modules/compras/services/comprasScriptdb'

export { nextNumeroFacturaProveedor } from '@/modules/compras/services/comprasScriptdb'

/** OC nacional con recepción confirmada y sin factura activa registrada. */
export function ordersEligibleForFactura(
  orders: PurchaseOrder[],
  receptions: Reception[],
  invoices: SupplierInvoice[]
): PurchaseOrder[] {
  const invoicedOrderCodes = new Set(
    invoices.filter((i) => !isFacturaAnulada(i)).map((i) => i.orderId)
  )
  const receivedOrderCodes = new Set(
    receptions
      .filter((r) => r.status === 'complete' && r.purchaseType !== 'international')
      .map((r) => r.orderId)
  )

  return orders.filter(
    (o) =>
      o.purchaseType !== 'international' &&
      receivedOrderCodes.has(o.id) &&
      !invoicedOrderCodes.has(o.id)
  )
}

/** Alta local alineada a FacturaProveedores + CuentasPorPagar (scriptdb). */
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
    amount: order.total,
    status: 'pending',
    currency: order.currency || 'DOP',
    numeroFactura: codigo,
    ncf: input.ncf?.trim() || undefined,
    /** FacturaProveedores.estado — public/scriptdb */
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
      costoUnitario: Number(d.costoUnitario),
      descuento: Number(d.descuento ?? 0),
      impuesto: Number(d.impuesto ?? 0),
    })),
  }
}
