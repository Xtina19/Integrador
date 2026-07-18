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
  almacenId: string
  almacenNombre: string
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
    sucursal: m.almacenNombre,
  }
}

/** El backend aún no soporta filtros por querystring en /movimientos; se filtra en cliente si se requiere. */
function applyFiltrosCliente(items: MovimientoDto[], filtros?: ListarMovimientosFiltros): MovimientoDto[] {
  if (!filtros) return items
  return items.filter((m) => {
    if (filtros.productoId && m.productoId !== filtros.productoId) return false
    if (filtros.almacenId && m.almacenId !== filtros.almacenId) return false
    if (filtros.documentoTipo && m.documentoTipo !== filtros.documentoTipo) return false
    if (filtros.documentoId && m.documentoId !== filtros.documentoId) return false
    if (filtros.tipo && m.tipo !== filtros.tipo) return false
    if (filtros.desde && m.fecha < filtros.desde) return false
    if (filtros.hasta && m.fecha > filtros.hasta) return false
    return true
  })
}

export const movimientosApi = {
  async listar(filtros?: ListarMovimientosFiltros): Promise<MovimientoDto[]> {
    const res = await httpGet<ApiEnvelope<MovimientoBackendDto[]>>('/api/inventario/movimientos', withAuth())
    return applyFiltrosCliente((res.data ?? []).map(mapMovimiento), filtros)
  },

  async get(id: string): Promise<MovimientoDto | null> {
    const res = await httpGet<ApiEnvelope<MovimientoBackendDto>>(`/api/inventario/movimientos/${id}`, withAuth())
    return res.data ? mapMovimiento(res.data) : null
  },
}
