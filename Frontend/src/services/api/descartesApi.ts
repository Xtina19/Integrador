import { httpGet, httpPost } from '@/services/http'
import { apiConfig } from '@/config/api'

export type MotivoDescarteCodigo =
  | 'DANO_FISICO'
  | 'DONACION'
  | 'PERDIDA'
  | 'ROBO'
  | 'ERROR_RECEPCION'
  | 'PRODUCTO_DEFECTUOSO'
  | 'CADUCIDAD'
  | 'OTRO'

export interface CrearDescarteLineaDto {
  productoId: string
  isbn?: string
  titulo?: string
  existenciaActual: number
  cantidad: number
  costo: number
  motivoEspecifico?: string
  observacion?: string
}

export interface CrearDescarteEvidenciaDto {
  tipo: 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'
  nombreArchivo?: string
  urlReferencia?: string
  comentario?: string
}

export interface CrearDescarteRequest {
  codigo?: string
  fecha: string
  sucursalId: string
  almacenId: string
  responsableId?: string
  responsableNombre?: string
  observaciones?: string
  motivoCodigo: MotivoDescarteCodigo
  motivoDescripcion?: string
  lineas: CrearDescarteLineaDto[]
  evidencias: CrearDescarteEvidenciaDto[]
  requiereAprobacion: boolean
  supervisorId?: string
  supervisorNombre?: string
}

export interface DescarteListItemDto {
  id: string
  codigo: string
  /** El backend (lectura sobre el agregado) no registra fecha de creación; queda vacío. */
  fecha: string
  almacenId: string
  sucursalId: string
  estado: string
  motivoCodigo: string
  motivoDescripcion?: string
  responsableNombre?: string
  cantidadTotal: number
  productosResumen: string
  evidenciaCount: number
  requiereAprobacion: boolean
  version: number
}

export interface DescarteLineaDto {
  id: string
  productoId: string
  isbn?: string
  titulo?: string
  cantidad: number
  costo?: number
  motivoEspecifico?: string
  observacion?: string
}

export interface DescarteEvidenciaDto {
  id: string
  tipo: 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'
  nombreArchivo?: string
  urlReferencia?: string
  comentario?: string
}

export interface DescarteDetalleDto extends DescarteListItemDto {
  lineas: DescarteLineaDto[]
  evidencias: DescarteEvidenciaDto[]
  observaciones?: string
  aprobadorNombre?: string
  supervisorNombre?: string
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

/** GET /descartes/:id devuelve el agregado de dominio (raw) + `meta` con los datos ricos del caso "Crear Descarte". */
interface DescarteAggregateBackendDto {
  id: string
  codigo: string
  almacenId: string
  estado: string
  solicitanteId: string
  aprobadorId?: string
  version: number
  lineas: { id: string; productoId: string; cantidad: number; motivoCodigo: string; observacion?: string }[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
  meta: {
    fecha: string
    sucursalId: string
    almacenId: string
    responsableNombre?: string
    motivoCodigo: string
    motivoDescripcion?: string
    observaciones?: string
    lineas: {
      productoId: string
      isbn?: string
      titulo?: string
      existenciaActual: number
      cantidad: number
      costo: number
      motivoEspecifico?: string
      observacion?: string
    }[]
    evidencias: {
      id: string
      tipo: 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'
      nombreArchivo?: string
      urlReferencia?: string
      comentario?: string
    }[]
    requiereAprobacion: boolean
    aprobacion: { supervisorNombre?: string }
  } | null
}

function toDetalle(d: DescarteAggregateBackendDto): DescarteDetalleDto {
  const meta = d.meta
  const lineas: DescarteLineaDto[] = d.lineas.map((l, i) => {
    const metaLinea = meta?.lineas[i]
    return {
      id: l.id,
      productoId: l.productoId,
      isbn: metaLinea?.isbn,
      titulo: metaLinea?.titulo,
      cantidad: l.cantidad,
      costo: metaLinea?.costo,
      motivoEspecifico: metaLinea?.motivoEspecifico ?? l.motivoCodigo,
      observacion: l.observacion,
    }
  })
  const cantidadTotal = lineas.reduce((sum, l) => sum + l.cantidad, 0)
  return {
    id: d.id,
    codigo: d.codigo,
    fecha: meta?.fecha ?? '',
    almacenId: d.almacenId,
    sucursalId: meta?.sucursalId ?? d.almacenId,
    estado: d.estado,
    motivoCodigo: meta?.motivoCodigo ?? 'OTRO',
    motivoDescripcion: meta?.motivoDescripcion,
    responsableNombre: meta?.responsableNombre ?? d.solicitanteId,
    cantidadTotal,
    productosResumen: `${lineas.length} línea(s)`,
    evidenciaCount: meta?.evidencias.length ?? 0,
    requiereAprobacion: meta?.requiereAprobacion ?? true,
    version: d.version,
    lineas,
    evidencias: meta?.evidencias ?? [],
    observaciones: meta?.observaciones ?? d.observacion,
    aprobadorNombre: d.aprobadorId,
    supervisorNombre: meta?.aprobacion.supervisorNombre,
  }
}

export const descartesApi = {
  async crear(payload: CrearDescarteRequest) {
    return httpPost<
      ApiEnvelope<{
        id: string
        codigo: string
        estado: string
        version: number
        motivoCodigo: string
        lineas: number
      }>
    >('/api/inventario/descartes', payload, withAuth())
  },

  /** GET /descartes usa el store de metadatos del caso "Crear Descarte": ya devuelve el DTO plano. */
  async listar(): Promise<DescarteListItemDto[]> {
    const res = await httpGet<ApiEnvelope<DescarteListItemDto[]>>('/api/inventario/descartes', withAuth())
    return res.data ?? []
  },

  async get(id: string): Promise<DescarteDetalleDto | null> {
    const res = await httpGet<ApiEnvelope<DescarteAggregateBackendDto>>(
      `/api/inventario/descartes/${id}`,
      withAuth(),
    )
    if (!res.data) return null
    return toDetalle({ ...res.data, lineas: res.data.lineas ?? [] })
  },

  async solicitar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/solicitar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async aprobar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/aprobar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async rechazar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/rechazar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async aplicar(id: string, expectedVersion: number, idempotencyKey: string) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/aplicar`,
      { expectedVersion, idempotencyKey },
      withAuth(),
    )
  },

  async cancelar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/cancelar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async revertir(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/descartes/${id}/revertir`,
      { expectedVersion },
      withAuth(),
    )
  },

  /** POST si el backend expone el endpoint; en su defecto se persiste como nota local en el detalle. */
  async adjuntarEvidencia(id: string, evidencia: CrearDescarteEvidenciaDto) {
    return httpPost<ApiEnvelope<{ id: string; evidenciaCount: number }>>(
      `/api/inventario/descartes/${id}/evidencias`,
      evidencia,
      withAuth(),
    )
  },
}
