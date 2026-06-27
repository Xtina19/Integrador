import type { DashboardMetrics, InventoryChartPoint, Product, StockCategory } from '../types/domain'
import type { ERPState } from '../store/initialState'
import { computeDashboardMetrics, computeLowStockProducts } from '../store/initialState'

export const dashboardService = {
  getMetrics(state: ERPState): DashboardMetrics {
    return computeDashboardMetrics(state)
  },

  getLowStockProducts(state: ERPState) {
    return computeLowStockProducts(state)
  },

  getInventoryChart(state: ERPState): InventoryChartPoint[] {
    return state.inventoryChartData
  },

  getStockByCategory(state: ERPState): StockCategory[] {
    return state.stockByCategory
  },

  getNextEventName(state: ERPState): string | undefined {
    const upcoming = state.events
      .filter((e) => e.status === 'scheduled' || e.status === 'staff_assigned' || e.status === 'in_progress')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    return upcoming[0]?.name
  },

  recalcInventoryChart(products: Product[], current: InventoryChartPoint[]): InventoryChartPoint[] {
    if (!current.length) return current
    const totalStock = products.reduce((s, p) => s + p.stock, 0)
    const updated = [...current]
    const last = { ...updated[updated.length - 1] }
    last.central = Math.round(totalStock * 0.52)
    last.sucursales = Math.round(totalStock * 0.48)
    updated[updated.length - 1] = last
    return updated
  },

  recalcStockByCategory(products: Product[], current: StockCategory[]): StockCategory[] {
    const totals = new Map<string, number>()
    for (const p of products) {
      totals.set(p.category, (totals.get(p.category) ?? 0) + p.stock)
    }
    return current.map((cat) => ({
      ...cat,
      value: totals.get(cat.name) ?? cat.value,
    }))
  },
}
