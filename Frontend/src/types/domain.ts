export type PurchaseStatus = 'draft' | 'pending' | 'approved' | 'received' | 'finalized' | 'cancelled'
export type PurchaseType = 'national' | 'international'
export type TransferStatus = 'requested' | 'approved' | 'in_transit' | 'received' | 'finalized'
export type ImportStatus = 'registered' | 'in_transit' | 'customs' | 'received' | 'costed' | 'finalized'
export type EventStatus = 'scheduled' | 'staff_assigned' | 'in_progress' | 'finalized'
export type InternationalInvoiceStatus = 'pending' | 'paid'
export type ImportPipelineStage =
  | 'invoice'
  | 'shipment'
  | 'consolidation'
  | 'freight'
  | 'costing'
  | 'reception'
  | 'completed'

export interface Product {
  id: string
  isbn: string
  title: string
  author: string
  category: string
  publisher: string
  stock: number
  minStock?: number
  location: string
  status: 'normal' | 'low' | 'out'
  cost?: number
  price?: number
}

export interface PurchaseOrderLine {
  product: string
  qty: number
  unitCost: number
}

export interface PurchaseOrder {
  id: string
  supplier: string
  date: string
  currency: string
  items: number
  total: number
  status: PurchaseStatus
  purchaseType: PurchaseType
  lines?: PurchaseOrderLine[]
  internationalInvoiceId?: string
}

export interface InternationalInvoice {
  id: string
  orderId: string
  supplier: string
  date: string
  currency: string
  amount: number
  status: InternationalInvoiceStatus
  shipmentId?: string
  shipmentCode?: string
  consolidationId?: string
  stage: ImportPipelineStage
}

export interface Consolidation {
  id: string
  name: string
  orderIds: string[]
  shipmentIds: string[]
  invoiceIds: string[]
  totalBoxes: number
  status: 'active' | 'closed'
  notes?: string
}

export interface ShipmentCosts {
  internationalFreight: number
  insurance: number
  customs: number
  localTransport: number
  portFees: number
  handling: number
  other: number
}

/** @deprecated Usar ShipmentCosts embebido en Shipment */
export interface FreightCost {
  id: string
  shipmentId: string
  shipmentCode: string
  orderId?: string
  invoiceId?: string
  freight: number
  insurance: number
  customs: number
  other: number
  total: number
}

export interface BookCostingEntry {
  isbn: string
  title: string
  orderId?: string
  shipmentId?: string
  productCost: number
  freightAlloc: number
  finalCost: number
}

export interface Reception {
  id: string
  orderId: string
  supplier: string
  date: string
  items: number
  status: 'pending' | 'complete'
  purchaseType?: PurchaseType
  shipmentId?: string
  invoiceId?: string
}

export interface Transfer {
  id: string
  origin: string
  destination: string
  product: string
  qty: number
  status: TransferStatus
  date: string
  transport: string
}

export interface TransferHistoryItem {
  id: string
  origin: string
  destination: string
  product: string
  qty: number
  status: 'finalized'
  date: string
}

export interface Shipment {
  id: string
  code: string
  type: 'Marítimo' | 'Aéreo' | 'Courier'
  departure: string
  arrival: string
  status: ImportStatus
  boxes: number
  origin: string
  destination: string
  supplier?: string
  orderId?: string
  invoiceId?: string
  consolidationId?: string
  costs?: ShipmentCosts
  notes?: string
}

export interface LibroSysEvent {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  location: string
  publisher?: string
  budget?: number
  responsible?: string
  status: EventStatus
  participants: number
  reservations: number
}

export interface KardexMovement {
  id: string
  date: string
  product: string
  isbn: string
  type: string
  qty: number
  balance: number
  reference: string
  user: string
}

export interface InventoryAdjustment {
  id: string
  date: string
  product: string
  type: string
  qty: number
  reason: string
  user: string
  status: 'pending' | 'approved'
  notes?: string
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  createdAt: string
  read: boolean
  module: string
}

export interface Activity {
  id: string
  message: string
  module: string
  createdAt: string
  relativeTime: string
}

export interface DashboardMetrics {
  monthlySales: number
  monthlyPurchases: number
  avgTicket: number
  openOrders: number
  criticalStockCount: number
  activeShipments: number
  boxesInTransit: number
  upcomingEvents: number
}

export interface StockCategory {
  name: string
  value: number
  color: string
}

export interface InventoryChartPoint {
  month: string
  central: number
  sucursales: number
}
