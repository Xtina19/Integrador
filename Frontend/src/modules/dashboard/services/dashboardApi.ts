import { http } from '@/services/http'
import type {
  Activity,
  DashboardMetrics,
  InventoryChartPoint,
  StockCategory,
} from '@/types/domain'

export interface DashboardLowStockProduct {
  id: string
  title: string
  isbn: string
  stock: number
  minStock: number
  branch: string
}

export interface DashboardPayload {
  metrics: DashboardMetrics
  nextEventName: string | null
  inventoryChartData: InventoryChartPoint[]
  stockByCategory: StockCategory[]
  lowStockProducts: DashboardLowStockProduct[]
  activities: Activity[]
}

export const dashboardApi = {
  async getOverview(): Promise<DashboardPayload> {
    const { data } = await http.get<DashboardPayload>('/api/dashboard')
    return data
  },
}
