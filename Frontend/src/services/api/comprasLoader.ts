/**
 * Carga agregada Compras desde API para hidratar ERPState.
 * FASE 9: usa listados paginados (sin N+1 getById por fila).
 * El detalle de líneas se obtiene al abrir un documento (getOrden / getRecepcion).
 */
import { comprasApi } from '@/services/api/comprasApi'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import {
  facturaToSupplierInvoice,
  ordenToPurchaseOrder,
  recepcionToUi,
} from '@/services/api/comprasMappers'
import type { PurchaseOrder, Reception } from '@/types/domain'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

function supplierNameMap(rows: Record<string, unknown>[]): Record<number, string> {
  const map: Record<number, string> = {}
  for (const r of rows) {
    const id = Number(r.id)
    if (Number.isFinite(id)) map[id] = String(r.nombre ?? r.name ?? `Proveedor #${id}`)
  }
  return map
}

export async function loadComprasFromApi(): Promise<{
  purchaseOrders: PurchaseOrder[]
  receptions: Reception[]
  supplierInvoices: SupplierInvoice[]
  supplierNames: Record<number, string>
}> {
  const [ordenesPage, recepcionesPage, facturasPage, proveedores] = await Promise.all([
    comprasApi.listOrdenes({ activo: 1 }),
    comprasApi.listRecepciones({ activo: 1 }),
    comprasApi.listFacturas({ activo: 1 }),
    proveedoresApi.list(),
  ])

  const names = supplierNameMap(proveedores)
  const ordenById = new Map(ordenesPage.data.map((o) => [o.id, o]))

  const purchaseOrders = ordenesPage.data.map((o) =>
    ordenToPurchaseOrder(o, names[o.proveedorId] ?? '')
  )

  const receptions = recepcionesPage.data.map((r) => {
    const orden = ordenById.get(r.ordenCompraId)
    const orderCodigo = orden?.codigo ?? String(r.ordenCompraId)
    const supplier =
      names[orden?.proveedorId ?? 0] ??
      (orden ? `Proveedor #${orden.proveedorId}` : 'Proveedor')
    const purchaseType = orden?.tipoCompra === 'internacional' ? 'international' : 'national'
    return recepcionToUi(r, orderCodigo, supplier, purchaseType)
  })

  const supplierInvoices = facturasPage.data.map((f) => {
    const orden = ordenById.get(f.ordenCompraId)
    return facturaToSupplierInvoice(
      f,
      orden?.codigo ?? String(f.ordenCompraId),
      names[f.proveedorId] ?? ''
    )
  })

  return { purchaseOrders, receptions, supplierInvoices, supplierNames: names }
}
