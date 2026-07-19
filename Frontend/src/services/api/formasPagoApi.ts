import { httpGet, httpPost, httpPut, httpPatch } from '@/services/http'
import { listAll } from './httpList'

const base = '/api/formas-pago'

export const formasPagoApi = {
  list: (params?: Record<string, string | number | undefined>) => listAll<Record<string, unknown>>(base, params),
  getById: (id: string) => httpGet<Record<string, unknown>>(`${base}/${id}`),
  create: (body: Partial<Record<string, unknown>>) => httpPost<Record<string, unknown>>(base, body),
  update: (id: string, body: Partial<Record<string, unknown>>) => httpPut<Record<string, unknown>>(`${base}/${id}`, body),
  setEstado: (id: string, status: string) => httpPatch<Record<string, unknown>>(`${base}/${id}/estado`, { status }),
}
