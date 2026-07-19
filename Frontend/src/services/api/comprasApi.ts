/**
 * Cliente HTTP del módulo Compras → /api/compras
 * Contrato: { success, message?, data, meta? }
 */
import { httpGet, httpPost, httpPut, ApiError, getFriendlyErrorMessage } from '@/services/http'
import { apiConfig, isApiEnabled } from '@/config/api'

const BASE = '/api/compras'
const USER_STORAGE_KEY = 'librosys.compras.userId'

export type ComprasUserId = number

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  meta?: { page?: number; pageSize?: number; total?: number }
  error?: { code: string; message: string; details?: unknown }
}

export interface PageResult<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  message?: string
}

export interface OrdenCompraDto {
  id: number
  codigo: string
  proveedorId: number
  sucursalId?: number | null
  monedaId: number
  tasaCambio: number
  condicionPagoId: number
  tipoCompra: 'nacional' | 'internacional'
  fechaOrden: string
  fechaEntregaEstimada?: string | null
  subtotal: number
  descuento: number
  impuestos: number
  total: number
  estado: string
  activo: boolean
  observaciones?: string | null
  detalles?: DetalleOrdenDto[]
}

export interface DetalleOrdenDto {
  id?: number
  linea: number
  productoId: number
  cantidadSolicitada: number
  costoUnitario: number
  descuento: number
  impuesto: number
  subtotal: number
}

export interface RecepcionDto {
  id: number
  codigo: string
  ordenCompraId: number
  almacenId: number
  fechaRecepcion: string
  usuarioReceptor: number
  usuarioInspector?: number | null
  resultadoInspeccion?: string | null
  observaciones?: string | null
  estado: string
  activo: boolean
  detalles?: DetalleRecepcionDto[]
}

export interface DetalleRecepcionDto {
  id?: number
  detalleOrdenCompraId: number
  productoId: number
  cantidadRecibida: number
  costoUnitario: number
}

export interface FacturaProveedorDto {
  id: number
  codigo: string
  ordenCompraId: number
  proveedorId: number
  numeroFactura: string
  ncf?: string | null
  monedaId: number
  tasaCambio: number
  condicionPagoId: number
  fechaEmision: string
  fechaRecepcionDocumento?: string | null
  fechaVencimiento?: string | null
  subtotal: number
  descuento: number
  impuestos: number
  total: number
  estado: string
  estadoPago: string
  activo: boolean
  observaciones?: string | null
  detalles?: unknown[]
}

export interface CondicionPagoDto {
  id: number
  codigo: string
  nombre: string
  diasCredito: number
  estado: string
  activo: boolean
}

function getComprasUserId(): ComprasUserId {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  const n = Number(raw)
  if (Number.isInteger(n) && n > 0) return n
  return 2
}

export function setComprasUserId(userId: ComprasUserId): void {
  localStorage.setItem(USER_STORAGE_KEY, String(userId))
}

function withAuth() {
  return {
    headers: {
      ...apiConfig.headers,
      'x-user-id': String(getComprasUserId()),
    },
  }
}

function unwrap<T>(res: ApiEnvelope<T>, fallbackStatus = 500): T {
  if (res.success && res.data !== undefined) return res.data
  const code = res.error?.code ?? 'UNEXPECTED'
  const message = res.error?.message ?? 'No se pudo completar la operación de compras.'
  const status =
    code === 'VALIDATION' || code?.startsWith('VALIDATION_')
      ? 400
      : code.includes('NOT_FOUND')
        ? 404
        : code.includes('INVALID_STATE') || code.includes('NOT_EDITABLE') || code.includes('ALREADY')
          ? 409
          : fallbackStatus
  throw new ApiError(message, { status, code, details: res.error?.details })
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(getFriendlyErrorMessage(e), { details: e })
  }
}

async function listPage<T>(url: string, params?: Record<string, string | number | undefined>): Promise<PageResult<T>> {
  const qs = new URLSearchParams()
  qs.set('page', '1')
  qs.set('pageSize', '200')
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    })
  }
  const res = await httpGet<
    ApiEnvelope<T[] | PageResult<T>>
  >(`${url}?${qs}`, withAuth())

  if (!res.success || res.data === undefined) {
    unwrap(res as ApiEnvelope<T[]>)
  }

  // FASE 7: data = filas[], meta = paginación
  if (Array.isArray(res.data)) {
    return {
      data: res.data,
      page: res.meta?.page ?? 1,
      pageSize: res.meta?.pageSize ?? res.data.length,
      total: res.meta?.total ?? res.data.length,
      message: res.message,
    }
  }

  // Compat legado: data = { data, page, pageSize, total }
  const nested = res.data as PageResult<T>
  return {
    data: nested.data ?? [],
    page: nested.page ?? res.meta?.page ?? 1,
    pageSize: nested.pageSize ?? res.meta?.pageSize ?? 50,
    total: nested.total ?? res.meta?.total ?? 0,
    message: res.message,
  }
}

export const comprasApi = {
  isEnabled: () => isApiEnabled('compras'),

  listOrdenes: (params?: Record<string, string | number | undefined>) =>
    safeCall(() => listPage<OrdenCompraDto>(`${BASE}/ordenes`, params)),

  getOrden: (id: number) =>
    safeCall(async () => {
      const res = await httpGet<ApiEnvelope<OrdenCompraDto>>(`${BASE}/ordenes/${id}`, withAuth())
      return unwrap(res)
    }),

  createOrden: (body: Record<string, unknown>) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<OrdenCompraDto>>(`${BASE}/ordenes`, body, withAuth())
      return unwrap(res, 201)
    }),

  updateOrden: (id: number, body: Record<string, unknown>) =>
    safeCall(async () => {
      const res = await httpPut<ApiEnvelope<OrdenCompraDto>>(`${BASE}/ordenes/${id}`, body, withAuth())
      return unwrap(res)
    }),

  enviarAprobacion: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<OrdenCompraDto>>(
        `${BASE}/ordenes/${id}/enviar-aprobacion`,
        {},
        withAuth()
      )
      return unwrap(res)
    }),

  aprobarOrden: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<OrdenCompraDto>>(
        `${BASE}/ordenes/${id}/aprobar`,
        {},
        withAuth()
      )
      return unwrap(res)
    }),

  cancelarOrden: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<OrdenCompraDto>>(
        `${BASE}/ordenes/${id}/cancelar`,
        {},
        withAuth()
      )
      return unwrap(res)
    }),

  cerrarOrden: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<OrdenCompraDto>>(`${BASE}/ordenes/${id}/cerrar`, {}, withAuth())
      return unwrap(res)
    }),

  listRecepciones: (params?: Record<string, string | number | undefined>) =>
    safeCall(() => listPage<RecepcionDto>(`${BASE}/recepciones`, params)),

  getRecepcion: (id: number) =>
    safeCall(async () => {
      const res = await httpGet<ApiEnvelope<RecepcionDto>>(`${BASE}/recepciones/${id}`, withAuth())
      return unwrap(res)
    }),

  createRecepcion: (body: Record<string, unknown>) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<RecepcionDto>>(`${BASE}/recepciones`, body, withAuth())
      return unwrap(res, 201)
    }),

  confirmarRecepcion: (id: number, body: Record<string, unknown> = { resultadoInspeccion: 'aceptada' }) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<RecepcionDto>>(
        `${BASE}/recepciones/${id}/confirmar`,
        body,
        withAuth()
      )
      return unwrap(res)
    }),

  anularRecepcion: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<RecepcionDto>>(
        `${BASE}/recepciones/${id}/anular`,
        {},
        withAuth()
      )
      return unwrap(res)
    }),

  listFacturas: (params?: Record<string, string | number | undefined>) =>
    safeCall(() => listPage<FacturaProveedorDto>(`${BASE}/facturas`, params)),

  getFactura: (id: number) =>
    safeCall(async () => {
      const res = await httpGet<ApiEnvelope<FacturaProveedorDto>>(`${BASE}/facturas/${id}`, withAuth())
      return unwrap(res)
    }),

  getFacturaPorOrden: (ordenId: number) =>
    safeCall(async () => {
      const res = await httpGet<ApiEnvelope<FacturaProveedorDto | null>>(
        `${BASE}/facturas/por-orden/${ordenId}`,
        withAuth()
      )
      return unwrap(res)
    }),

  registrarFactura: (body: Record<string, unknown>) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<FacturaProveedorDto>>(`${BASE}/facturas`, body, withAuth())
      return unwrap(res, 201)
    }),

  anularFactura: (id: number) =>
    safeCall(async () => {
      const res = await httpPost<ApiEnvelope<FacturaProveedorDto>>(
        `${BASE}/facturas/${id}/anular`,
        {},
        withAuth()
      )
      return unwrap(res)
    }),

  listCondicionesPago: () =>
    safeCall(() => listPage<CondicionPagoDto>(`${BASE}/condiciones-pago`)),

  /** @deprecated Usar listOrdenes */
  async listPurchaseOrders() {
    const page = await this.listOrdenes()
    return page.data
  },
}
