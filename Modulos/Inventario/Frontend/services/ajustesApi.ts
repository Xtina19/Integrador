import { httpGet, httpPost } from '@/services/http'
import { apiConfig } from '@/config/api'

export type AjusteEstadoDto =
  | 'borrador'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'
  | 'aplicado'
  | 'cancelado'
  | 'revertido'

export type TipoAjusteDto = 'positivo' | 'negativo' | 'digitacion' | 'conteo' | 'error_documental'

export interface CrearAjusteLineaDto {
  productoId: string
  isbn?: string
  titulo?: string
  cantidadObjetivo: number
  diferencia: number
  motivoCodigo?: string
  lineaConteoId?: string
  observacion?: string
}

export interface CrearAjusteRequest {
  codigo?: string
  almacenId: string
  tipoAjuste: TipoAjusteDto
  lineas: CrearAjusteLineaDto[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
}

export interface AjusteLineaDto {
  id: string
  productoId: string
  isbn?: string
  titulo?: string
  cantidadObjetivo: number
  diferencia: number
  motivoCodigo?: string
  lineaConteoId?: string
  observacion?: string
}

export interface AjusteListItemDto {
  id: string
  codigo: string
  almacenId: string
  tipoAjuste: TipoAjusteDto
  estado: AjusteEstadoDto
  solicitanteId: string
  aprobadorId?: string
  version: number
  /** El backend (lectura sobre el agregado) no registra fecha de creación; queda vacío. */
  fecha: string
  productoResumen: string
  diferenciaTotal: number
}

export interface AjusteDetalleDto extends AjusteListItemDto {
  lineas: AjusteLineaDto[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
  historial?: string[]
}

/** Forma real devuelta por el backend: el agregado de dominio, sin campos denormalizados. */
interface AjusteBackendDto {
  id: string
  codigo: string
  almacenId: string
  tipoAjuste: TipoAjusteDto
  estado: AjusteEstadoDto
  solicitanteId: string
  aprobadorId?: string
  version: number
  lineas: AjusteLineaDto[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
}

function toDetalle(a: AjusteBackendDto): AjusteDetalleDto {
  const diferenciaTotal = a.lineas.reduce((sum, l) => sum + l.diferencia, 0)
  return {
    id: a.id,
    codigo: a.codigo,
    almacenId: a.almacenId,
    tipoAjuste: a.tipoAjuste,
    estado: a.estado,
    solicitanteId: a.solicitanteId,
    aprobadorId: a.aprobadorId,
    version: a.version,
    fecha: '',
    productoResumen: `${a.lineas.length} línea(s)`,
    diferenciaTotal,
    lineas: a.lineas,
    observacion: a.observacion,
    documentoOrigenTipo: a.documentoOrigenTipo,
    documentoOrigenId: a.documentoOrigenId,
    historial: [],
  }
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

export const ajustesApi = {
  async crear(payload: CrearAjusteRequest) {
    return httpPost<ApiEnvelope<{ id: string; codigo: string; estado: string; version: number }>>(
      '/api/inventario/ajustes',
      payload,
      withAuth(),
    )
  },

  async listar(): Promise<AjusteListItemDto[]> {
    const res = await httpGet<ApiEnvelope<AjusteBackendDto[]>>('/api/inventario/ajustes', withAuth())
    return (res.data ?? []).map((a) => toDetalle({ ...a, lineas: a.lineas ?? [] }))
  },

  async get(id: string): Promise<AjusteDetalleDto | null> {
    const res = await httpGet<ApiEnvelope<AjusteBackendDto>>(`/api/inventario/ajustes/${id}`, withAuth())
    if (!res.data) return null
    return toDetalle({ ...res.data, lineas: res.data.lineas ?? [] })
  },

  async solicitar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/solicitar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async aprobar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/aprobar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async aplicar(id: string, expectedVersion: number, idempotencyKey: string) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/aplicar`,
      { expectedVersion, idempotencyKey },
      withAuth(),
    )
  },

  async rechazar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/rechazar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async cancelar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/cancelar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async revertir(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/ajustes/${id}/revertir`,
      { expectedVersion },
      withAuth(),
    )
  },
}
