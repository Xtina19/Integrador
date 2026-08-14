import type { PurchaseOrder, PurchaseOrderLine, Reception, InternationalInvoice } from '@/types/domain'
import type { ERPState } from '@/store/initialState'
import { canTransitionPurchase } from '@/constants/stateMachines'
import { validatePurchaseOrder, validatePurchaseOrderCreate, validateReceptionUpdate } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { isInternationalSupplier } from '@/business-rules/internationalPurchaseFlow'
import { internationalSupplierNames } from '@/mocks/mockAdmin'
import { createActivity, createNotification } from '@/services/activityService'
import { nextId, nextOrdenCompraCode } from '@/utils/idGenerator'
import { nowFormatted } from '@/utils/timeUtils'
import { registerLocalSupplierInvoice } from '@/modules/compras/services/facturaProveedorUi'

/** Líneas efectivas: usa detalle guardado o reconstruye desde ítems/total (órdenes legacy). */
export function resolvePurchaseOrderLines(order: PurchaseOrder): PurchaseOrderLine[] {
  if (order.lines?.length) return order.lines
  if (order.items <= 0) return []
  const unitCost =
    order.total > 0 && order.items > 0
      ? Number((order.total / order.items).toFixed(2))
      : 0
  return [{ product: 'Mercancía de la orden', qty: order.items, unitCost }]
}

export interface CreatePurchaseInput {
  /** Ignorado en alta: el código OC se genera automáticamente. */
  orderNumber?: string
  supplier: string
  date: string
  currency: string
  status: PurchaseOrder['status']
  purchaseType: PurchaseOrder['purchaseType']
  lines: PurchaseOrderLine[]
}

export interface UpdatePurchaseInput {
  orderId: string
  supplier: string
  date: string
  currency: string
  purchaseType: PurchaseOrder['purchaseType']
  lines: PurchaseOrderLine[]
}

export interface UpdateReceptionInput {
  receptionId: string
  date: string
  items: number
}

export const purchaseService = {
  createOrder(state: ERPState, input: CreatePurchaseInput) {
    const existingIds = state.purchaseOrders.map((o) => o.id)
    const orderNumber = nextOrdenCompraCode(existingIds, input.purchaseType)
    const validation = validatePurchaseOrderCreate(
      orderNumber,
      input.supplier,
      input.date,
      input.currency,
      input.lines,
      existingIds,
      undefined,
      { autoCode: true }
    )
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    if (input.purchaseType === 'international' && !isInternationalSupplier(input.supplier, internationalSupplierNames)) {
      return { success: false as const, errors: ['Las compras internacionales requieren un proveedor internacional.'] }
    }
    if (input.purchaseType === 'national' && isInternationalSupplier(input.supplier, internationalSupplierNames)) {
      return { success: false as const, errors: ['Los proveedores internacionales solo aplican a compras internacionales.'] }
    }

    const total = 0
    const order: PurchaseOrder = {
      id: orderNumber,
      supplier: trim(input.supplier),
      date: input.date,
      currency: input.currency,
      items: input.lines.reduce((s, l) => s + l.qty, 0),
      total,
      status: input.status === 'approved' ? 'pending' : input.status,
      purchaseType: input.purchaseType,
      lines: input.lines,
    }

    const activity = createActivity(
      `Nueva Orden de Compra ${order.purchaseType === 'international' ? 'Internacional' : 'Nacional'} ${order.id} registrada.`,
      'Compras'
    )
    const notification = createNotification(
      'info',
      input.purchaseType === 'international' ? 'Nueva OC Internacional' : 'Nueva Orden de Compra',
      `${order.id} — ${order.supplier}`,
      'Compras'
    )

    return {
      success: true as const,
      order,
      monthlyPurchasesExtra: state.monthlyPurchasesExtra + total,
      activity,
      notification,
    }
  },

  submitOrder(state: ERPState, orderId: string) {
    const order = state.purchaseOrders.find((o) => o.id === orderId)
    if (!order) return { success: false as const, errors: ['Orden no encontrada.'] }
    if (!canTransitionPurchase(order.status, 'pending')) {
      return { success: false as const, errors: ['No se puede enviar la orden en su estado actual.'] }
    }
    const validation = validatePurchaseOrder(resolvePurchaseOrderLines(order), order.supplier)
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    return {
      success: true as const,
      orderId,
      newStatus: 'pending' as const,
      activity: createActivity(`Orden ${orderId} enviada a aprobación.`, 'Compras'),
    }
  },

  approveOrder(state: ERPState, orderId: string) {
    let order = state.purchaseOrders.find((o) => o.id === orderId)
    if (!order) return { success: false as const, errors: ['Orden no encontrada.'] }

    if (order.status === 'draft') {
      if (!canTransitionPurchase(order.status, 'pending')) {
        return { success: false as const, errors: ['No se puede enviar la orden en su estado actual.'] }
      }
      const submitValidation = validatePurchaseOrder(resolvePurchaseOrderLines(order), order.supplier)
      if (!submitValidation.valid) return { success: false as const, errors: submitValidation.errors }
      order = { ...order, status: 'pending' }
    }

    if (!canTransitionPurchase(order.status, 'approved')) {
      return { success: false as const, errors: ['Solo se pueden aprobar órdenes en borrador o pendientes.'] }
    }
    const lines = resolvePurchaseOrderLines(order)
    const validation = validatePurchaseOrder(lines, order.supplier)
    if (order.items <= 0 && !lines.length) {
      return { success: false as const, errors: ['No se puede aprobar una orden sin productos.'] }
    }
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    if (order.purchaseType === 'international') {
      const supplierInvoice = registerLocalSupplierInvoice(
        order,
        { fechaEmision: nowFormatted().slice(0, 10) },
        state.supplierInvoices
      )
      const pipelineInvoice: InternationalInvoice = {
        id: supplierInvoice.id,
        orderId: order.id,
        supplier: order.supplier,
        date: supplierInvoice.date,
        currency: order.currency,
        amount: 0,
        status: 'pending',
        stage: 'invoice',
      }

      return {
        success: true as const,
        orderId,
        newStatus: 'approved' as const,
        supplierInvoice: { ...supplierInvoice, purchaseType: 'international' as const },
        internationalInvoice: pipelineInvoice,
        updatedOrder: { ...order, internationalInvoiceId: pipelineInvoice.id },
        activity: createActivity(
          `Orden internacional ${orderId} aprobada — factura ${supplierInvoice.id} registrada.`,
          'Compras'
        ),
        notification: createNotification(
          'info',
          'Factura de proveedor',
          `${supplierInvoice.id} lista para embarque — ${orderId}`,
          'Compras'
        ),
      }
    }

    const reception: Reception = {
      id: nextId('REC'),
      orderId,
      supplier: order.supplier,
      date: nowFormatted().slice(0, 10),
      items: 0,
      status: 'pending',
      purchaseType: 'national',
    }

    return {
      success: true as const,
      orderId,
      newStatus: 'approved' as const,
      reception,
      activity: createActivity(`Orden ${orderId} aprobada — recepción ${reception.id} creada.`, 'Compras'),
      notification: createNotification('success', 'Orden aprobada', `${orderId} disponible en Recepciones`, 'Compras'),
    }
  },

  completeReception(state: ERPState, receptionId: string, itemsReceived: number) {
    const reception = state.receptions.find((r) => r.id === receptionId)
    if (!reception || reception.status === 'complete') {
      return { success: false as const, errors: ['Recepción no válida o ya completada.'] }
    }
    const order = state.purchaseOrders.find((o) => o.id === reception.orderId)
    if (!order) return { success: false as const, errors: ['Orden asociada no encontrada.'] }
    if (!canTransitionPurchase(order.status, 'received')) {
      return { success: false as const, errors: ['La orden no está en estado aprobado.'] }
    }

    return {
      success: true as const,
      receptionId,
      orderId: order.id,
      itemsReceived: itemsReceived || order.items,
      orderStatus: 'received' as const,
      activity: createActivity(`Recepción ${receptionId} completada para ${order.id}.`, 'Compras'),
      notification: createNotification('info', 'Recepción completada', `Inventario actualizado — ${order.id}`, 'Inventario'),
    }
  },

  finalizeOrder(state: ERPState, orderId: string) {
    const order = state.purchaseOrders.find((o) => o.id === orderId)
    if (!order) return { success: false as const, errors: ['Orden no encontrada.'] }
    if (!canTransitionPurchase(order.status, 'finalized')) {
      return { success: false as const, errors: ['Solo se pueden finalizar órdenes recibidas.'] }
    }
    return {
      success: true as const,
      orderId,
      newStatus: 'finalized' as const,
      activity: createActivity(`Orden ${orderId} finalizada.`, 'Compras'),
    }
  },

  updateOrder(state: ERPState, input: UpdatePurchaseInput) {
    const order = state.purchaseOrders.find((o) => o.id === input.orderId)
    if (!order) return { success: false as const, errors: ['Orden no encontrada.'] }
    if (order.status !== 'draft' && order.status !== 'pending') {
      return { success: false as const, errors: ['Solo se pueden editar órdenes en borrador o pendientes.'] }
    }
    const validation = validatePurchaseOrderCreate(
      order.id,
      input.supplier,
      input.date,
      input.currency,
      input.lines,
      state.purchaseOrders.map((o) => o.id),
      order.id
    )
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const total = 0
    const updated: PurchaseOrder = {
      ...order,
      supplier: trim(input.supplier),
      date: input.date,
      currency: input.currency,
      purchaseType: input.purchaseType,
      lines: input.lines,
      items: input.lines.reduce((s, l) => s + l.qty, 0),
      total,
    }

    return {
      success: true as const,
      order: updated,
      activity: createActivity(`Orden ${order.id} actualizada.`, 'Compras'),
    }
  },

  deleteOrder(state: ERPState, orderId: string) {
    const order = state.purchaseOrders.find((o) => o.id === orderId)
    if (!order) return { success: false as const, errors: ['Orden no encontrada.'] }
    if (!['draft', 'pending', 'cancelled'].includes(order.status)) {
      return { success: false as const, errors: ['No se puede eliminar una orden aprobada o en proceso.'] }
    }
    const hasReception = state.receptions.some((r) => r.orderId === orderId)
    if (hasReception) {
      return { success: false as const, errors: ['La orden tiene recepciones asociadas.'] }
    }
    return {
      success: true as const,
      orderId,
      activity: createActivity(`Orden ${orderId} eliminada.`, 'Compras'),
    }
  },

  updateReception(state: ERPState, input: UpdateReceptionInput) {
    const reception = state.receptions.find((r) => r.id === input.receptionId)
    if (!reception) return { success: false as const, errors: ['Recepción no encontrada.'] }
    if (reception.status === 'complete') {
      return { success: false as const, errors: ['No se puede editar una recepción completada.'] }
    }
    const validation = validateReceptionUpdate({ date: input.date, items: input.items })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const updated: Reception = {
      ...reception,
      date: input.date,
      items: input.items,
    }
    return {
      success: true as const,
      reception: updated,
      activity: createActivity(`Recepción ${reception.id} actualizada.`, 'Compras'),
    }
  },

  deleteReception(state: ERPState, receptionId: string) {
    const reception = state.receptions.find((r) => r.id === receptionId)
    if (!reception) return { success: false as const, errors: ['Recepción no encontrada.'] }
    if (reception.status === 'complete') {
      return { success: false as const, errors: ['No se puede eliminar una recepción completada.'] }
    }
    return {
      success: true as const,
      receptionId,
      activity: createActivity(`Recepción ${receptionId} eliminada.`, 'Compras'),
    }
  },
}
