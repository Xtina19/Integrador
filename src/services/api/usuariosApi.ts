import { isApiEnabled } from '@/config/api'

export const usuariosApi = {
  isEnabled: () => isApiEnabled('usuarios'),

  async listUsers() {
    throw new Error('API de usuarios no disponible. Use Mock Data.')
  },
}
