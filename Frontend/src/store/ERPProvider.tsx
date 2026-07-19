import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ERPState } from './initialState'
import { createInitialERPState } from './initialState'
import { purchaseService, type CreatePurchaseInput, type UpdatePurchaseInput, type UpdateReceptionInput } from '@/services/purchaseService'
import { comprasApi } from '@/services/api/comprasApi'
import { loadComprasFromApi } from '@/services/api/comprasLoader'
import { monedaIdFromCode, ordenToPurchaseOrder, resolveProductoIdByTitle } from '@/services/api/comprasMappers'
import { loadMonedas, resolveTasaCambio, roundMoney } from '@/lib/money'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { inventoryService, type CreateProductInput, type CreateAdjustmentInput, type UpdateProductInput } from '@/services/inventoryService'
import { transferService, type CreateTransferInput } from '@/services/transferService'
import { importService, type CreateShipmentInput, type UpdateShipmentInput, type UpdateInternationalInvoiceInput, type UpdateConsolidationInput } from '@/services/importService'
import { eventService, type CreateEventInput, type UpdateEventInput } from '@/services/eventService'
import { dashboardService } from '@/services/dashboardService'
import { prependActivity, prependNotification } from '@/services/activityService'
import type { Activity, Notification, InternationalInvoice } from '@/types/domain'

interface ERPContextValue {
  state: ERPState
  metrics: ReturnType<typeof dashboardService.getMetrics>
  lowStockProducts: ReturnType<typeof dashboardService.getLowStockProducts>
  activities: Activity[]
  notifications: Notification[]
  unreadNotifications: number
  comprasReady: boolean
  refreshCompras: () => Promise<void>

  createPurchaseOrder: (input: CreatePurchaseInput) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>
  updatePurchaseOrder: (input: UpdatePurchaseInput) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>
  deletePurchaseOrder: (orderId: string) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>
  approvePurchaseOrder: (orderId: string) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>
  completeReception: (receptionId: string, items?: number) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>
  updateReception: (input: UpdateReceptionInput) => { success: boolean; errors?: string[] }
  deleteReception: (receptionId: string) => { success: boolean; errors?: string[] } | Promise<{ success: boolean; errors?: string[] }>

  createProduct: (input: CreateProductInput) => { success: boolean; errors?: string[] }
  updateProduct: (input: UpdateProductInput) => { success: boolean; errors?: string[] }
  deleteProduct: (productId: string) => { success: boolean; errors?: string[] }
  createAdjustment: (input: CreateAdjustmentInput) => { success: boolean; errors?: string[] }

  createTransfer: (input: CreateTransferInput) => { success: boolean; errors?: string[] }
  approveTransfer: (transferId: string) => { success: boolean; errors?: string[] }
  shipTransfer: (transferId: string) => { success: boolean; errors?: string[] }
  receiveTransfer: (transferId: string) => { success: boolean; errors?: string[] }
  finalizeTransfer: (transferId: string) => { success: boolean; errors?: string[] }

  registerShipment: (input: CreateShipmentInput) => { success: boolean; errors?: string[] }
  advanceShipment: (shipmentId: string) => { success: boolean; errors?: string[] }
  updateShipment: (input: UpdateShipmentInput) => { success: boolean; errors?: string[] }
  updateInternationalInvoice: (input: UpdateInternationalInvoiceInput) => { success: boolean; errors?: string[] }
  updateConsolidation: (input: UpdateConsolidationInput) => { success: boolean; errors?: string[] }
  deleteShipment: (shipmentId: string) => { success: boolean; errors?: string[] }
  deleteInternationalInvoice: (invoiceId: string) => { success: boolean; errors?: string[] }
  deleteConsolidation: (consolidationId: string) => { success: boolean; errors?: string[] }

  registerEvent: (input: CreateEventInput) => { success: boolean; errors?: string[]; eventId?: string }
  updateEvent: (input: UpdateEventInput) => { success: boolean; errors?: string[] }
  deleteEvent: (eventId: string) => { success: boolean; errors?: string[] }

  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const ERPContext = createContext<ERPContextValue | null>(null)

function applySideEffects(
  setState: React.Dispatch<React.SetStateAction<ERPState>>,
  activity?: Activity,
  notification?: Notification | null
) {
  if (activity || notification) {
    setState((s) => ({
      ...s,
      activities: activity ? prependActivity(s.activities, activity) : s.activities,
      notifications: notification ? prependNotification(s.notifications, notification) : s.notifications,
    }))
  }
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ERPState>(createInitialERPState)
  const [comprasReady, setComprasReady] = useState(!comprasApi.isEnabled())

  const refreshCompras = useCallback(async () => {
    if (!comprasApi.isEnabled()) {
      setComprasReady(true)
      return
    }
    try {
      const loaded = await loadComprasFromApi()
      setState((s) => ({
        ...s,
        purchaseOrders: loaded.purchaseOrders,
        receptions: loaded.receptions,
      }))
      setComprasReady(true)
    } catch (e) {
      console.error('[Compras] No se pudo hidratar desde API:', getFriendlyErrorMessage(e))
      setComprasReady(true)
    }
  }, [])

  useEffect(() => {
    void refreshCompras()
  }, [refreshCompras])

  const metrics = useMemo(() => dashboardService.getMetrics(state), [state])
  const lowStockProducts = useMemo(() => dashboardService.getLowStockProducts(state), [state])
  const unreadNotifications = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  )

  const createPurchaseOrder = useCallback(async (input: CreatePurchaseInput) => {
    if (!comprasApi.isEnabled()) {
      const result = purchaseService.createOrder(state, input)
      if (!result.success) return { success: false, errors: result.errors }
      setState((s) => ({
        ...s,
        purchaseOrders: [...s.purchaseOrders, result.order],
        monthlyPurchasesExtra: result.monthlyPurchasesExtra,
      }))
      applySideEffects(setState, result.activity, result.notification)
      return { success: true }
    }

    try {
      const proveedores = await proveedoresApi.list()
      const proveedor = proveedores.find(
        (p) => String(p.nombre ?? p.name ?? '').toLowerCase() === input.supplier.toLowerCase()
      )
      if (!proveedor?.id) {
        return { success: false, errors: [`Proveedor no encontrado en catálogo: ${input.supplier}`] }
      }

      const condiciones = await comprasApi.listCondicionesPago()
      const condicionId = condiciones.data[0]?.id
      if (!condicionId) {
        return { success: false, errors: ['No hay condiciones de pago configuradas en Compras.'] }
      }

      const productByTitle = new Map(
        state.products.map((p) => [p.title.trim().toLowerCase(), p])
      )
      const lineas = input.lines.map((l) => {
        const resolvedId =
          l.productoId ??
          resolveProductoIdByTitle(l.product) ??
          (() => {
            const prod = productByTitle.get(l.product.trim().toLowerCase())
            const n = prod ? Number(prod.id) : NaN
            return Number.isInteger(n) && n > 0 ? n : null
          })()
        if (!resolvedId) {
          throw new Error(`Producto no mapeado a catálogo BD: ${l.product}`)
        }
        return {
          productoId: resolvedId,
          cantidadSolicitada: Math.round(l.qty),
          costoUnitario: roundMoney(l.unitCost),
          descuento: 0,
          impuesto: input.purchaseType === 'national' ? roundMoney(l.qty * l.unitCost * 0.18) : 0,
        }
      })

      const monedas = await loadMonedas()
      const monedaId = monedaIdFromCode(input.currency, monedas)
      const tasaCambio = await resolveTasaCambio(input.currency, 'DOP')

      const created = await comprasApi.createOrden({
        proveedorId: Number(proveedor.id),
        monedaId,
        condicionPagoId: condicionId,
        tipoCompra: input.purchaseType === 'international' ? 'internacional' : 'nacional',
        fechaOrden: input.date,
        sucursalId: 1,
        tasaCambio,
        estado: input.status === 'pending' ? 'pendiente_aprobacion' : 'borrador',
        lineas,
      })

      const order = ordenToPurchaseOrder(created, input.supplier)
      setState((s) => ({
        ...s,
        purchaseOrders: [...s.purchaseOrders, order],
      }))
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state])

  const updatePurchaseOrder = useCallback(async (input: UpdatePurchaseInput) => {
    if (!comprasApi.isEnabled()) {
      const result = purchaseService.updateOrder(state, input)
      if (!result.success) return { success: false, errors: result.errors }
      setState((s) => ({
        ...s,
        purchaseOrders: s.purchaseOrders.map((o) => (o.id === input.orderId ? result.order : o)),
      }))
      applySideEffects(setState, result.activity, null)
      return { success: true }
    }

    try {
      const existing = state.purchaseOrders.find((o) => o.id === input.orderId)
      if (!existing?.dbId) return { success: false, errors: ['Orden no sincronizada. Recargue e intente de nuevo.'] }

      const productByTitle = new Map(state.products.map((p) => [p.title.trim().toLowerCase(), p]))
      const lineas = input.lines.map((l) => {
        let productoId = l.productoId
        if (!productoId) {
          const prod = productByTitle.get(l.product.trim().toLowerCase())
          const n = prod ? Number(prod.id) : NaN
          if (Number.isInteger(n) && n > 0) productoId = n
        }
        if (!productoId) throw new Error(`Producto no mapeado: ${l.product}`)
        return {
          productoId,
          cantidadSolicitada: Math.round(l.qty),
          costoUnitario: roundMoney(l.unitCost),
          descuento: 0,
          impuesto: input.purchaseType === 'national' ? roundMoney(l.qty * l.unitCost * 0.18) : 0,
        }
      })

      const monedas = await loadMonedas()
      await comprasApi.updateOrden(existing.dbId, {
        fechaOrden: input.date,
        tipoCompra: input.purchaseType === 'international' ? 'internacional' : 'nacional',
        monedaId: monedaIdFromCode(input.currency, monedas),
        tasaCambio: await resolveTasaCambio(input.currency, 'DOP'),
        lineas,
      })
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const deletePurchaseOrder = useCallback(async (orderId: string) => {
    if (!comprasApi.isEnabled()) {
      const result = purchaseService.deleteOrder(state, orderId)
      if (!result.success) return { success: false, errors: result.errors }
      setState((s) => ({
        ...s,
        purchaseOrders: s.purchaseOrders.filter((o) => o.id !== orderId),
      }))
      applySideEffects(setState, result.activity, null)
      return { success: true }
    }

    try {
      const existing = state.purchaseOrders.find((o) => o.id === orderId)
      if (!existing?.dbId) return { success: false, errors: ['Orden no sincronizada. Recargue e intente de nuevo.'] }
      await comprasApi.cancelarOrden(existing.dbId)
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const approvePurchaseOrder = useCallback(async (orderId: string) => {
    if (!comprasApi.isEnabled()) {
      const result = purchaseService.approveOrder(state, orderId)
      if (!result.success) return { success: false, errors: result.errors }
      setState((s) => ({
        ...s,
        purchaseOrders: s.purchaseOrders.map((o) => {
          if (o.id !== orderId) return o
          const updated = { ...o, status: result.newStatus }
          if ('updatedOrder' in result && result.updatedOrder) {
            return result.updatedOrder
          }
          return updated
        }),
        receptions: result.reception ? [...s.receptions, result.reception] : s.receptions,
        internationalInvoices:
          'internationalInvoice' in result && result.internationalInvoice
            ? [...s.internationalInvoices, result.internationalInvoice]
            : s.internationalInvoices,
      }))
      applySideEffects(setState, result.activity, result.notification)
      return { success: true }
    }

    try {
      const existing = state.purchaseOrders.find((o) => o.id === orderId)
      if (!existing?.dbId) return { success: false, errors: ['Orden no sincronizada. Recargue e intente de nuevo.'] }
      if (existing.status === 'draft') {
        await comprasApi.enviarAprobacion(existing.dbId)
      }
      await comprasApi.aprobarOrden(existing.dbId)
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const completeReception = useCallback(async (receptionId: string, items?: number) => {
    if (!comprasApi.isEnabled()) {
      const reception = state.receptions.find((r) => r.id === receptionId)
      const isInternational = reception?.purchaseType === 'international'

      const result = isInternational
        ? importService.completeImportReception(state, receptionId, items ?? 0)
        : purchaseService.completeReception(state, receptionId, items ?? 0)
      if (!result.success) return { success: false, errors: result.errors }

      const invUpdate = inventoryService.applyReceptionToInventory(state, result.orderId, result.itemsReceived)
      const updatedInvoice: InternationalInvoice | undefined =
        isInternational && 'updatedInvoice' in result
          ? (result as { updatedInvoice?: InternationalInvoice }).updatedInvoice
          : undefined

      setState((s) => ({
        ...s,
        receptions: s.receptions.map((r) =>
          r.id === receptionId ? { ...r, status: 'complete' as const, items: result.itemsReceived } : r
        ),
        purchaseOrders: s.purchaseOrders.map((o) =>
          o.id === result.orderId ? { ...o, status: result.orderStatus } : o
        ),
        internationalInvoices: updatedInvoice
          ? s.internationalInvoices.map((f) => (f.id === updatedInvoice.id ? updatedInvoice : f))
          : s.internationalInvoices,
        products: invUpdate?.products ?? s.products,
        kardexMovements: invUpdate?.kardex ? [invUpdate.kardex, ...s.kardexMovements] : s.kardexMovements,
        stockByCategory: invUpdate?.stockByCategory ?? s.stockByCategory,
        inventoryChartData: invUpdate?.inventoryChartData ?? s.inventoryChartData,
      }))
      applySideEffects(setState, result.activity, result.notification)
      return { success: true }
    }

    try {
      const existing = state.receptions.find((r) => r.id === receptionId)
      if (!existing?.dbId) return { success: false, errors: ['Recepción no sincronizada. Recargue e intente de nuevo.'] }
      await comprasApi.confirmarRecepcion(existing.dbId, { resultadoInspeccion: 'aceptada' })
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const updateReception = useCallback((input: UpdateReceptionInput) => {
    const result = purchaseService.updateReception(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      receptions: s.receptions.map((r) => (r.id === input.receptionId ? result.reception : r)),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteReception = useCallback(async (receptionId: string) => {
    if (!comprasApi.isEnabled()) {
      const result = purchaseService.deleteReception(state, receptionId)
      if (!result.success) return { success: false, errors: result.errors }
      setState((s) => ({
        ...s,
        receptions: s.receptions.filter((r) => r.id !== receptionId),
      }))
      applySideEffects(setState, result.activity, null)
      return { success: true }
    }

    try {
      const existing = state.receptions.find((r) => r.id === receptionId)
      if (!existing?.dbId) return { success: false, errors: ['Recepción no sincronizada. Recargue e intente de nuevo.'] }
      await comprasApi.anularRecepcion(existing.dbId)
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const createProduct = useCallback((input: CreateProductInput) => {
    const result = inventoryService.createProduct(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      products: result.products,
      stockByCategory: result.stockByCategory,
      inventoryChartData: result.inventoryChartData,
    }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const updateProduct = useCallback((input: UpdateProductInput) => {
    const result = inventoryService.updateProduct(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      products: result.products,
      stockByCategory: result.stockByCategory,
      inventoryChartData: result.inventoryChartData,
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteProduct = useCallback((productId: string) => {
    const result = inventoryService.deleteProduct(state, productId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      products: result.products,
      stockByCategory: result.stockByCategory,
      inventoryChartData: result.inventoryChartData,
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const createAdjustment = useCallback((input: CreateAdjustmentInput) => {
    const result = inventoryService.createAdjustment(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      products: result.products,
      inventoryAdjustments: [result.adjustment, ...s.inventoryAdjustments],
      kardexMovements: [result.kardex, ...s.kardexMovements],
      stockByCategory: result.stockByCategory,
      inventoryChartData: result.inventoryChartData,
    }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const createTransfer = useCallback((input: CreateTransferInput) => {
    const result = transferService.createRequest(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({ ...s, transfers: [...s.transfers, result.transfer] }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const approveTransfer = useCallback((transferId: string) => {
    const result = transferService.approve(state, transferId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      transfers: s.transfers.map((t) => (t.id === transferId ? { ...t, status: result.newStatus } : t)),
    }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const shipTransfer = useCallback((transferId: string) => {
    const result = transferService.ship(state, transferId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      transfers: s.transfers.map((t) => (t.id === transferId ? { ...t, status: result.newStatus } : t)),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const receiveTransfer = useCallback((transferId: string) => {
    const result = transferService.receive(state, transferId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      transfers: s.transfers.map((t) => (t.id === transferId ? { ...t, status: result.newStatus } : t)),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const finalizeTransfer = useCallback((transferId: string) => {
    const result = transferService.finalize(state, transferId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      transfers: s.transfers.filter((t) => t.id !== transferId),
      transferHistory: [result.historyItem, ...s.transferHistory],
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const registerShipment = useCallback((input: CreateShipmentInput) => {
    const result = importService.registerShipment(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      shipments: [...s.shipments, result.shipment],
      internationalInvoices: s.internationalInvoices.map((f) =>
        f.id === result.updatedInvoice.id ? result.updatedInvoice : f
      ),
    }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const advanceShipment = useCallback((shipmentId: string) => {
    const result = importService.advanceStatus(state, shipmentId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => {
      let consolidations = s.consolidations
      if (result.consolidation) consolidations = [...consolidations, result.consolidation]
      if (result.consolidationUpdate) {
        consolidations = consolidations.map((c) =>
          c.id === result.consolidationUpdate!.id ? result.consolidationUpdate! : c
        )
      }

      return {
        ...s,
        shipments: s.shipments.map((sh) =>
          sh.id === shipmentId ? { ...sh, ...result.updatedShipment, status: result.newStatus } : sh
        ),
        internationalInvoices: result.updatedInvoice
          ? s.internationalInvoices.map((f) =>
              f.id === result.updatedInvoice!.id ? result.updatedInvoice! : f
            )
          : s.internationalInvoices,
        consolidations,
        bookCosting: result.bookCosting
          ? [
              ...s.bookCosting.filter((b) => b.shipmentId !== shipmentId),
              ...result.bookCosting,
            ]
          : s.bookCosting,
        receptions: result.reception ? [...s.receptions, result.reception] : s.receptions,
        purchaseOrders: result.orderStatus
          ? s.purchaseOrders.map((o) =>
              o.id === result.reception?.orderId ? { ...o, status: result.orderStatus! } : o
            )
          : s.purchaseOrders,
      }
    })
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const updateShipment = useCallback((input: UpdateShipmentInput) => {
    const result = importService.updateShipment(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      shipments: s.shipments.map((sh) => (sh.id === input.shipmentId ? result.shipment : sh)),
      internationalInvoices: result.updatedInvoices ?? s.internationalInvoices,
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const updateInternationalInvoice = useCallback((input: UpdateInternationalInvoiceInput) => {
    const result = importService.updateInternationalInvoice(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      internationalInvoices: s.internationalInvoices.map((f) =>
        f.id === input.invoiceId ? result.invoice : f
      ),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const updateConsolidation = useCallback((input: UpdateConsolidationInput) => {
    const result = importService.updateConsolidation(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      consolidations: s.consolidations.map((c) =>
        c.id === input.consolidationId ? result.consolidation : c
      ),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteShipment = useCallback((shipmentId: string) => {
    const result = importService.deleteShipment(state, shipmentId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      shipments: s.shipments.filter((sh) => sh.id !== shipmentId),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteInternationalInvoice = useCallback((invoiceId: string) => {
    const result = importService.deleteInternationalInvoice(state, invoiceId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      internationalInvoices: s.internationalInvoices.filter((f) => f.id !== invoiceId),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteConsolidation = useCallback((consolidationId: string) => {
    const result = importService.deleteConsolidation(state, consolidationId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      consolidations: s.consolidations.filter((c) => c.id !== consolidationId),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const registerEvent = useCallback((input: CreateEventInput) => {
    const result = eventService.registerEvent(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({ ...s, events: [...s.events, result.event] }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true, eventId: result.event.id }
  }, [state])

  const updateEvent = useCallback((input: UpdateEventInput) => {
    const result = eventService.updateEvent(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      events: s.events.map((e) => (e.id === input.eventId ? result.event : e)),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const deleteEvent = useCallback((eventId: string) => {
    const result = eventService.deleteEvent(state, eventId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      events: s.events.filter((e) => e.id !== eventId),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state])

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      metrics,
      lowStockProducts,
      activities: state.activities,
      notifications: state.notifications,
      unreadNotifications,
      comprasReady,
      refreshCompras,
      createPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      approvePurchaseOrder,
      completeReception,
      updateReception,
      deleteReception,
      createProduct,
      updateProduct,
      deleteProduct,
      createAdjustment,
      createTransfer,
      approveTransfer,
      shipTransfer,
      receiveTransfer,
      finalizeTransfer,
      registerShipment,
      advanceShipment,
      updateShipment,
      updateInternationalInvoice,
      updateConsolidation,
      deleteShipment,
      deleteInternationalInvoice,
      deleteConsolidation,
      registerEvent,
      updateEvent,
      deleteEvent,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      state,
      metrics,
      lowStockProducts,
      unreadNotifications,
      comprasReady,
      refreshCompras,
      createPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      approvePurchaseOrder,
      completeReception,
      updateReception,
      deleteReception,
      createProduct,
      updateProduct,
      deleteProduct,
      createAdjustment,
      createTransfer,
      approveTransfer,
      shipTransfer,
      receiveTransfer,
      finalizeTransfer,
      registerShipment,
      advanceShipment,
      updateShipment,
      updateInternationalInvoice,
      updateConsolidation,
      deleteShipment,
      deleteInternationalInvoice,
      deleteConsolidation,
      registerEvent,
      updateEvent,
      deleteEvent,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  )

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>
}

export function useERP() {
  const ctx = useContext(ERPContext)
  if (!ctx) throw new Error('useERP debe usarse dentro de ERPProvider')
  return ctx
}
