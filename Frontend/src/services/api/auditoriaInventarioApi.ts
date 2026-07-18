import { http, httpGet } from '@/services/http'
import { apiConfig } from '@/config/api'

export interface AuditoriaInventarioDto {
  id: string
  fecha: string
  usuario: string
  accion: string
  documentoTipo: string
  documentoId: string
  ip?: string
  resultado: 'OK' | 'RECHAZADO' | 'ERROR'
  detalle?: string
}

export interface AuditoriaInventarioFiltros {
  usuario?: string
  documentoTipo?: string
  documentoId?: string
  accion?: string
  ip?: string
  resultado?: string
  desde?: string
  hasta?: string
}

/** Forma real devuelta por GET /api/inventario/auditoria (backend read-model, sin campo ip). */
interface AuditoriaBackendDto {
  id: string
  tipoAccion: string
  usuarioId: string
  fecha: string
  resultado: string
  movimientoId?: string
  documentoTipo?: string
  documentoId?: string
  productoId?: string
  almacenId?: string
  detalle?: string
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

/** El backend usa nombres de query distintos: usuarioId, documento, accion, resultado, from, to. */
function toBackendParams(filtros?: AuditoriaInventarioFiltros): Record<string, string | undefined> {
  if (!filtros) return {}
  return {
    usuarioId: filtros.usuario,
    documento: filtros.documentoId || filtros.documentoTipo,
    accion: filtros.accion,
    resultado: filtros.resultado,
    from: filtros.desde,
    to: filtros.hasta,
  }
}

function mapAuditoria(a: AuditoriaBackendDto): AuditoriaInventarioDto {
  return {
    id: a.id,
    fecha: a.fecha,
    usuario: a.usuarioId,
    accion: a.tipoAccion,
    documentoTipo: a.documentoTipo ?? '—',
    documentoId: a.documentoId ?? a.movimientoId ?? '—',
    ip: '—',
    resultado: (a.resultado as AuditoriaInventarioDto['resultado']) || 'OK',
    detalle: a.detalle,
  }
}

export const auditoriaInventarioApi = {
  async listar(filtros?: AuditoriaInventarioFiltros): Promise<AuditoriaInventarioDto[]> {
    const res = await httpGet<ApiEnvelope<AuditoriaBackendDto[]>>(
      '/api/inventario/auditoria',
      withAuth(toBackendParams(filtros)),
    )
    let items = (res.data ?? []).map(mapAuditoria)
    if (filtros?.ip) {
      items = items.filter((i) => i.ip?.includes(filtros.ip!))
    }
    return items
  },

  /** Backend expone /auditoria/export?format=csv devolviendo texto CSV plano (no envelope JSON). */
  async exportar(filtros?: AuditoriaInventarioFiltros): Promise<Blob> {
    const { data } = await http.get('/api/inventario/auditoria/export', {
      headers: { ...apiConfig.headers, ...AUTH_HEADERS },
      params: { ...toBackendParams(filtros), format: 'csv' },
      responseType: 'blob',
    })
    return data as Blob
  },
}
