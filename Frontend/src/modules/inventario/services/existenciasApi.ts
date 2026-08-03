import { httpPost } from '@/services/http'
import { apiConfig } from '@/config/api'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

const AUTH_HEADERS = {
  'x-user-id': 'inventario',
  'x-user-roles': 'admin',
}

function withAuth() {
  return { headers: { ...apiConfig.headers, ...AUTH_HEADERS } }
}

export interface RegistrarExistenciaRequest {
  productoId: string
  almacenId: string
  stockInicial: number
  stockMinimo: number
  ubicacion: string
}

export interface ExistenciaRegistradaDto {
  id: string
  productoId: string
  almacenId: string
  saldo: number
  stockMinimo: number
  ubicacion?: string
  version: number
}

export const existenciasApi = {
  async registrar(
    body: RegistrarExistenciaRequest,
  ): Promise<ExistenciaRegistradaDto> {
    const res = await httpPost<
      ApiEnvelope<ExistenciaRegistradaDto>
    >(
      '/api/inventario/existencias',
      body,
      withAuth(),
    )

    if (!res.success || !res.data) {
      throw new Error(
        res.error?.message ??
        'No se pudo registrar la existencia.',
      )
    }

    return res.data
  },
}
