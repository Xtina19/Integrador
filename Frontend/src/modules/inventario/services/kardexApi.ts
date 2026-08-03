import { httpGet } from '@/services/http'
import { apiConfig } from '@/config/api'

export interface KardexLineaDto {
  id: string
  fecha: string
  productoId: string
  productoTitulo?: string
  isbn?: string
  tipo: string
  cantidad: number
  saldo: number
  documentoTipo: string
  documentoId: string
  usuario: string
  almacen?: string
}

/** Forma real devuelta por GET /api/inventario/kardex (backend read-model). */
interface KardexBackendDto {
  id: string
  isbn?: string
  sucursalNombre?: string
  movimientoId: string
  productoId: string
  productoTitulo?: string
  almacenId: string
  almacenNombre: string
  tipoMovimiento: string
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

function mapKardex(
  kardex: KardexBackendDto,
): KardexLineaDto {
  return {
    id: kardex.id,
    fecha: kardex.fechaMovimiento,
    productoId: kardex.productoId,
    productoTitulo:
      kardex.productoTitulo,
    isbn: kardex.isbn,
    tipo: kardex.tipoMovimiento,
    cantidad: kardex.cantidad,
    saldo: kardex.saldoPosterior,
    documentoTipo:
      kardex.documentoTipo,
    documentoId:
      kardex.documentoId,
    usuario: kardex.usuarioId,
    almacen: kardex.almacenNombre,
  }
}

export const kardexApi = {
  async listar(productoId?: string): Promise<KardexLineaDto[]> {
    const res = await httpGet<ApiEnvelope<KardexBackendDto[]>>(
      '/api/inventario/kardex',
      withAuth(productoId ? { productoId } : undefined),
    )
    return (res.data ?? []).map(mapKardex)
  },
}
