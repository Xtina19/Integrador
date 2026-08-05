import { httpGet, httpPost, httpPut, httpPatch } from '@/services/http'
import { listAll } from '@/services/api/httpList'

const base = '/api/almacenes'

export interface SucursalOptionDto {
  id: string
  idSucursal?: number
  nombre: string
  codigo: string
}

export interface AlmacenDto {
  id: string
  idAlmacen?: number
  sucursalId: string | null
  sucursalNombre?: string | null
  sucursalCodigo?: string | null
  nombre: string
  codigo: string
  direccion: string
  ciudad: string
  responsable: string
  telefono: string
  tipoAlmacen: string
  bloqueado: boolean
  motivoBloqueo?: string
  fechaBloqueo?: string | null
  estado: string
  fechaRegistro?: string
}

export interface GuardarAlmacenRequest {
  sucursalId: number | null
  codigo: string
  nombre: string
  tipoAlmacen: string
  direccion: string
  ciudad: string
  responsable: string
  telefono: string
}

type ApiEnvelope<T> = { success?: boolean; data?: T }

function unwrapData<T>(res: T | ApiEnvelope<T>): T {
  if (
    res &&
    typeof res === 'object' &&
    'data' in res &&
    (res as ApiEnvelope<T>).data !== undefined
  ) {
    return (res as ApiEnvelope<T>).data as T
  }
  return res as T
}

export const almacenesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    listAll<AlmacenDto>(base, params),

  listSucursales: async (): Promise<SucursalOptionDto[]> => {
    const res = await httpGet<ApiEnvelope<SucursalOptionDto[]> | SucursalOptionDto[]>(
      `${base}/opciones/sucursales`,
    )
    const data = unwrapData(res)
    return Array.isArray(data) ? data : []
  },

  getById: async (id: string): Promise<AlmacenDto> => {
    const res = await httpGet<ApiEnvelope<AlmacenDto> | AlmacenDto>(`${base}/${id}`)
    return unwrapData(res)
  },

  create: (body: Partial<GuardarAlmacenRequest>) =>
    httpPost<Record<string, unknown>>(base, body),

  update: (id: string, body: Partial<GuardarAlmacenRequest>) =>
    httpPut<Record<string, unknown>>(`${base}/${id}`, body),

  setEstado: (id: string, status: string) =>
    httpPatch<Record<string, unknown>>(`${base}/${id}/estado`, { status, estado: status }),
}
