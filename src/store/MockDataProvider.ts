import type { ERPState } from '../store/initialState'
import type { IDataProvider } from '../interfaces/IDataProvider'
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

/** Implementación en memoria — sustituible por MySQL sin cambiar servicios */
export class MockDataProvider implements IDataProvider {
  constructor(private state: ERPState) {}

  private snapshot(): ERPState {
    return this.state
  }

  getProducts() {
    return this.snapshot().products
  }
  saveProducts(products: Product[]) {
    this.state = { ...this.state, products }
  }

  getPurchaseOrders() {
    return this.snapshot().purchaseOrders
  }
  savePurchaseOrders(purchaseOrders: PurchaseOrder[]) {
    this.state = { ...this.state, purchaseOrders }
  }

  getReceptions() {
    return this.snapshot().receptions
  }
  saveReceptions(receptions: Reception[]) {
    this.state = { ...this.state, receptions }
  }

  getTransfers() {
    return this.snapshot().transfers
  }
  saveTransfers(transfers: Transfer[]) {
    this.state = { ...this.state, transfers }
  }

  getTransferHistory() {
    return this.snapshot().transferHistory
  }
  saveTransferHistory(transferHistory: TransferHistoryItem[]) {
    this.state = { ...this.state, transferHistory }
  }

  getShipments() {
    return this.snapshot().shipments
  }
  saveShipments(shipments: Shipment[]) {
    this.state = { ...this.state, shipments }
  }

  getInternationalInvoices() {
    return this.snapshot().internationalInvoices
  }
  saveInternationalInvoices(internationalInvoices: InternationalInvoice[]) {
    this.state = { ...this.state, internationalInvoices }
  }

  getConsolidations() {
    return this.snapshot().consolidations
  }
  saveConsolidations(consolidations: Consolidation[]) {
    this.state = { ...this.state, consolidations }
  }

  getBookCosting() {
    return this.snapshot().bookCosting
  }
  saveBookCosting(bookCosting: BookCostingEntry[]) {
    this.state = { ...this.state, bookCosting }
  }

  getEvents() {
    return this.snapshot().events
  }
  saveEvents(events: LibroSysEvent[]) {
    this.state = { ...this.state, events }
  }

  getKardexMovements() {
    return this.snapshot().kardexMovements
  }
  saveKardexMovements(kardexMovements: KardexMovement[]) {
    this.state = { ...this.state, kardexMovements }
  }

  getInventoryAdjustments() {
    return this.snapshot().inventoryAdjustments
  }
  saveInventoryAdjustments(inventoryAdjustments: InventoryAdjustment[]) {
    this.state = { ...this.state, inventoryAdjustments }
  }

  getNotifications() {
    return this.snapshot().notifications
  }
  saveNotifications(notifications: Notification[]) {
    this.state = { ...this.state, notifications }
  }

  getActivities() {
    return this.snapshot().activities
  }
  saveActivities(activities: Activity[]) {
    this.state = { ...this.state, activities }
  }

  getState(): ERPState {
    return this.state
  }
}
