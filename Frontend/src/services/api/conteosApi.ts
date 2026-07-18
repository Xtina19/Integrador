import { httpGet, httpPost } from '@/services/http'
import { apiConfig } from '@/config/api'

export interface CrearConteoProductoDto {
  productoId: string
  isbn?: string
  titulo?: string
  categoria?: string
  editorial?: string
  ubicacion?: string
  existenciaActual: number
  stockMinimo: number
}

export interface CrearConteoRequest {
  codigo?: string
  nombre: string
  tipoConteo: 'general' | 'parcial' | 'ciclico' | 'extraordinario'
  sucursalId: string
  almacenId: string
  alcanceTipo: 'todo_almacen' | 'categoria' | 'editorial' | 'ubicacion' | 'productos'
  alcanceValor?: string
  fechaProgramada?: string
  horaProgramada?: string
  responsableId?: string
  responsableNombre?: string
  observaciones?: string
  bloquearAlmacenAlAbrir: boolean
  permitirReconteo: boolean
  diferenciaMinimaReconteo: number
  productos: CrearConteoProductoDto[]
}

export interface CrearConteoResponse {
  success: boolean
  data?: {
    id: string
    codigo: string
    estado: string
    version: number
    nombre: string
    fase: string
    productosAlcance: number
  }
  error?: { code: string; message: string }
}

export interface ConteoListItemDto {
  id: string
  codigo: string
  nombre: string
  almacenId: string
  sucursalId: string
  tipoConteo: string
  estado: string
  fase: string
  responsableId: string
  responsableNombre?: string
  productosAlcance: number
  diferencias: number
  bloqueoActivo: boolean
  fecha: string
  version: number
}

export type EstadoLineaConteoDto =
  | 'pendiente'
  | 'contada'
  | 'en_reconteo'
  | 'revisada'
  | 'regularizada'

export type ClasificacionDiferenciaDto = 'cuadra' | 'sobrante' | 'faltante' | 'dano' | 'investigacion'

export interface LineaConteoDto {
  id: string
  productoId: string
  isbn?: string
  titulo?: string
  snapshotId: string
  cantidadTeorica: number
  cantidadContada?: number
  cantidadReconteo?: number
  cantidadAceptada?: number
  diferencia?: number
  clasificacion?: ClasificacionDiferenciaDto
  estadoLinea: EstadoLineaConteoDto
  regularizacionTipo?: 'ajuste' | 'descarte'
  regularizacionId?: string
  observacion?: string
}

export interface ConteoDetalleDto extends ConteoListItemDto {
  lineas: LineaConteoDto[]
  observaciones?: string
}

/** GET /conteos/:id devuelve el agregado de dominio (raw, con snapshots) + `meta` del caso "Crear Conteo". */
interface ConteoAggregateBackendDto {
  id: string
  codigo: string
  almacenId: string
  tipoConteo: string
  descripcionAlcance: string
  estado: string
  responsableId: string
  bloqueoActivo: boolean
  version: number
  snapshots: { id: string; productoId: string; cantidadTeorica: number; costoReferencia?: number }[]
  lineas: {
    id: string
    productoId: string
    snapshotId: string
    cantidadContada?: number
    cantidadReconteo?: number
    cantidadAceptada?: number
    diferencia?: number
    clasificacion?: ClasificacionDiferenciaDto
    estadoLinea: EstadoLineaConteoDto
    regularizacionTipo?: 'ajuste' | 'descarte'
    regularizacionId?: string
    observacion?: string
  }[]
  meta: {
    nombre: string
    sucursalId: string
    responsableNombre?: string
    observaciones?: string
    fase: string
    productos: { productoId: string; isbn?: string; titulo?: string }[]
    createdAt: string
  } | null
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

function toConteoDetalle(c: ConteoAggregateBackendDto): ConteoDetalleDto {
  const meta = c.meta
  const productoInfo = new Map(meta?.productos.map((p) => [p.productoId, p]) ?? [])
  const snapshotById = new Map(c.snapshots.map((s) => [s.id, s]))
  const lineas: LineaConteoDto[] = c.lineas.map((l) => {
    const snapshot = snapshotById.get(l.snapshotId)
    const info = productoInfo.get(l.productoId)
    return {
      id: l.id,
      productoId: l.productoId,
      isbn: info?.isbn,
      titulo: info?.titulo,
      snapshotId: l.snapshotId,
      cantidadTeorica: snapshot?.cantidadTeorica ?? 0,
      cantidadContada: l.cantidadContada,
      cantidadReconteo: l.cantidadReconteo,
      cantidadAceptada: l.cantidadAceptada,
      diferencia: l.diferencia,
      clasificacion: l.clasificacion,
      estadoLinea: l.estadoLinea,
      regularizacionTipo: l.regularizacionTipo,
      regularizacionId: l.regularizacionId,
      observacion: l.observacion,
    }
  })
  return {
    id: c.id,
    codigo: c.codigo,
    nombre: meta?.nombre ?? c.codigo,
    almacenId: c.almacenId,
    sucursalId: meta?.sucursalId ?? c.almacenId,
    tipoConteo: c.tipoConteo,
    estado: c.estado,
    fase: meta?.fase ?? c.estado,
    responsableId: c.responsableId,
    responsableNombre: meta?.responsableNombre,
    productosAlcance: meta?.productos.length ?? lineas.length,
    diferencias: lineas.filter((l) => (l.diferencia ?? 0) !== 0).length,
    bloqueoActivo: c.bloqueoActivo,
    fecha: meta?.createdAt ?? '',
    version: c.version,
    lineas,
    observaciones: meta?.observaciones,
  }
}

const AUTH_HEADERS = {
  'x-user-id': 'inventario',
  'x-user-roles': 'admin',
}

function withAuth() {
  return { headers: { ...apiConfig.headers, ...AUTH_HEADERS } }
}

export const conteosApi = {
  async crear(payload: CrearConteoRequest): Promise<CrearConteoResponse> {
    return httpPost<CrearConteoResponse>('/api/inventario/conteos', payload, withAuth())
  },

  async listar(): Promise<ConteoListItemDto[]> {
    const res = await httpGet<{ success: boolean; data: ConteoListItemDto[] }>(
      '/api/inventario/conteos',
      withAuth(),
    )
    return res.data ?? []
  },

  async get(id: string): Promise<ConteoDetalleDto | null> {
    const res = await httpGet<ApiEnvelope<ConteoAggregateBackendDto>>(
      `/api/inventario/conteos/${id}`,
      withAuth(),
    )
    if (!res.data) return null
    return toConteoDetalle({
      ...res.data,
      snapshots: res.data.snapshots ?? [],
      lineas: res.data.lineas ?? [],
    })
  },

  async abrir(id: string, expectedVersion: number, productoIds?: string[]) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number; lineas: number }>>(
      `/api/inventario/conteos/${id}/abrir`,
      { expectedVersion, productoIds },
      withAuth(),
    )
  },

  async registrarLinea(id: string, lineaId: string, cantidadContada: number, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/conteos/${id}/lineas/${lineaId}`,
      { cantidadContada, expectedVersion },
      withAuth(),
    )
  },

  async revision(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/conteos/${id}/revision`,
      { expectedVersion },
      withAuth(),
    )
  },

  async clasificar(
    id: string,
    lineaId: string,
    expectedVersion: number,
    clasificacion: ClasificacionDiferenciaDto,
    regularizacion?: { tipo: 'ajuste' | 'descarte'; id: string },
  ) {
    return httpPost<ApiEnvelope<{ id: string; version: number; lineaId: string }>>(
      `/api/inventario/conteos/${id}/lineas/${lineaId}/clasificar`,
      { expectedVersion, clasificacion, regularizacion },
      withAuth(),
    )
  },

  async cerrar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/conteos/${id}/cerrar`,
      { expectedVersion },
      withAuth(),
    )
  },

  async reconteo(id: string, expectedVersion: number, lineaIds?: string[]) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/conteos/${id}/reconteo`,
      { expectedVersion, lineaIds },
      withAuth(),
    )
  },

  async cancelar(id: string, expectedVersion: number) {
    return httpPost<ApiEnvelope<{ id: string; estado: string; version: number }>>(
      `/api/inventario/conteos/${id}/cancelar`,
      { expectedVersion },
      withAuth(),
    )
  },
}
