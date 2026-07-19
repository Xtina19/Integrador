/**
 * Mapeo DTO API Compras ↔ tipos UI ERP (PurchaseOrder / Reception / SupplierInvoice).
 * Sin reglas de negocio: solo traducción de campos y estados.
 * Monedas: usar `lib/money` con catálogo vivo (no IDs hardcodeados).
 */
import type { PurchaseOrder, PurchaseStatus, PurchaseType, Reception } from '@/types/domain'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import type {
  FacturaProveedorDto,
  OrdenCompraDto,
  RecepcionDto,
} from '@/services/api/comprasApi'
import {
  monedaCodeFromId,
  monedaIdFromCode as monedaIdFromCatalog,
  type MonedaCatalog,
} from '@/lib/money'

/** @deprecated Preferir monedaCodeFromId(id, monedas) con catálogo API. */
export function monedaCode(monedaId: number, monedas: MonedaCatalog[] = []): string {
  if (monedas.length) return monedaCodeFromId(monedaId, monedas)
  // Fallback solo si el catálogo aún no cargó (IDs seed típicos)
  const fallback: Record<number, string> = { 1: 'DOP', 2: 'USD', 3: 'EUR', 4: 'COP' }
  return fallback[monedaId] ?? 'DOP'
}

/** @deprecated Preferir monedaIdFromCode(code, monedas) con catálogo API. */
export function monedaIdFromCode(code: string, monedas: MonedaCatalog[] = []): number {
  if (monedas.length) return monedaIdFromCatalog(code, monedas)
  const c = code.toUpperCase()
  if (c === 'USD') return 2
  if (c === 'EUR') return 3
  if (c === 'COP') return 4
  return 1
}

/** Catálogo seed Joselito (12_seed + títulos conocidos) → producto_id BD. */
const PRODUCTO_ID_BY_TITLE: Record<string, number> = {
  'cien años de soledad': 1,
  'la sombra del viento': 2,
  'harry potter y la piedra filosofal': 3,
  '1984': 4,
  'el amor en los tiempos del cólera': 5,
  'el amor en los tiempos del colera': 5,
  rayuela: 6,
  'el código da vinci': 7,
  'el codigo da vinci': 7,
  'don quijote de la mancha': 8,
  'el principito': 9,
  sapiens: 10,
}

export function resolveProductoIdByTitle(title: string): number | null {
  const key = title.trim().toLowerCase()
  return PRODUCTO_ID_BY_TITLE[key] ?? null
}


export function mapOrdenEstadoToUi(estado: string): PurchaseStatus {
  switch (estado) {
    case 'borrador':
      return 'draft'
    case 'pendiente_aprobacion':
      return 'pending'
    case 'aprobada':
    case 'parcialmente_recibida':
      return 'approved'
    case 'recibida':
      return 'received'
    case 'cerrada':
      return 'finalized'
    case 'cancelada':
      return 'cancelled'
    default:
      return 'draft'
  }
}

export function mapTipoCompraToUi(tipo: string): PurchaseType {
  return tipo === 'internacional' ? 'international' : 'national'
}

export function mapRecepcionEstadoToUi(estado: string): Reception['status'] {
  return estado === 'confirmada' ? 'complete' : 'pending'
}

export function mapPagoEstadoToUi(estadoPago: string): SupplierInvoice['status'] {
  const e = String(estadoPago || '').toLowerCase()
  if (e === 'pagada') return 'paid'
  if (e === 'parcial') return 'partial'
  return 'pending'
}

export function ordenToPurchaseOrder(
  dto: OrdenCompraDto,
  supplierName: string,
  productNames: Record<number, string> = {}
): PurchaseOrder {
  const detalles = dto.detalles ?? []
  const items = detalles.reduce((s, d) => s + Number(d.cantidadSolicitada || 0), 0)
  return {
    id: dto.codigo,
    dbId: dto.id,
    supplier: supplierName || `Proveedor #${dto.proveedorId}`,
    date: String(dto.fechaOrden).slice(0, 10),
    currency: monedaCode(dto.monedaId),
    items: items || detalles.length,
    total: Number(dto.total),
    status: mapOrdenEstadoToUi(dto.estado),
    purchaseType: mapTipoCompraToUi(dto.tipoCompra),
    lines: detalles.map((d) => ({
      product: productNames[d.productoId] ?? `Producto #${d.productoId}`,
      qty: Number(d.cantidadSolicitada),
      unitCost: Number(d.costoUnitario),
      productoId: d.productoId,
    })),
    proveedorId: dto.proveedorId,
    condicionPagoId: dto.condicionPagoId,
    monedaId: dto.monedaId,
    sucursalId: dto.sucursalId ?? undefined,
  }
}

export function recepcionToUi(
  dto: RecepcionDto,
  orderCodigo: string,
  supplierName: string,
  purchaseType: PurchaseType = 'national'
): Reception {
  const detalles = dto.detalles ?? []
  const items = detalles.reduce((s, d) => s + Number(d.cantidadRecibida || 0), 0)
  return {
    id: dto.codigo,
    dbId: dto.id,
    orderId: orderCodigo,
    orderDbId: dto.ordenCompraId,
    supplier: supplierName,
    date: String(dto.fechaRecepcion).slice(0, 10),
    items: items || detalles.length,
    status: mapRecepcionEstadoToUi(dto.estado),
    purchaseType,
  }
}

export function facturaToSupplierInvoice(
  dto: FacturaProveedorDto,
  orderCodigo: string,
  supplierName: string,
  monedas: MonedaCatalog[] = []
): SupplierInvoice {
  return {
    id: dto.codigo,
    dbId: dto.id,
    supplier: supplierName || `Proveedor #${dto.proveedorId}`,
    orderId: orderCodigo,
    date: String(dto.fechaEmision).slice(0, 10),
    amount: Number(dto.total),
    status: mapPagoEstadoToUi(dto.estadoPago),
    currency: monedaCode(dto.monedaId, monedas),
    documentEstado: dto.estado,
    estadoPago: dto.estadoPago,
  }
}
