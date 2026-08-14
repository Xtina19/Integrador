import type {
  Shipment,
  InternationalInvoice,
  Consolidation,
  BookCostingEntry,
  Reception,
  PurchaseOrder,
  ShipmentCosts,
} from '@/types/domain'
import type { ERPState } from '@/store/initialState'
import { canTransitionImport } from '@/constants/stateMachines'
import { validateShipmentForm, validateInternationalInvoiceUpdate, validateConsolidationUpdate } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { computeShipmentCostsTotal, hasShipmentCosts } from '@/business-rules/shipmentCosts'
import { createActivity, createNotification } from '@/services/activityService'
import {
  allocateFreightPerUnit,
  BOOK_COSTING_MARGIN_PERCENT,
  computeBookCostingSalePrice,
} from '@/modules/importaciones/business-rules/bookCosting'
import { nextId, nextEmbarqueCode } from '@/utils/idGenerator'
import { nowFormatted } from '@/utils/timeUtils'
import { formatDop } from '@/lib/money'

export interface CreateShipmentInput {
  type: Shipment['type']
  origin: string
  destination: string
  departure: string
  arrival: string
  boxes: number
  supplier: string
  invoiceId: string
  /** Id OrdenCompra en BD (API importaciones). */
  ordenCompraId?: number
  costs: ShipmentCosts
  notes?: string
}

export interface UpdateShipmentInput {
  shipmentId: string
  type: Shipment['type']
  origin: string
  destination: string
  departure: string
  arrival: string
  boxes: number
  notes?: string
  costs: ShipmentCosts
}

export interface UpdateInternationalInvoiceInput {
  invoiceId: string
  supplier: string
  date: string
  currency: string
  amount: number
  status: InternationalInvoice['status']
}

export interface UpdateConsolidationInput {
  consolidationId: string
  status: Consolidation['status']
  notes?: string
}

function findInvoice(state: ERPState, invoiceId: string) {
  return state.internationalInvoices.find((f) => f.id === invoiceId)
}

function findOrder(state: ERPState, orderId: string) {
  return state.purchaseOrders.find((o) => o.id === orderId)
}

export interface ProductoCosteoRef {
  id: string
  isbn: string
  title: string
  cost: number
}

function parseNumericProductoId(id: string | number | undefined): number | null {
  if (id == null || id === '') return null
  const n = typeof id === 'number' ? id : Number(String(id).trim())
  return Number.isInteger(n) && n > 0 ? n : null
}

function normalizeIsbn(isbn: string | undefined): string {
  return (isbn ?? '').replace(/[-\s]/g, '').trim()
}

function resolveProductoForCosteo(
  entry: BookCostingEntry,
  catalog: ProductoCosteoRef[],
): { productoId: number; previousCost: number } | null {
  const fromEntry = parseNumericProductoId(entry.productId)
  if (fromEntry) {
    const p = catalog.find((c) => parseNumericProductoId(c.id) === fromEntry)
    return { productoId: fromEntry, previousCost: p?.cost ?? entry.previousCost ?? 0 }
  }
  const normIsbn = normalizeIsbn(entry.isbn)
  const normTitle = entry.title?.trim().toLowerCase()
  const match =
    (normIsbn ? catalog.find((p) => normalizeIsbn(p.isbn) === normIsbn) : undefined) ??
    (normTitle ? catalog.find((p) => p.title.trim().toLowerCase() === normTitle) : undefined)
  if (!match) return null
  const productoId = parseNumericProductoId(match.id)
  if (!productoId) return null
  return { productoId, previousCost: match.cost ?? 0 }
}

function buildBookCosting(
  order: PurchaseOrder,
  shipmentId: string,
  freightTotal: number,
  previous: BookCostingEntry[] = [],
): BookCostingEntry[] {
  if (!order.lines?.length) return []
  const freightPerUnit = allocateFreightPerUnit(order.lines, freightTotal)

  return order.lines.map((line, idx) => {
    const freightAlloc = freightPerUnit[idx] ?? 0
    const productCost = Number(line.unitCost ?? 0)
    const finalCost = Number((productCost + freightAlloc).toFixed(2))
    const productId = line.productoId != null ? String(line.productoId) : undefined
    const prev = previous.find(
      (p) => (productId && p.productId === productId) || p.title === line.product,
    )
    const marginPercent = prev?.marginPercent ?? BOOK_COSTING_MARGIN_PERCENT
    const salePrice = computeBookCostingSalePrice(finalCost, marginPercent)

    return {
      isbn: prev?.isbn ?? '',
      title: line.product,
      productId,
      orderId: order.id,
      shipmentId,
      productCost,
      freightAlloc,
      finalCost,
      salePrice,
      marginPercent,
    }
  })
}

function createConsolidationForShipment(state: ERPState, shipment: Shipment): Consolidation {
  const existing = state.consolidations.find((c) => c.shipmentId === shipment.id)
  if (existing) return existing

  const codeSuffix = shipment.code.replace(/^EMB-?/i, '')
  return {
    id: nextId('CON'),
    code: `CONS-${codeSuffix}`,
    shipmentId: shipment.id,
    warehouseName: 'Almacén Central',
    date: shipment.arrival,
    totalBultos: shipment.boxes,
    status: 'pending',
    notes: '',
  }
}

function consolidationStatusForShipment(status: Shipment['status']): Consolidation['status'] | undefined {
  if (status === 'received' || status === 'costed') return 'processed'
  if (status === 'finalized') return 'closed'
  return undefined
}

export const importService = {
  registerShipment(state: ERPState, input: CreateShipmentInput) {
    const existingCodes = state.shipments.map((s) => s.code)
    const code = nextEmbarqueCode(existingCodes)
    const validation = validateShipmentForm(
      {
        code,
        supplier: input.supplier,
        origin: input.origin,
        destination: input.destination,
        departure: input.departure,
        arrival: input.arrival,
        boxes: input.boxes,
        invoiceId: input.invoiceId,
      },
      existingCodes,
      undefined,
      { autoCode: true }
    )
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    if (!hasShipmentCosts(input.costs)) {
      return { success: false as const, errors: ['Ingrese al menos un costo del embarque.'] }
    }

    const invoice = findInvoice(state, input.invoiceId)
    if (!invoice) return { success: false as const, errors: ['Factura internacional no encontrada.'] }
    if (invoice.shipmentId) {
      return { success: false as const, errors: ['Esta factura ya tiene un embarque asociado.'] }
    }
    if (invoice.stage !== 'invoice' && invoice.stage !== 'shipment') {
      return { success: false as const, errors: ['La factura no está lista para embarque.'] }
    }

    const order = findOrder(state, invoice.orderId)
    if (!order || order.purchaseType !== 'international') {
      return { success: false as const, errors: ['La orden de compra internacional asociada no es válida.'] }
    }
    if (input.supplier !== invoice.supplier) {
      return { success: false as const, errors: ['El proveedor debe coincidir con la factura internacional.'] }
    }

    const shipment: Shipment = {
      id: nextId('EMB'),
      code,
      type: input.type,
      origin: trim(input.origin),
      destination: trim(input.destination),
      departure: input.departure,
      arrival: input.arrival,
      status: 'registered',
      boxes: input.boxes,
      supplier: input.supplier,
      orderId: invoice.orderId,
      invoiceId: invoice.id,
      costs: input.costs,
      notes: input.notes,
    }

    const updatedInvoice: InternationalInvoice = {
      ...invoice,
      shipmentId: shipment.id,
      shipmentCode: shipment.code,
      stage: 'freight',
    }

    const costTotal = computeShipmentCostsTotal(input.costs)

    return {
      success: true as const,
      shipment,
      updatedInvoice,
      activity: createActivity(
        `Embarque ${shipment.code} registrado con costos por ${formatDop(costTotal)} — OC ${invoice.orderId}.`,
        'Importaciones'
      ),
      notification: createNotification(
        'info',
        'Nuevo Embarque',
        `${shipment.code} — costos registrados`,
        'Importaciones'
      ),
    }
  },

  advanceStatus(state: ERPState, shipmentId: string) {
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (!shipment) return { success: false as const, errors: ['Embarque no encontrado.'] }

    const flow: Shipment['status'][] = ['registered', 'in_transit', 'customs', 'received', 'costed', 'finalized']
    const idx = flow.indexOf(shipment.status)
    const next = flow[idx + 1]
    if (!next || !canTransitionImport(shipment.status, next)) {
      return { success: false as const, errors: ['No hay transición disponible.'] }
    }

    const invoice = shipment.invoiceId ? findInvoice(state, shipment.invoiceId) : undefined
    const order = shipment.orderId ? findOrder(state, shipment.orderId) : undefined

    let updatedInvoice: InternationalInvoice | undefined
    let consolidation: Consolidation | undefined
    let consolidationUpdate: Consolidation | undefined
    let bookCosting: BookCostingEntry[] | undefined
    let reception: Reception | undefined
    let orderStatus: PurchaseOrder['status'] | undefined

    if (invoice) {
      updatedInvoice = { ...invoice }

      if (next === 'customs') {
        const created = createConsolidationForShipment(state, shipment)
        const isNew = !state.consolidations.some((c) => c.id === created.id)
        if (isNew) consolidation = created
        else consolidationUpdate = created
        updatedInvoice = {
          ...updatedInvoice,
          consolidationId: created.id,
          stage: 'consolidation',
        }
        shipment.consolidationId = created.id
      }

      const consolidationStatus = consolidationStatusForShipment(next)
      if (consolidationStatus && shipment.consolidationId) {
        const current = state.consolidations.find((c) => c.id === shipment.consolidationId)
        if (current) {
          consolidationUpdate = { ...current, status: consolidationStatus }
        }
      }

      if (next === 'costed' && order) {
        if (!hasShipmentCosts(shipment.costs)) {
          return {
            success: false as const,
            errors: ['El embarque no tiene costos registrados para calcular el costeo por libro.'],
          }
        }
        const freightTotal = computeShipmentCostsTotal(shipment.costs!)
        bookCosting = buildBookCosting(order, shipment.id, freightTotal)
        updatedInvoice = { ...updatedInvoice, stage: 'costing' }
      }

      if (next === 'finalized' && order) {
        reception = {
          id: nextId('REC'),
          orderId: order.id,
          supplier: order.supplier,
          date: nowFormatted().slice(0, 10),
          items: 0,
          status: 'pending',
          purchaseType: 'international',
          shipmentId: shipment.id,
          invoiceId: invoice.id,
        }
        updatedInvoice = { ...updatedInvoice, stage: 'reception' }
        orderStatus = 'approved'
      }

      const stageFromStatus: Partial<Record<Shipment['status'], typeof invoice.stage>> = {
        in_transit: 'shipment',
        received: 'freight',
      }
      if (stageFromStatus[next]) {
        updatedInvoice = { ...updatedInvoice, stage: stageFromStatus[next]! }
      }
    }

    return {
      success: true as const,
      shipmentId,
      newStatus: next,
      updatedShipment: { ...shipment, status: next, consolidationId: shipment.consolidationId },
      updatedInvoice,
      consolidation,
      consolidationUpdate,
      bookCosting,
      reception,
      orderStatus,
      activity: createActivity(`Embarque ${shipment.code} — estado: ${next}.`, 'Importaciones'),
      notification:
        next === 'costed'
          ? createNotification('success', 'Embarque costeado', shipment.code, 'Importaciones')
          : next === 'finalized'
            ? createNotification('info', 'Recepción creada', `Mercancía lista — OC ${order?.id}`, 'Compras')
            : null,
    }
  },

  completeImportReception(state: ERPState, receptionId: string, itemsReceived: number) {
    const reception = state.receptions.find((r) => r.id === receptionId)
    if (!reception || reception.status === 'complete' || reception.purchaseType !== 'international') {
      return { success: false as const, errors: ['Recepción internacional no válida o ya completada.'] }
    }

    const order = findOrder(state, reception.orderId)
    if (!order) return { success: false as const, errors: ['Orden asociada no encontrada.'] }

    const invoice = reception.invoiceId ? findInvoice(state, reception.invoiceId) : undefined
    const updatedInvoice = invoice
      ? { ...invoice, stage: 'completed' as const }
      : undefined

    return {
      success: true as const,
      receptionId,
      orderId: order.id,
      itemsReceived: itemsReceived || order.items,
      orderStatus: 'received' as const,
      updatedInvoice,
      activity: createActivity(
        `Recepción internacional ${receptionId} completada — inventario actualizado (OC ${order.id}).`,
        'Inventario'
      ),
      notification: createNotification(
        'success',
        'Importación completada',
        `${order.id} ingresada al inventario`,
        'Inventario'
      ),
    }
  },

  updateShipment(state: ERPState, input: UpdateShipmentInput) {
    const shipment = state.shipments.find((s) => s.id === input.shipmentId)
    if (!shipment) return { success: false as const, errors: ['Embarque no encontrado.'] }

    const validation = validateShipmentForm(
      {
        code: shipment.code,
        supplier: shipment.supplier ?? '',
        origin: input.origin,
        destination: input.destination,
        departure: input.departure,
        arrival: input.arrival,
        boxes: input.boxes,
      },
      state.shipments.map((s) => s.code),
      shipment.code,
      { autoCode: true }
    )
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    if (!hasShipmentCosts(input.costs)) {
      return { success: false as const, errors: ['Ingrese al menos un costo del embarque.'] }
    }

    const updated: Shipment = {
      ...shipment,
      type: input.type,
      origin: trim(input.origin),
      destination: trim(input.destination),
      departure: input.departure,
      arrival: input.arrival,
      boxes: input.boxes,
      notes: input.notes,
      costs: input.costs,
    }

    const updatedInvoices = shipment.invoiceId
      ? state.internationalInvoices.map((f) =>
          f.id === shipment.invoiceId ? { ...f, shipmentCode: shipment.code } : f
        )
      : undefined

    return {
      success: true as const,
      shipment: updated,
      updatedInvoices,
      activity: createActivity(`Embarque ${shipment.code} actualizado.`, 'Importaciones'),
    }
  },

  updateInternationalInvoice(state: ERPState, input: UpdateInternationalInvoiceInput) {
    const invoice = state.internationalInvoices.find((f) => f.id === input.invoiceId)
    if (!invoice) return { success: false as const, errors: ['Factura no encontrada.'] }

    const validation = validateInternationalInvoiceUpdate({
      supplier: input.supplier,
      date: input.date,
      currency: input.currency,
      amount: input.amount,
    })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const updated: InternationalInvoice = {
      ...invoice,
      supplier: trim(input.supplier),
      date: input.date,
      currency: input.currency,
      amount: input.amount,
      status: input.status,
    }

    return {
      success: true as const,
      invoice: updated,
      activity: createActivity(`Factura internacional ${invoice.id} actualizada.`, 'Importaciones'),
    }
  },

  updateConsolidation(state: ERPState, input: UpdateConsolidationInput) {
    const consolidation = state.consolidations.find((c) => c.id === input.consolidationId)
    if (!consolidation) return { success: false as const, errors: ['Consolidación no encontrada.'] }

    const validation = validateConsolidationUpdate({
      status: input.status,
      notes: input.notes,
    })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const updated: Consolidation = {
      ...consolidation,
      status: input.status,
      notes: input.notes,
    }

    return {
      success: true as const,
      consolidation: updated,
      activity: createActivity(`Consolidación ${consolidation.id} actualizada.`, 'Importaciones'),
    }
  },

  deleteShipment(state: ERPState, shipmentId: string) {
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (!shipment) return { success: false as const, errors: ['Embarque no encontrado.'] }
    if (shipment.status !== 'registered') {
      return { success: false as const, errors: ['Solo se pueden eliminar embarques en estado registrado.'] }
    }
    return {
      success: true as const,
      shipmentId,
      activity: createActivity(`Embarque ${shipment.code} eliminado.`, 'Importaciones'),
    }
  },

  deleteInternationalInvoice(state: ERPState, invoiceId: string) {
    const invoice = state.internationalInvoices.find((f) => f.id === invoiceId)
    if (!invoice) return { success: false as const, errors: ['Factura no encontrada.'] }
    const linkedShipment = state.shipments.some((s) => s.invoiceId === invoiceId)
    if (linkedShipment) {
      return { success: false as const, errors: ['La factura tiene embarques asociados.'] }
    }
    return {
      success: true as const,
      invoiceId,
      activity: createActivity(`Factura internacional ${invoiceId} eliminada.`, 'Importaciones'),
    }
  },

  deleteConsolidation(state: ERPState, consolidationId: string) {
    const consolidation = state.consolidations.find((c) => c.id === consolidationId)
    if (!consolidation) return { success: false as const, errors: ['Consolidación no encontrada.'] }
    if (consolidation.status === 'closed') {
      return { success: false as const, errors: ['No se puede eliminar una consolidación cerrada.'] }
    }
    return {
      success: true as const,
      consolidationId,
      shipmentId: consolidation.shipmentId,
      activity: createActivity(`Consolidación ${consolidation.code} eliminada.`, 'Importaciones'),
    }
  },

  applyBookCostingToInventory(state: ERPState, shipmentId: string, productCatalog: ProductoCosteoRef[]) {
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (!shipment) return { success: false as const, errors: ['Embarque no encontrado.'] }

    const pending = state.bookCosting.filter((b) => b.shipmentId === shipmentId && !b.appliedToInventory)
    if (!pending.length) {
      return { success: false as const, errors: ['No hay líneas de costeo pendientes para este embarque.'] }
    }

    const productUpdates: {
      productoId: number
      isbn: string
      title: string
      newCost: number
      newPrice: number
      marginPercent: number
      costType: string
      notes: string
      documentoRef: string
    }[] = []
    const unresolved: string[] = []

    const bookCosting = state.bookCosting.map((entry) => {
      if (entry.shipmentId !== shipmentId || entry.appliedToInventory) return entry
      const resolved = resolveProductoForCosteo(entry, productCatalog)
      if (!resolved) {
        unresolved.push(entry.title || entry.isbn || 'Producto sin nombre')
        return entry
      }
      productUpdates.push({
        productoId: resolved.productoId,
        isbn: entry.isbn,
        title: entry.title,
        newCost: entry.finalCost,
        newPrice: entry.salePrice,
        marginPercent: entry.marginPercent,
        costType: 'importacion',
        notes: `Costeo importación ${shipment.code} — margen ${entry.marginPercent}%`,
        documentoRef: shipment.code,
      })
      return {
        ...entry,
        productId: String(resolved.productoId),
        previousCost: resolved.previousCost,
        appliedToInventory: true,
        appliedAt: nowFormatted(),
      }
    })

    if (unresolved.length) {
      return {
        success: false as const,
        errors: [
          `No se encontró producto en catálogo para: ${unresolved.join(', ')}. Regístrelo en Administración → Productos.`,
        ],
      }
    }

    if (!productUpdates.length) {
      return {
        success: false as const,
        errors: ['No se encontraron productos en inventario para aplicar el costeo.'],
      }
    }

    return {
      success: true as const,
      bookCosting,
      productUpdates,
      activity: createActivity(
        `Costeo del embarque ${shipment.code} aplicado a ${productUpdates.length} producto(s).`,
        'Importaciones',
      ),
      notification: createNotification(
        'success',
        'Costeo aplicado',
        `${productUpdates.length} producto(s) actualizados`,
        'Inventario',
      ),
    }
  },
}

/** Costeo por libro tras embarque costeado (API o local). */
export function computeBookCostingForShipment(state: ERPState, shipment: Shipment): BookCostingEntry[] {
  if (!shipment.orderId || !hasShipmentCosts(shipment.costs)) return []
  const order = findOrder(state, shipment.orderId)
  if (!order?.lines?.length) return []
  const freightTotal = computeShipmentCostsTotal(shipment.costs!)
  const previous = state.bookCosting.filter((b) => b.shipmentId === shipment.id)
  return buildBookCosting(order, shipment.id, freightTotal, previous)
}
