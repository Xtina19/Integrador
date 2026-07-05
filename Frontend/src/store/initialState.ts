import type {
  Product,
  PurchaseOrder,
  Reception,
  Transfer,
  Shipment,
  LibroSysEvent,
  KardexMovement,
  InventoryAdjustment,
  Notification,
  Activity,
  DashboardMetrics,
  StockCategory,
  InventoryChartPoint,
  InternationalInvoice,
  Consolidation,
  BookCostingEntry,
} from '@/types/domain'
import { products as seedProducts, events as seedEvents, stockByCategory, inventoryChartData, lowStockProducts } from '@/mocks/mockCore'
import { purchaseOrders as seedOrders, receptions as seedReceptions } from '@/mocks/mockCompras'
import {
  shipments as seedShipments,
  internationalInvoices as seedInvoices,
  consolidations as seedConsolidations,
  shipmentCostsByCode,
  bookCosting as seedBookCosting,
} from '@/mocks/mockImportaciones'
import { kardexMovements as seedKardex, inventoryAdjustments as seedAdjustments } from '@/mocks/mockInventario'
import { createNotification, createActivity } from '@/services/activityService'
import { salesStats } from '@/mocks/mockVentas'
import { transfers as seedTransfers, transferHistory as seedTransferHistory } from '@/mocks/mockCore'
import type { PurchaseStatus, TransferStatus, ImportStatus, EventStatus } from '@/types/domain'

export interface ERPState {
  products: Product[]
  purchaseOrders: PurchaseOrder[]
  receptions: Reception[]
  transfers: Transfer[]
  transferHistory: { id: string; origin: string; destination: string; product: string; qty: number; status: 'finalized'; date: string }[]
  shipments: Shipment[]
  internationalInvoices: InternationalInvoice[]
  consolidations: Consolidation[]
  bookCosting: BookCostingEntry[]
  events: LibroSysEvent[]
  kardexMovements: KardexMovement[]
  inventoryAdjustments: InventoryAdjustment[]
  notifications: Notification[]
  activities: Activity[]
  monthlyPurchasesExtra: number
  inventoryChartData: InventoryChartPoint[]
  stockByCategory: StockCategory[]
}

const seedInternationalOrders: PurchaseOrder[] = [
  {
    id: 'OC-INT-2026-091',
    supplier: 'Planeta Internacional',
    date: '2026-05-20',
    currency: 'EUR',
    items: 840,
    total: 45200,
    status: 'approved',
    purchaseType: 'international',
    internationalInvoiceId: 'FI-2026-045',
    lines: [
      { product: 'Cien años de soledad', qty: 200, unitCost: 8.5 },
      { product: 'La sombra del viento', qty: 300, unitCost: 6.8 },
      { product: '1984', qty: 340, unitCost: 4.5 },
    ],
  },
  {
    id: 'OC-INT-2026-090',
    supplier: 'Alfaguara Export',
    date: '2026-06-05',
    currency: 'EUR',
    items: 240,
    total: 12800,
    status: 'approved',
    purchaseType: 'international',
    internationalInvoiceId: 'FI-2026-044',
    lines: [{ product: 'Harry Potter y la piedra filosofal', qty: 240, unitCost: 53.33 }],
  },
  {
    id: 'OC-INT-2026-089',
    supplier: 'Penguin Random House',
    date: '2026-05-25',
    currency: 'USD',
    items: 1200,
    total: 68500,
    status: 'approved',
    purchaseType: 'international',
    internationalInvoiceId: 'FI-2026-043',
    lines: [{ product: 'Libros varios PRH', qty: 1200, unitCost: 57.08 }],
  },
]

function mapLegacyTransferStatus(s: string): TransferStatus {
  const map: Record<string, TransferStatus> = {
    pending: 'requested',
    approved: 'approved',
    in_transit: 'in_transit',
    pending_receipt: 'received',
    received: 'received',
    completed: 'finalized',
  }
  return map[s] ?? 'requested'
}

function mapLegacyImportStatus(s: string): ImportStatus {
  const map: Record<string, ImportStatus> = {
    in_transit: 'in_transit',
    received: 'received',
    customs: 'customs',
  }
  return map[s] ?? 'registered'
}

function mapLegacyEventStatus(s: string): EventStatus {
  const map: Record<string, EventStatus> = {
    planned: 'scheduled',
    upcoming: 'scheduled',
    active: 'in_progress',
  }
  return map[s] ?? 'scheduled'
}

function mapLegacyPurchaseStatus(s: string): PurchaseStatus {
  const map: Record<string, PurchaseStatus> = {
    draft: 'draft',
    sent: 'pending',
    approved: 'approved',
    received: 'received',
    cancelled: 'cancelled',
  }
  return map[s] ?? 'draft'
}

export function createInitialERPState(): ERPState {
  return {
    products: seedProducts.map((p) => {
      const low = lowStockProducts.find((l) => l.id === p.id)
      return {
        ...p,
        minStock: low?.minStock ?? 10,
        status: p.status as Product['status'],
      }
    }),
    purchaseOrders: [
      ...seedOrders.map((o) => ({
        ...o,
        status: mapLegacyPurchaseStatus(o.status),
        currency: 'DOP',
        purchaseType: 'national' as const,
      })),
      ...seedInternationalOrders,
    ],
    receptions: seedReceptions.map((r) => ({ ...r, purchaseType: 'national' as const })),
    transfers: seedTransfers.map((t) => ({
      id: t.id,
      origin: t.origin,
      destination: t.destination,
      product: t.product,
      qty: t.qty,
      status: mapLegacyTransferStatus(t.status),
      date: t.date,
      transport: t.transport,
    })),
    transferHistory: seedTransferHistory.map((t) => ({
      ...t,
      status: 'finalized' as const,
    })),
    shipments: seedShipments.map((s) => {
      const invoice = seedInvoices.find((f) => f.shipment === s.code)
      const consolidation = seedConsolidations.find((c) =>
        c.shipmentCodes?.includes(s.code)
      )
      return {
        ...s,
        status: mapLegacyImportStatus(s.status),
        orderId: invoice?.orderId,
        invoiceId: invoice?.id,
        consolidationId: consolidation?.id,
        costs: shipmentCostsByCode[s.code],
      }
    }),
    internationalInvoices: seedInvoices.map((f) => ({
      id: f.id,
      orderId: f.orderId,
      supplier: f.supplier,
      date: f.date,
      currency: f.currency,
      amount: f.amount,
      status: f.status,
      shipmentId: seedShipments.find((s) => s.code === f.shipment)?.id,
      shipmentCode: f.shipment,
      consolidationId: seedConsolidations.find((c) => c.invoiceIds?.includes(f.id))?.id,
      stage: f.stage,
    })),
    consolidations: seedConsolidations.map((c) => ({
      id: c.id,
      name: c.name,
      orderIds: c.orderIds ?? [],
      shipmentIds: c.shipmentIds ?? [],
      invoiceIds: c.invoiceIds ?? [],
      totalBoxes: c.totalBoxes,
      status: c.status,
      notes: c.notes,
    })),
    bookCosting: seedBookCosting.map((b) => ({
      ...b,
      orderId: 'OC-INT-2026-091',
      shipmentId: seedShipments.find((s) => s.code === 'EMB-012')?.id,
    })),
    events: seedEvents.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      publisher: 'publisher' in e ? (e as { publisher?: string }).publisher : undefined,
      budget: 'budget' in e ? (e as { budget?: number }).budget : undefined,
      responsible: 'responsible' in e ? (e as { responsible?: string }).responsible : undefined,
      status: mapLegacyEventStatus(e.status),
      participants: e.participants,
      reservations: e.reservations,
    })),
    kardexMovements: [...seedKardex],
    inventoryAdjustments: [...seedAdjustments],
    notifications: [
      createNotification('danger', 'Stock crítico', '5 productos bajo mínimo en inventario', 'Inventario'),
      createNotification('warning', 'Contrato por vencer', 'Editorial Planeta vence en 15 días', 'Editoriales'),
    ],
    activities: [
      createActivity('Transferencia TR-089 pendiente de recepción.', 'Transferencias'),
      createActivity('Recepción REC-2026-034 completada.', 'Compras'),
    ],
    monthlyPurchasesExtra: 0,
    inventoryChartData: [...inventoryChartData],
    stockByCategory: [...stockByCategory],
  }
}

export function computeDashboardMetrics(state: ERPState): DashboardMetrics {
  const monthlyPurchases =
    state.purchaseOrders
      .filter((o) => o.status !== 'cancelled' && o.date.startsWith('2026-06'))
      .reduce((s, o) => s + o.total, 0) + state.monthlyPurchasesExtra

  const criticalStock = state.products.filter(
    (p) => p.stock <= (p.minStock ?? 10) || p.status === 'low' || p.status === 'out'
  )

  const activeShipments = state.shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'customs' || s.status === 'registered'
  )

  const upcomingEvents = state.events.filter(
    (e) => e.status === 'scheduled' || e.status === 'staff_assigned' || e.status === 'in_progress'
  )

  return {
    monthlySales: salesStats.monthlySales,
    monthlyPurchases,
    avgTicket: salesStats.avgTicket,
    openOrders: state.purchaseOrders.filter((o) => o.status === 'pending' || o.status === 'approved').length,
    criticalStockCount: criticalStock.length,
    activeShipments: activeShipments.length,
    boxesInTransit: activeShipments.reduce((s, sh) => s + sh.boxes, 0),
    upcomingEvents: upcomingEvents.length,
  }
}

export function computeLowStockProducts(state: ERPState) {
  return state.products
    .filter((p) => p.stock <= (p.minStock ?? 10))
    .map((p) => ({
      id: p.id,
      title: p.title,
      isbn: p.isbn,
      stock: p.stock,
      minStock: p.minStock ?? 10,
      branch: p.location.split(' - ')[0] ?? p.location,
    }))
}
