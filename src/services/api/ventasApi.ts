import { isApiEnabled } from '@/config/api'

/** Endpoints de ventas aún no disponibles en el backend. */
export const ventasApi = {
  isEnabled: () => isApiEnabled('ventas'),

  async listSales() {
    throw new Error('API de ventas no disponible. Use Mock Data (VITE_USE_API_VENTAS=false).')
  },

  async getSaleById(_id: string) {
    throw new Error('API de ventas no disponible.')
  },
}
