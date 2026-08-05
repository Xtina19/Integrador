/**
 * Persistencia local de facturas proveedor (sin dbId) hasta que exista API scriptdb.
 * Clave alineada al módulo Compras — public/scriptdb → FacturaProveedores.
 */
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

const STORAGE_KEY = 'librosys.compras.supplierInvoices'

export function loadLocalSupplierInvoices(): SupplierInvoice[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SupplierInvoice =>
        item != null &&
        typeof item === 'object' &&
        typeof (item as SupplierInvoice).id === 'string' &&
        typeof (item as SupplierInvoice).orderId === 'string'
    )
  } catch {
    return []
  }
}

/** Solo persiste facturas de sesión local (sin id de BD). */
export function saveLocalSupplierInvoices(invoices: SupplierInvoice[]): void {
  if (typeof window === 'undefined') return
  try {
    const localOnly = invoices.filter((i) => i.dbId == null || i.dbId <= 0)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnly))
  } catch {
    /* localStorage no disponible */
  }
}

export function mergeSupplierInvoices(
  apiInvoices: SupplierInvoice[],
  current: SupplierInvoice[]
): SupplierInvoice[] {
  const persisted = loadLocalSupplierInvoices()
  const apiOrderIds = new Set(apiInvoices.map((i) => i.orderId))
  const apiIds = new Set(apiInvoices.map((i) => i.id))

  const localById = new Map<string, SupplierInvoice>()
  for (const inv of [...persisted, ...current]) {
    if (inv.dbId != null && inv.dbId > 0) continue
    if (apiOrderIds.has(inv.orderId) || apiIds.has(inv.id)) continue
    localById.set(inv.id, inv)
  }

  return [...apiInvoices, ...localById.values()]
}
