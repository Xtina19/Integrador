import { http } from '@/services/http'

export interface TipoFacturaDto {
  id: string
  codigo: string
  nombre: string
  requiereEvento: boolean
  estado: string
}

export const tiposFacturaApi = {
  async list(): Promise<TipoFacturaDto[]> {
    const { data } = await http.get<TipoFacturaDto[]>('/api/tipos-factura')
    return Array.isArray(data) ? data : []
  },
}
