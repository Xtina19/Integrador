import { httpGet, httpPost } from '@/services/http'
import { apiConfig } from '@/config/api'

export type TransferenciaEstadoDto =
  | 'borrador'
  | 'solicitada'
  | 'en_transito'
  | 'recibida_parcial'
  | 'recibida'
  | 'cancelada'

export interface CrearTransferenciaLineaDto {
  productoId: string
  isbn?: string
  titulo?: string
  cantidadSolicitada: number
}

export interface CrearTransferenciaRequest {
  codigo?: string
  almacenOrigenId: string
  almacenDestinoId: string
  lineas: CrearTransferenciaLineaDto[]
  observacion?: string
}

export interface TransferenciaLineaDto {
  id: string
  productoId: string
  isbn?: string
  titulo?: string
  cantidadSolicitada: number
  cantidadDespachada: number
  cantidadRecibida: number
  cantidadFaltante: number
  cantidadDanada: number
}

export interface TransferenciaListItemDto {
  id: string
  codigo: string
  almacenOrigenId: string
  almacenDestinoId: string
  estado: TransferenciaEstadoDto
  solicitanteId: string
  version: number
  /** El backend (lectura sobre el agregado) no registra fecha de creación; queda vacío. */
  fecha: string
  cantidadTotal: number
  productoResumen: string
}

export interface TransferenciaDetalleDto extends TransferenciaListItemDto {
  lineas: TransferenciaLineaDto[]
  observacion?: string
}

/** Forma real devuelta por el backend: el agregado de dominio, sin campos denormalizados. */
interface TransferenciaBackendDto {
  id: string
  codigo: string
  almacenOrigenId: string
  almacenDestinoId: string
  estado: TransferenciaEstadoDto
  solicitanteId: string
  version: number
  lineas: TransferenciaLineaDto[]
  observacion?: string
}

function toListItem(t: TransferenciaBackendDto): TransferenciaDetalleDto {
  const cantidadTotal = t.lineas.reduce((sum, l) => sum + l.cantidadSolicitada, 0)
  return {
    id: t.id,
    codigo: t.codigo,
    almacenOrigenId: t.almacenOrigenId,
    almacenDestinoId: t.almacenDestinoId,
    estado: t.estado,
    solicitanteId: t.solicitanteId,
    version: t.version,
    fecha: '',
    cantidadTotal,
    productoResumen: `${t.lineas.length} línea(s)`,
    lineas: t.lineas,
    observacion: t.observacion,
  }
}

export interface RecepcionLineaDto {
  lineaId: string
  cantidadRecibida: number
  cantidadFaltante?: number
  cantidadDanada?: number
}

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

export const transferenciasApi = {
  async crear(payload: CrearTransferenciaRequest) {
    return httpPost<ApiEnvelope<{ id: string; codigo: string; estado: string; version: number }>>(
      '/api/inventario/transferencias',
      payload,
      withAuth(),
    )
  },

  async listar(): Promise<TransferenciaListItemDto[]> {
    const res = await httpGet<ApiEnvelope<TransferenciaBackendDto[]>>(
      '/api/inventario/transferencias',
      withAuth(),
    )
    return (res.data ?? []).map((t) => ({ ...t, lineas: t.lineas ?? [] })).map(toListItem)
  },

  async get(id: string): Promise<TransferenciaDetalleDto | null> {
    const res = await httpGet<ApiEnvelope<TransferenciaBackendDto>>(
      `/api/inventario/transferencias/${id}`,
      withAuth(),
    )
    if (!res.data) return null
    return toListItem({ ...res.data, lineas: res.data.lineas ?? [] })
  },

  async solicitar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/transferencias/${id}/solicitar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async cancelar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/transferencias/${id}/cancelar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async despachar(id: string, expectedVersion: number, idempotencyKey: string) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/transferencias/${id}/despachar`,
      { expectedVersion, idempotencyKey },
      withAuth(),
    )
  },

  async recibir(
    id: string,
    expectedVersion: number,
    idempotencyKey: string,
    recepciones: RecepcionLineaDto[],
  ) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/transferencias/${id}/recibir`,
      { expectedVersion, idempotencyKey, recepciones },
      withAuth(),
    )
  },
}
