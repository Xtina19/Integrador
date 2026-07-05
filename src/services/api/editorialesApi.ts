import { isApiEnabled } from '@/config/api'

export const editorialesApi = {
  isEnabled: () => isApiEnabled('editoriales'),

  async listPublishers() {
    throw new Error('API de editoriales no disponible. Use Mock Data.')
  },
}
