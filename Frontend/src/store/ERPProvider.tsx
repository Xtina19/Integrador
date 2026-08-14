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
import { importService, type CreateShipmentInput, type UpdateShipmentInput, type UpdateInternationalInvoiceInput, type UpdateConsolidationInput, computeBookCostingForShipment } from '@/services/importService'
import { importacionesApi } from '@/services/api/importacionesApi'
import { loadImportacionesFromApi } from '@/services/api/importacionesLoader'
import { isImportacionesSyncedToApi } from '@/modules/importaciones/services/importacionesDualMode'
import { eventService, type CreateEventInput, type UpdateEventInput } from '@/services/eventService'
import { dashboardService } from '@/services/dashboardService'
import { prependActivity, prependNotification } from '@/services/activityService'
import type { Activity, Notification, InternationalInvoice, FreightCostDocument } from '@/types/domain'
import { shouldUseLocalCompras } from '@/modules/compras/services/comprasDualMode'
import { costeoInventarioApi } from '@/services/api/costeoInventarioApi'
import { bookCostingRowKey, withBookCostingMargin } from '@/modules/importaciones/business-rules/bookCosting'
import { productosApi } from '@/services/api/productosApi'
import type { ProductoCosteoRef } from '@/services/importService'
import { conceptLabelToKey, emptyShipmentCosts } from '@/business-rules/shipmentCosts'
import { nextSequentialCode } from '@/utils/idGenerator'
import { storeFreightFile } from '@/modules/importaciones/lib/freightFileStore'
import {
  isFacturaAnulada,
  isFacturaPagada,
} from '@/modules/compras/services/comprasScriptdb'
import {
  buildRegistrarFacturaBody,
  registerLocalSupplierInvoice,
} from '@/modules/compras/services/facturaProveedorUi'
import {
  mergeSupplierInvoices,
  saveLocalSupplierInvoices,
} from '@/modules/compras/services/comprasLocalStore'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

interface ERPContextValue {
  state: ERPState
  metrics: ReturnType<typeof dashboardService.getMetrics>
  lowStockProducts: ReturnType<typeof dashboardService.getLowStockProducts>
  activities: Activity[]
  notifications: Notification[]
  unreadNotifications: number
  comprasReady: boolean
  importacionesReady: boolean
  refreshCompras: () => Promise<void>
  refreshImportaciones: () => Promise<void>
  registerSupplierInvoice: (input: {
    orderId: string
    ncf?: string
    fechaEmision: string
    fechaVencimiento?: string
    fechaRecepcionDocumento?: string
  }) => Promise<{ success: boolean; errors?: string[] }>
  anularSupplierInvoice: (invoiceId: string) => Promise<{ success: boolean; errors?: string[] }>
  registerSupplierInvoicePayment: (
    invoiceId: string,
    input: { total: number }
  ) => Promise<{ success: boolean; errors?: string[] }>

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

  registerShipment: (input: CreateShipmentInput) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] }
  registerFreightDocument: (input: {
    shipmentId: string
    documentId?: string
    numeroDocumento: string
    tipoDocumento: string
    concepto: string
    proveedorServicio: string
    fechaDocumento: string
    moneda: string
    monto: number
    nombreArchivo: string
    mimeType?: string
    archivo?: File
    observacion: string
  }) => Promise<{ success: boolean; errors?: string[] }>
  advanceShipment: (shipmentId: string) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] }
  updateShipment: (input: UpdateShipmentInput) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] }
  updateInternationalInvoice: (input: UpdateInternationalInvoiceInput) => { success: boolean; errors?: string[] }
  updateConsolidation: (input: UpdateConsolidationInput) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] }
  deleteShipment: (shipmentId: string) => Promise<{ success: boolean; errors?: string[] }> | { success: boolean; errors?: string[] }
  deleteInternationalInvoice: (invoiceId: string) => { success: boolean; errors?: string[] }
  deleteConsolidation: (consolidationId: string) => { success: boolean; errors?: string[] }
  applyImportCosting: (shipmentId: string) => Promise<{ success: boolean; errors?: string[] }>
  updateBookCostingMargin: (input: {
    shipmentId: string
    marginPercent: number
    rowKey?: string
    applyToAllPending?: boolean
  }) => void

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
  const [importacionesReady, setImportacionesReady] = useState(!importacionesApi.isEnabled())

  const refreshImportaciones = useCallback(async () => {
    if (!importacionesApi.isEnabled()) {
      setImportacionesReady(true)
      return
    }
    try {
      const loaded = await loadImportacionesFromApi()
      setState((s) => {
        const isSeedShipment = (sh: { id: string; dbId?: number }) =>
          !sh.dbId && /^EMB-2026-/.test(sh.id)
        const localShipments = s.shipments.filter((sh) => !sh.dbId && !isSeedShipment(sh))
        const isSeedInvoice = (f: { id: string; dbId?: number }) =>
          !f.dbId && /^FI-2026-/.test(f.id)
        const localInvoices = s.internationalInvoices.filter(
          (f) => !f.dbId && !f.pendingEmbarque && !isSeedInvoice(f),
        )
        const fromApi = loaded.shipments.length > 0 || loaded.internationalInvoices.length > 0

        let bookCosting = s.bookCosting
        const mergedShipments = fromApi ? [...loaded.shipments, ...localShipments] : s.shipments
        for (const sh of mergedShipments) {
          if (sh.status === 'costed' && !bookCosting.some((b) => b.shipmentId === sh.id)) {
            const entries = computeBookCostingForShipment(
              { ...s, shipments: mergedShipments },
              sh,
            )
            if (entries.length) {
              bookCosting = [...bookCosting.filter((b) => b.shipmentId !== sh.id), ...entries]
            }
          }
        }

        return {
          ...s,
          shipments: fromApi ? mergedShipments : s.shipments,
          internationalInvoices: fromApi
            ? [...loaded.internationalInvoices, ...localInvoices]
            : s.internationalInvoices,
          consolidations: loaded.consolidations.length ? loaded.consolidations : s.consolidations,
          bookCosting,
        }
      })
      setImportacionesReady(true)
    } catch (e) {
      console.error('[Importaciones] No se pudo hidratar desde API:', getFriendlyErrorMessage(e))
      setImportacionesReady(true)
    }
  }, [])

  const refreshCompras = useCallback(async () => {
    if (!comprasApi.isEnabled()) {
      setComprasReady(true)
      return
    }
    try {
      const loaded = await loadComprasFromApi()
      setState((s) => {
        const apiOrderIds = new Set(loaded.purchaseOrders.map((o) => o.id))
        const isSeedOrder = (o: { id: string; dbId?: number }) =>
          !o.dbId && /^(OC-INT-)?OC-2026-/.test(o.id)
        const localOrders = s.purchaseOrders.filter(
          (o) => !o.dbId && !apiOrderIds.has(o.id) && !isSeedOrder(o)
        )
        const apiReceptionIds = new Set(loaded.receptions.map((r) => r.id))
        const isSeedReception = (r: { id: string; dbId?: number }) =>
          !r.dbId && /^REC-2026-/.test(r.id)
        const localReceptions = s.receptions.filter(
          (r) => !r.dbId && !apiReceptionIds.has(r.id) && !isSeedReception(r)
        )
        const fromApi = loaded.purchaseOrders.length > 0

        return {
          ...s,
          purchaseOrders: fromApi
            ? [...loaded.purchaseOrders, ...localOrders]
            : s.purchaseOrders,
          receptions: loaded.receptions.length > 0
            ? [...loaded.receptions, ...localReceptions]
            : s.receptions,
          supplierInvoices: mergeSupplierInvoices(loaded.supplierInvoices, s.supplierInvoices),
        }
      })
      setComprasReady(true)
    } catch (e) {
      console.error('[Compras] No se pudo hidratar desde API:', getFriendlyErrorMessage(e))
      // Ante error de API, mantener semilla local (no vaciar pantallas).
      setComprasReady(true)
    }
  }, [])

  useEffect(() => {
    void refreshCompras()
  }, [refreshCompras])

  useEffect(() => {
    void refreshImportaciones()
  }, [refreshImportaciones])

  useEffect(() => {
    saveLocalSupplierInvoices(state.supplierInvoices)
  }, [state.supplierInvoices])

  const registerSupplierInvoice = useCallback(
    async (input: {
      orderId: string
      ncf?: string
      fechaEmision: string
      fechaVencimiento?: string
      fechaRecepcionDocumento?: string
    }) => {
      const order = state.purchaseOrders.find((o) => o.id === input.orderId)
      if (!order) return { success: false, errors: ['Orden de compra no encontrada.'] }

      if (shouldUseLocalCompras(order)) {
        try {
          const invoice = registerLocalSupplierInvoice(
            order,
            {
              ncf: input.ncf,
              fechaEmision: input.fechaEmision,
              fechaVencimiento: input.fechaVencimiento,
            },
            state.supplierInvoices
          )
          setState((s) => ({
            ...s,
            supplierInvoices: [...s.supplierInvoices, invoice],
          }))
          return { success: true }
        } catch (e) {
          return { success: false, errors: [getFriendlyErrorMessage(e)] }
        }
      }

      try {
        const orden = await comprasApi.getOrden(order.dbId!)
        const body = buildRegistrarFacturaBody(orden, input)
        const created = await comprasApi.registrarFactura(body)
        setState((s) => ({
          ...s,
          supplierInvoices: [
            ...s.supplierInvoices.filter((i) => i.orderId !== order.id),
            {
              id: created.codigo,
              dbId: created.id,
              supplier: order.supplier,
              orderId: order.id,
              date: String(created.fechaEmision).slice(0, 10),
              amount: Number(created.total),
              status: 'pending' as const,
              currency: order.currency,
              purchaseType: order.purchaseType,
              numeroFactura: created.numeroFactura,
              ncf: created.ncf ?? undefined,
              documentEstado: created.estado,
              estadoPago: created.estadoPago,
            } satisfies SupplierInvoice,
          ],
        }))
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    },
    [state]
  )

  const anularSupplierInvoice = useCallback(
    async (invoiceId: string) => {
      const inv = state.supplierInvoices.find((i) => i.id === invoiceId)
      if (!inv) return { success: false, errors: ['Factura no encontrada.'] }

      if (shouldUseLocalCompras(inv)) {
        setState((s) => ({
          ...s,
          supplierInvoices: s.supplierInvoices.map((i) =>
            i.id === invoiceId ? { ...i, documentEstado: 'Anulada', status: 'pending' as const } : i
          ),
        }))
        return { success: true }
      }

      try {
        await comprasApi.anularFactura(inv.dbId!)
        setState((s) => ({
          ...s,
          supplierInvoices: s.supplierInvoices.map((i) =>
            i.id === invoiceId ? { ...i, documentEstado: 'Anulada', status: 'pending' as const } : i
          ),
        }))
        await refreshCompras()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    },
    [state, refreshCompras]
  )

  const registerSupplierInvoicePayment = useCallback(
    async (invoiceId: string, input: { total: number }) => {
      const inv = state.supplierInvoices.find((i) => i.id === invoiceId)
      if (!inv) return { success: false, errors: ['Factura no encontrada.'] }
      if (isFacturaAnulada(inv)) {
        return { success: false, errors: ['La factura está anulada.'] }
      }
      if (isFacturaPagada(inv)) {
        return { success: false, errors: ['La factura ya está pagada.'] }
      }
      const total = Number(input.total)
      if (!total || total <= 0) {
        return { success: false, errors: ['Indique el monto total de la factura.'] }
      }

      if (shouldUseLocalCompras(inv)) {
        setState((s) => ({
          ...s,
          supplierInvoices: s.supplierInvoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  amount: total,
                  status: 'paid' as const,
                  documentEstado: 'Pagada',
                  estadoPago: 'Pagado',
                }
              : i
          ),
          internationalInvoices: s.internationalInvoices.map((f) =>
            f.orderId === inv.orderId || f.id === inv.id
              ? { ...f, amount: total, status: 'paid' as const }
              : f
          ),
        }))
        return { success: true }
      }

      try {
        await comprasApi.registrarPagoFactura(inv.dbId!, { total })
        setState((s) => ({
          ...s,
          supplierInvoices: s.supplierInvoices.map((i) =>
            i.id === invoiceId
              ? {
                  ...i,
                  amount: total,
                  status: 'paid' as const,
                  documentEstado: 'Pagada',
                  estadoPago: 'Pagado',
                }
              : i
          ),
          internationalInvoices: s.internationalInvoices.map((f) =>
            f.orderId === inv.orderId || f.id === inv.id
              ? { ...f, amount: total, status: 'paid' as const }
              : f
          ),
        }))
        await refreshCompras()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    },
    [state, refreshCompras]
  )

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
          costoUnitario: 0,
          descuento: 0,
          impuesto: 0,
        }
      })

      const monedas = await loadMonedas()
      const monedaId = monedaIdFromCode(input.currency, monedas)
      const tasaCambio = await resolveTasaCambio(input.currency, 'DOP')

      const created = await comprasApi.createOrden({
        proveedorId: Number(proveedor.id),
        proveedorNombre: input.supplier,
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
      if (shouldUseLocalCompras(existing)) {
        const result = purchaseService.updateOrder(state, input)
        if (!result.success) return { success: false, errors: result.errors }
        setState((s) => ({
          ...s,
          purchaseOrders: s.purchaseOrders.map((o) => (o.id === input.orderId ? result.order : o)),
        }))
        applySideEffects(setState, result.activity, null)
        return { success: true }
      }
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
          costoUnitario: 0,
          descuento: 0,
          impuesto: 0,
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
    const existing = state.purchaseOrders.find((o) => o.id === orderId)

    if (!comprasApi.isEnabled() || shouldUseLocalCompras(existing)) {
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
      if (!existing?.dbId) return { success: false, errors: ['Orden no sincronizada. Recargue e intente de nuevo.'] }
      await comprasApi.cancelarOrden(existing.dbId)
      await refreshCompras()
      return { success: true }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }
  }, [state, refreshCompras])

  const approvePurchaseOrder = useCallback(async (orderId: string) => {
    const existing = state.purchaseOrders.find((o) => o.id === orderId)

    if (!comprasApi.isEnabled() || shouldUseLocalCompras(existing)) {
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
        supplierInvoices:
          'supplierInvoice' in result && result.supplierInvoice
            ? [...s.supplierInvoices, result.supplierInvoice]
            : s.supplierInvoices,
        internationalInvoices:
          'internationalInvoice' in result && result.internationalInvoice
            ? [...s.internationalInvoices, result.internationalInvoice]
            : s.internationalInvoices,
      }))
      applySideEffects(setState, result.activity, result.notification)
      return { success: true }
    }

    try {
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
    const reception = state.receptions.find((r) => r.id === receptionId)

    if (!comprasApi.isEnabled() || shouldUseLocalCompras(reception)) {
      const isInternational = reception?.purchaseType === 'international'

      const result = isInternational
        ? importService.completeImportReception(state, receptionId, items ?? 0)
        : purchaseService.completeReception(state, receptionId, items ?? 0)
      if (!result.success) return { success: false, errors: result.errors }

      const invUpdate = inventoryService.applyReceptionToInventory(
        state,
        result.orderId,
        result.itemsReceived,
        isInternational ? reception?.shipmentId : undefined,
      )
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
      if (!reception?.dbId) return { success: false, errors: ['Recepción no sincronizada. Recargue e intente de nuevo.'] }
      await comprasApi.confirmarRecepcion(reception.dbId, { resultadoInspeccion: 'aceptada' })
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
    const existing = state.receptions.find((r) => r.id === receptionId)

    if (!comprasApi.isEnabled() || shouldUseLocalCompras(existing)) {
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

  const registerShipment = useCallback(async (input: CreateShipmentInput) => {
    if (importacionesApi.isEnabled()) {
      const invoice = state.internationalInvoices.find((f) => f.id === input.invoiceId)
      const ordenCompraId = input.ordenCompraId ?? invoice?.orderDbId
      if (!ordenCompraId) {
        return { success: false, errors: ['Seleccione una orden internacional aprobada.'] }
      }
      try {
        await importacionesApi.createEmbarque({
          ordenCompraId,
          type: input.type,
          origin: input.origin,
          destination: input.destination,
          departure: input.departure,
          arrival: input.arrival,
          boxes: input.boxes,
          notes: input.notes,
          moneda: invoice?.currency === 'DOP' ? 'DOP' : 'USD',
        })
        await refreshImportaciones()
        await refreshCompras()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    }

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
  }, [state, refreshImportaciones, refreshCompras])

  const registerFreightDocument = useCallback(
    async (input: {
      shipmentId: string
      documentId?: string
      numeroDocumento: string
      tipoDocumento: string
      concepto: string
      proveedorServicio: string
      fechaDocumento: string
      moneda: string
      monto: number
      nombreArchivo: string
      mimeType?: string
      contenidoArchivo?: string
      observacion: string
    }) => {
      const shipment = state.shipments.find((s) => s.id === input.shipmentId)
      if (!shipment) return { success: false, errors: ['Embarque no encontrado.'] }

      if (importacionesApi.isEnabled() && shipment.dbId) {
        try {
          const body = {
            numeroDocumento: input.numeroDocumento || undefined,
            tipoDocumento: input.tipoDocumento,
            concepto: input.concepto,
            proveedorServicio: input.proveedorServicio,
            fechaDocumento: input.fechaDocumento,
            moneda: input.moneda,
            monto: input.monto,
            nombreArchivo: input.nombreArchivo || undefined,
            mimeType: input.mimeType,
            archivo: input.archivo,
            contenidoArchivo: undefined,
            observacion: input.observacion || undefined,
          }
          if (input.documentId && shipment.freightDocuments?.some((d) => d.id === input.documentId)) {
            const doc = shipment.freightDocuments!.find((d) => d.id === input.documentId)!
            await importacionesApi.updateDocumentoFlete(doc.dbId!, body)
          } else {
            await importacionesApi.createDocumentoFlete(shipment.dbId, body)
          }
          await refreshImportaciones()
          return { success: true }
        } catch (e) {
          return { success: false, errors: [getFriendlyErrorMessage(e)] }
        }
      }

      const existingCodes = state.shipments.flatMap((s) => (s.freightDocuments ?? []).map((d) => d.code))
      const code = input.documentId
        ? shipment.freightDocuments?.find((d) => d.id === input.documentId)?.code ??
          nextSequentialCode('DCF', existingCodes)
        : nextSequentialCode('DCF', existingCodes)
      const docId = input.documentId ?? code
      const document: FreightCostDocument = {
        id: docId,
        code,
        shipmentId: shipment.id,
        shipmentCode: shipment.code,
        documentNumber: input.numeroDocumento || undefined,
        documentType: input.tipoDocumento,
        concept: input.concepto,
        serviceProvider: input.proveedorServicio,
        documentDate: input.fechaDocumento,
        currency: input.moneda,
        amount: input.monto,
        status: 'registered',
        fileName: input.nombreArchivo || undefined,
        hasFile: Boolean(input.archivo || input.nombreArchivo),
        mimeType: input.mimeType,
        notes: input.observacion || undefined,
      }

      if (input.archivo) {
        storeFreightFile(docId, input.archivo, input.nombreArchivo || 'documento-flete.pdf')
      }

      setState((s) => ({
        ...s,
        shipments: s.shipments.map((sh) => {
          if (sh.id !== shipment.id) return sh
          const docs = sh.freightDocuments ?? []
          const nextDocs = input.documentId
            ? docs.map((d) => (d.id === input.documentId ? document : d))
            : [...docs, document]
          const costs = { ...(sh.costs ?? emptyShipmentCosts()) }
          const key = conceptLabelToKey(input.concepto)
          if (!input.documentId) {
            costs[key] = (costs[key] || 0) + input.monto
          }
          return { ...sh, freightDocuments: nextDocs, costs }
        }),
      }))
      return { success: true }
    },
    [state, refreshImportaciones],
  )

  const advanceShipment = useCallback(async (shipmentId: string) => {
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (importacionesApi.isEnabled() && isImportacionesSyncedToApi(shipment)) {
      try {
        await importacionesApi.avanzarEmbarque(shipment!.dbId!)
        await refreshImportaciones()
        await refreshCompras()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    }

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
  }, [state, refreshImportaciones, refreshCompras])

  const applyImportCosting = useCallback(async (shipmentId: string) => {
    let productCatalog: ProductoCosteoRef[] = []
    try {
      const rows = await productosApi.list()
      productCatalog = rows.map((p) => ({
        id: String(p.id),
        isbn: p.isbn ?? '',
        title: p.title ?? '',
        cost: Number(p.cost ?? 0) || 0,
      }))
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }

    const result = importService.applyBookCostingToInventory(state, shipmentId, productCatalog)
    if (!result.success) return { success: false, errors: result.errors }

    try {
      for (const update of result.productUpdates) {
        await costeoInventarioApi.registrar({
          productoId: String(update.productoId),
          newCost: update.newCost,
          newPrice: update.newPrice,
          marginPercent: update.marginPercent,
          costType: update.costType,
          notes: update.notes,
          origen: 'importacion',
          documentoRef: update.documentoRef,
        })
      }
    } catch (e) {
      return { success: false, errors: [getFriendlyErrorMessage(e)] }
    }

    setState((s) => ({
      ...s,
      bookCosting: result.bookCosting,
      products: s.products.map((p) => {
        const upd = result.productUpdates.find(
          (u) =>
            (u.isbn && p.isbn === u.isbn) ||
            p.title.trim().toLowerCase() === u.title.trim().toLowerCase(),
        )
        return upd ? { ...p, cost: upd.newCost, price: upd.newPrice } : p
      }),
    }))
    applySideEffects(setState, result.activity, result.notification)
    return { success: true }
  }, [state])

  const updateBookCostingMargin = useCallback(
    (input: {
      shipmentId: string
      marginPercent: number
      rowKey?: string
      applyToAllPending?: boolean
    }) => {
      setState((s) => ({
        ...s,
        bookCosting: s.bookCosting.map((entry) => {
          if (entry.shipmentId !== input.shipmentId || entry.appliedToInventory) return entry
          if (input.applyToAllPending) return withBookCostingMargin(entry, input.marginPercent)
          if (input.rowKey && bookCostingRowKey(entry) === input.rowKey) {
            return withBookCostingMargin(entry, input.marginPercent)
          }
          return entry
        }),
      }))
    },
    [],
  )

  const updateShipment = useCallback(async (input: UpdateShipmentInput) => {
    const shipment = state.shipments.find((s) => s.id === input.shipmentId)
    if (importacionesApi.isEnabled() && isImportacionesSyncedToApi(shipment)) {
      try {
        await importacionesApi.updateEmbarque(shipment!.dbId!, {
          type: input.type,
          origin: input.origin,
          destination: input.destination,
          departure: input.departure,
          arrival: input.arrival,
          boxes: input.boxes,
          notes: input.notes,
        })
        await refreshImportaciones()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    }

    const result = importService.updateShipment(state, input)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      shipments: s.shipments.map((sh) => (sh.id === input.shipmentId ? result.shipment : sh)),
      internationalInvoices: result.updatedInvoices ?? s.internationalInvoices,
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state, refreshImportaciones])

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

  const updateConsolidation = useCallback(async (input: UpdateConsolidationInput) => {
    const consolidation = state.consolidations.find((c) => c.id === input.consolidationId)
    if (importacionesApi.isEnabled() && isImportacionesSyncedToApi(consolidation)) {
      try {
        await importacionesApi.updateConsolidacion(consolidation!.dbId!, {
          status: input.status,
          notes: input.notes,
        })
        await refreshImportaciones()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    }

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
  }, [state, refreshImportaciones])

  const deleteShipment = useCallback(async (shipmentId: string) => {
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (importacionesApi.isEnabled() && isImportacionesSyncedToApi(shipment)) {
      try {
        await importacionesApi.deleteEmbarque(shipment!.dbId!)
        await refreshImportaciones()
        return { success: true }
      } catch (e) {
        return { success: false, errors: [getFriendlyErrorMessage(e)] }
      }
    }

    const result = importService.deleteShipment(state, shipmentId)
    if (!result.success) return { success: false, errors: result.errors }
    setState((s) => ({
      ...s,
      shipments: s.shipments.filter((sh) => sh.id !== shipmentId),
    }))
    applySideEffects(setState, result.activity, null)
    return { success: true }
  }, [state, refreshImportaciones])

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
      shipments: result.shipmentId
        ? s.shipments.map((sh) =>
            sh.id === result.shipmentId ? { ...sh, consolidationId: undefined } : sh,
          )
        : s.shipments,
      internationalInvoices: s.internationalInvoices.map((f) =>
        f.consolidationId === consolidationId ? { ...f, consolidationId: undefined } : f,
      ),
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
      importacionesReady,
      refreshCompras,
      refreshImportaciones,
      registerSupplierInvoice,
      anularSupplierInvoice,
      registerSupplierInvoicePayment,
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
      registerFreightDocument,
      advanceShipment,
      applyImportCosting,
      updateBookCostingMargin,
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
      importacionesReady,
      refreshCompras,
      refreshImportaciones,
      registerSupplierInvoice,
      anularSupplierInvoice,
      registerSupplierInvoicePayment,
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
      registerFreightDocument,
      advanceShipment,
      applyImportCosting,
      updateBookCostingMargin,
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
