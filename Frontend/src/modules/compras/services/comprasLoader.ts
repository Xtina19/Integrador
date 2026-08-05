/**
 * Carga agregada Compras desde API para hidratar ERPState.
 * Si algún listado falla (404/500), se devuelve vacío para ese recurso sin abortar el resto.
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
import type { FacturaProveedorDto, OrdenCompraDto, RecepcionDto } from '@/services/api/comprasApi'
import type { PageResult } from '@/services/api/comprasApi'

function supplierNameMap(rows: Record<string, unknown>[]): Record<number, string> {
  const map: Record<number, string> = {}
  for (const r of rows) {
    const id = Number(r.id)
    if (Number.isFinite(id)) map[id] = String(r.nombre ?? r.name ?? `Proveedor #${id}`)
  }
  return map
}

async function safeList<T>(
  label: string,
  fn: () => Promise<PageResult<T>>
): Promise<PageResult<T>> {
  try {
    return await fn()
  } catch (e) {
    console.warn(`[Compras] ${label} no disponible en API:`, e)
    return { data: [], page: 1, pageSize: 0, total: 0 }
  }
}

export async function loadComprasFromApi(): Promise<{
  purchaseOrders: PurchaseOrder[]
  receptions: Reception[]
  supplierInvoices: SupplierInvoice[]
  supplierNames: Record<number, string>
}> {
  const [ordenesPage, recepcionesPage, facturasPage, proveedores] = await Promise.all([
    safeList('órdenes', () => comprasApi.listOrdenes({ activo: 1 })),
    safeList('recepciones', () => comprasApi.listRecepciones({ activo: 1 })),
    safeList('facturas', () => comprasApi.listFacturas({ activo: 1 })),
    proveedoresApi.list().catch(() => [] as Record<string, unknown>[]),
  ])

  const names = supplierNameMap(proveedores)
  const ordenById = new Map(ordenesPage.data.map((o) => [o.id, o]))

  const purchaseOrders = ordenesPage.data.map((o: OrdenCompraDto) =>
    ordenToPurchaseOrder(o, o.proveedorNombre ?? names[o.proveedorId] ?? '')
  )

  const receptions = recepcionesPage.data.map((r: RecepcionDto) => {
    const orden = ordenById.get(r.ordenCompraId)
    const orderCodigo = r.ordenCodigo ?? orden?.codigo ?? String(r.ordenCompraId)
    const supplier =
      r.proveedorNombre ??
      orden?.proveedorNombre ??
      names[orden?.proveedorId ?? 0] ??
      'Proveedor'
    const tipo = r.tipoCompra ?? orden?.tipoCompra
    const purchaseType = tipo === 'internacional' ? 'international' : 'national'
    return recepcionToUi(r, orderCodigo, supplier, purchaseType)
  })

  const supplierInvoices = facturasPage.data.map((f: FacturaProveedorDto) => {
    const orden = ordenById.get(f.ordenCompraId)
    return facturaToSupplierInvoice(
      f,
      f.ordenCodigo ?? orden?.codigo ?? String(f.ordenCompraId),
      f.proveedorNombre ?? names[f.proveedorId] ?? ''
    )
  })

  return { purchaseOrders, receptions, supplierInvoices, supplierNames: names }
}
