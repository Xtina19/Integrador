import { isApiEnabled } from '@/config/api'

export const importacionesApi = {
  isEnabled: () => isApiEnabled('importaciones'),

  async listShipments() {
    throw new Error('API de importaciones no disponible. Use Mock Data.')
  },
}
