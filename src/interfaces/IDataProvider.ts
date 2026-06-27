import type {
  Product,
  PurchaseOrder,
  Reception,
  Transfer,
  TransferHistoryItem,
  Shipment,
  LibroSysEvent,
  KardexMovement,
  InventoryAdjustment,
  Notification,
  Activity,
  InternationalInvoice,
  Consolidation,
  BookCostingEntry,
} from '../types/domain'

/** Contrato para futura integración MySQL — hoy implementado en memoria */
export interface IDataProvider {
  getProducts(): Product[]
  saveProducts(products: Product[]): void

  getPurchaseOrders(): PurchaseOrder[]
  savePurchaseOrders(orders: PurchaseOrder[]): void

  getReceptions(): Reception[]
  saveReceptions(receptions: Reception[]): void

  getTransfers(): Transfer[]
  saveTransfers(transfers: Transfer[]): void

  getTransferHistory(): TransferHistoryItem[]
  saveTransferHistory(history: TransferHistoryItem[]): void

  getShipments(): Shipment[]
  saveShipments(shipments: Shipment[]): void

  getInternationalInvoices(): InternationalInvoice[]
  saveInternationalInvoices(invoices: InternationalInvoice[]): void

  getConsolidations(): Consolidation[]
  saveConsolidations(consolidations: Consolidation[]): void

  getBookCosting(): BookCostingEntry[]
  saveBookCosting(entries: BookCostingEntry[]): void

  getEvents(): LibroSysEvent[]
  saveEvents(events: LibroSysEvent[]): void

  getKardexMovements(): KardexMovement[]
  saveKardexMovements(movements: KardexMovement[]): void

  getInventoryAdjustments(): InventoryAdjustment[]
  saveInventoryAdjustments(adjustments: InventoryAdjustment[]): void

  getNotifications(): Notification[]
  saveNotifications(notifications: Notification[]): void

  getActivities(): Activity[]
  saveActivities(activities: Activity[]): void
}
