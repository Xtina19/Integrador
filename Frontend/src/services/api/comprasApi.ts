import { isApiEnabled } from '@/config/api'

export const comprasApi = {
  isEnabled: () => isApiEnabled('compras'),

  async listPurchaseOrders() {
    throw new Error('API de compras no disponible. Use Mock Data.')
  },
}
