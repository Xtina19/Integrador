import { httpGet } from '@/services/http'
import { apiConfig } from '@/config/api'

export interface MovimientoDto {
  id: string
  fecha: string
  tipo: string
  productoId: string
  productoTitulo?: string
  isbn?: string
  almacenId: string
  almacenNombre?: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documentoTipo: string
  documentoId: string
  usuario: string
  sucursal?: string
  motivoCodigo?: string
  observacion?: string
}

export interface ListarMovimientosFiltros {
  productoId?: string
  almacenId?: string
  documentoTipo?: string
  documentoId?: string
  tipo?: string
  desde?: string
  hasta?: string
}

/** Forma real devuelta por GET /api/inventario/movimientos (backend read-model). */
interface MovimientoBackendDto {
  id: string
  tipoMovimiento: string
  productoId: string
  productoTitulo?: string
  isbn?: string
  almacenId: string
  almacenNombre: string
  sucursalNombre?: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documentoTipo: string
  documentoId: string
  usuarioId: string
  fechaMovimiento: string
  motivoCodigo?: string
  observacion?: string
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

function withAuth(params?: Record<string, string | undefined>) {
  return {
    headers: { ...apiConfig.headers, ...AUTH_HEADERS },
    params,
  }
}

function mapMovimiento(m: MovimientoBackendDto): MovimientoDto {
  return {
    id: m.id,
    isbn: m.isbn,
    fecha: m.fechaMovimiento,
    tipo: m.tipoMovimiento,
    productoId: m.productoId,
    productoTitulo: m.productoTitulo,
    almacenId: m.almacenId,
    almacenNombre: m.almacenNombre,
    cantidad: m.cantidad,
    saldoAnterior: m.saldoAnterior,
    saldoPosterior: m.saldoPosterior,
    documentoTipo: m.documentoTipo,
    documentoId: m.documentoId,
    usuario: m.usuarioId,
    sucursal: m.sucursalNombre ?? m.almacenNombre,
    motivoCodigo: m.motivoCodigo,
    observacion: m.observacion,
  }
}

function toQueryParams(
  filtros?: ListarMovimientosFiltros,
): Record<string, string | undefined> | undefined {
  if (!filtros) {
    return undefined
  }

  return {
    productoId: filtros.productoId,
    almacenId: filtros.almacenId,
    documentoTipo: filtros.documentoTipo,
    documentoId: filtros.documentoId,
    tipo: filtros.tipo,
    desde: filtros.desde,
    hasta: filtros.hasta,
  }
}

export const movimientosApi = {
  async listar(
    filtros?: ListarMovimientosFiltros,
  ): Promise<MovimientoDto[]> {
    const res = await httpGet<
      ApiEnvelope<MovimientoBackendDto[]>
    >(
      '/api/inventario/movimientos',
      withAuth(toQueryParams(filtros)),
    )

    return (res.data ?? []).map(
      mapMovimiento,
    )
  },

  async get(id: string): Promise<MovimientoDto | null> {
    const res = await httpGet<ApiEnvelope<MovimientoBackendDto>>(`/api/inventario/movimientos/${id}`, withAuth())
    return res.data ? mapMovimiento(res.data) : null
  },
}
