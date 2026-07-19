import { httpGet, httpPost, httpPut, httpDelete, httpPatch } from '@/services/http'

export type MonedaStatus = 'active' | 'inactive'

export interface MonedaDto {
  id: string
  code: string
  name: string
  symbol: string
  isDefault: boolean
  status: MonedaStatus
}

export interface MonedaInput {
  code: string
  name: string
  symbol: string
  status?: MonedaStatus
  isDefault?: boolean
}

export const monedasApi = {
  list(): Promise<MonedaDto[]> {
    return httpGet<MonedaDto[]>('/api/monedas')
  },

  getById(id: string): Promise<MonedaDto> {
    return httpGet<MonedaDto>(`/api/monedas/${id}`)
  },

  create(body: MonedaInput): Promise<MonedaDto> {
    return httpPost<MonedaDto>('/api/monedas', body)
  },

  update(id: string, body: MonedaInput): Promise<MonedaDto> {
    return httpPut<MonedaDto>(`/api/monedas/${id}`, body)
  },

  setEstado(id: string, status: MonedaStatus): Promise<MonedaDto> {
    return httpPatch<MonedaDto>(`/api/monedas/${id}/estado`, { status })
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return httpDelete<{ ok: boolean }>(`/api/monedas/${id}`)
  },
}
