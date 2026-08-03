import {
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
} from '@/services/http'
import { listAll } from '@/services/api/httpList'

const base = '/api/almacenes'

export type AlmacenEstado = 'Activo' | 'Inactivo'

export interface AlmacenDto {
  id: string
  idAlmacen: number
  sucursalId: string | null
  sucursalNombre: string | null
  sucursalCodigo: string | null
  nombre: string
  codigo: string
  direccion: string
  ciudad: string
  responsable: string
  telefono: string
  tipoAlmacen: string
  bloqueado: boolean
  motivoBloqueo: string
  fechaBloqueo: string | null
  estado: AlmacenEstado
  fechaRegistro: string
}

export interface GuardarAlmacenRequest {
  sucursalId: number | null
  nombre: string
  codigo: string
  direccion?: string
  ciudad?: string
  responsable?: string
  telefono?: string
  tipoAlmacen?: string
}

export interface SucursalOptionDto {
  id: string
  idSucursal: number
  nombre: string
  codigo: string
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  total?: number
  message?: string
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export const almacenesApi = {
  list: (
    params?: Record<string, string | number | undefined>,
  ) => listAll<AlmacenDto>(base, params),

  async listSucursales(): Promise<SucursalOptionDto[]> {
  const response = await httpGet<
    ApiEnvelope<SucursalOptionDto[]>
  >(`${base}/opciones/sucursales`)

  if (!response.success) {
    throw new Error(
      response.error?.message ??
        'No se pudieron cargar las sucursales.',
    )
  }

  return response.data ?? []
},

  async getById(id: string): Promise<AlmacenDto | null> {
    const response = await httpGet<ApiEnvelope<AlmacenDto>>(
      `${base}/${id}`,
    )

    return response.data ?? null
  },

  async create(
    body: GuardarAlmacenRequest,
  ): Promise<{ id: string; idAlmacen: number }> {
    const response = await httpPost<
      ApiEnvelope<{ id: string; idAlmacen: number }>
    >(base, body)

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message ??
          'No se pudo crear el almacén.',
      )
    }

    return response.data
  },

  async update(
    id: string,
    body: GuardarAlmacenRequest,
  ): Promise<{ id: string; idAlmacen: number }> {
    const response = await httpPut<
      ApiEnvelope<{ id: string; idAlmacen: number }>
    >(`${base}/${id}`, body)

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message ??
          'No se pudo actualizar el almacén.',
      )
    }

    return response.data
  },

  async setEstado(
    id: string,
    estado: AlmacenEstado,
  ): Promise<{ id: string; estado: AlmacenEstado }> {
    const response = await httpPatch<
      ApiEnvelope<{ id: string; estado: AlmacenEstado }>
    >(`${base}/${id}/estado`, {
      status: estado,
    })

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message ??
          'No se pudo cambiar el estado del almacén.',
      )
    }

    return response.data
  },
}