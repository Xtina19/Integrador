import { isApiEnabled } from '@/config/api'

export const eventosApi = {
  isEnabled: () => isApiEnabled('eventos'),

  async listEvents() {
    throw new Error('API de eventos no disponible. Use Mock Data.')
  },
}
