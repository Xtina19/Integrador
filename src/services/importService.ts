import type {
  Shipment,
  InternationalInvoice,
  Consolidation,
  BookCostingEntry,
  Reception,
  PurchaseOrder,
  ShipmentCosts,
} from '../types/domain'
import type { ERPState } from '../store/initialState'
import { canTransitionImport } from '../business-rules/stateMachines'
import { validateShipment } from '../business-rules/validators'
import { computeShipmentCostsTotal, hasShipmentCosts } from '../business-rules/shipmentCosts'
import { createActivity, createNotification } from '../services/activityService'
import { nextId } from '../utils/idGenerator'
import { nowFormatted } from '../utils/timeUtils'

export interface CreateShipmentInput {
  code: string
  type: Shipment['type']
  origin: string
  destination: string
  departure: string
  arrival: string
  boxes: number
  supplier: string
  invoiceId: string
  costs: ShipmentCosts
  notes?: string
}

export interface UpdateShipmentInput {
  shipmentId: string
  code: string
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
  name: string
  status: Consolidation['status']
  notes?: string
}

function findInvoice(state: ERPState, invoiceId: string) {
  return state.internationalInvoices.find((f) => f.id === invoiceId)
}

function findOrder(state: ERPState, orderId: string) {
  return state.purchaseOrders.find((o) => o.id === orderId)
}

function buildBookCosting(order: PurchaseOrder, shipmentId: string, freightTotal: number): BookCostingEntry[] {
  if (!order.lines?.length) return []
  const subtotal = order.lines.reduce((s, l) => s + l.qty * l.unitCost, 0)
  return order.lines.map((line) => {
    const lineShare = subtotal > 0 ? (line.qty * line.unitCost) / subtotal : 0
    const freightAlloc = Number(((freightTotal * lineShare) / Math.max(line.qty, 1)).toFixed(2))
    const productCost = line.unitCost
    return {
      isbn: '',
      title: line.product,
      orderId: order.id,
      shipmentId,
      productCost,
      freightAlloc,
      finalCost: Number((productCost + freightAlloc).toFixed(2)),
    }
  })
}

function findOrCreateConsolidation(
  state: ERPState,
  invoice: InternationalInvoice,
  shipment: Shipment
): Consolidation | null {
  const existing = state.consolidations.find(
    (c) =>
      c.status === 'active' &&
      c.invoiceIds.some((id) => {
        const inv = state.internationalInvoices.find((f) => f.id === id)
        return inv?.supplier === invoice.supplier
      })
  )
  if (existing) {
    return {
      ...existing,
      orderIds: existing.orderIds.includes(invoice.orderId)
        ? existing.orderIds
        : [...existing.orderIds, invoice.orderId],
      shipmentIds: existing.shipmentIds.includes(shipment.id)
        ? existing.shipmentIds
        : [...existing.shipmentIds, shipment.id],
      invoiceIds: existing.invoiceIds.includes(invoice.id)
        ? existing.invoiceIds
        : [...existing.invoiceIds, invoice.id],
      totalBoxes: existing.totalBoxes + shipment.boxes,
    }
  }
  return {
    id: nextId('CON'),
    name: `Consolidación ${invoice.supplier} ${nowFormatted().slice(0, 7)}`,
    orderIds: [invoice.orderId],
    shipmentIds: [shipment.id],
    invoiceIds: [invoice.id],
    totalBoxes: shipment.boxes,
    status: 'active',
  }
}

export const importService = {
  registerShipment(state: ERPState, input: CreateShipmentInput) {
    const validation = validateShipment(input.supplier, input.code)
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
      code: input.code,
      type: input.type,
      origin: input.origin,
      destination: input.destination,
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
        `Embarque ${shipment.code} registrado con costos por RD$${costTotal.toLocaleString()} — OC ${invoice.orderId}.`,
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
        const created = findOrCreateConsolidation(state, invoice, shipment)
        if (created) {
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
    if (!hasShipmentCosts(input.costs)) {
      return { success: false as const, errors: ['Ingrese al menos un costo del embarque.'] }
    }

    const duplicateCode = state.shipments.some(
      (s) => s.id !== input.shipmentId && s.code.toLowerCase() === input.code.toLowerCase()
    )
    if (duplicateCode) return { success: false as const, errors: ['Ya existe un embarque con ese código.'] }

    const updated: Shipment = {
      ...shipment,
      code: input.code,
      type: input.type,
      origin: input.origin,
      destination: input.destination,
      departure: input.departure,
      arrival: input.arrival,
      boxes: input.boxes,
      notes: input.notes,
      costs: input.costs,
    }

    const updatedInvoices = shipment.invoiceId
      ? state.internationalInvoices.map((f) =>
          f.id === shipment.invoiceId ? { ...f, shipmentCode: input.code } : f
        )
      : undefined

    return {
      success: true as const,
      shipment: updated,
      updatedInvoices,
      activity: createActivity(`Embarque ${input.code} actualizado.`, 'Importaciones'),
    }
  },

  updateInternationalInvoice(state: ERPState, input: UpdateInternationalInvoiceInput) {
    const invoice = state.internationalInvoices.find((f) => f.id === input.invoiceId)
    if (!invoice) return { success: false as const, errors: ['Factura no encontrada.'] }
    if (input.amount <= 0) return { success: false as const, errors: ['El monto debe ser mayor a cero.'] }

    const updated: InternationalInvoice = {
      ...invoice,
      supplier: input.supplier,
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

    const updated: Consolidation = {
      ...consolidation,
      name: input.name,
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
      activity: createActivity(`Consolidación ${consolidationId} eliminada.`, 'Importaciones'),
    }
  },
}
