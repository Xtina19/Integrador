import { httpGet, httpPost, ApiError, getFriendlyErrorMessage } from '@/services/http'
import { apiConfig, isApiEnabled } from '@/config/api'

/** Usuario operativo Ventas (header x-user-id → UsuarioPermisosPort). */
export type VentasUserId = 'usr-cajero' | 'usr-supervisor' | 'usr-admin'

const USER_STORAGE_KEY = 'librosys.ventas.userId'

export function getVentasUserId(): VentasUserId {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (raw === 'usr-supervisor' || raw === 'usr-admin' || raw === 'usr-cajero') return raw
  return 'usr-cajero'
}

export function setVentasUserId(userId: VentasUserId): void {
  localStorage.setItem(USER_STORAGE_KEY, userId)
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  replayed?: boolean
  error?: { code: string; message: string; details?: unknown }
}

function withAuth(userId?: VentasUserId) {
  return {
    headers: {
      ...apiConfig.headers,
      'x-user-id': userId ?? getVentasUserId(),
    },
  }
}

function unwrap<T>(res: ApiEnvelope<T>, fallbackStatus = 500): T {
  if (res.success && res.data !== undefined) return res.data
  const code = res.error?.code ?? 'UNEXPECTED'
  const message = res.error?.message ?? 'No se pudo completar la operación de ventas.'
  const status =
    code === 'VALIDATION'
      ? 400
      : code === 'FORBIDDEN'
        ? 403
        : code === 'NOT_FOUND'
          ? 404
          : code === 'CONFLICT'
            ? 409
            : code === 'DOMAIN_RULE'
              ? 422
              : code === 'INVENTORY_FAILURE'
                ? 502
                : fallbackStatus
  throw new ApiError(message, { status, code, details: res.error?.details })
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(getFriendlyErrorMessage(e), {
      status: e instanceof ApiError ? e.status : undefined,
      details: e,
    })
  }
}

export type TipoVentaDto = 'consumidor_final' | 'cliente_registrado'
export type EstadoVentaDto = 'emitida' | 'anulada'
export type FormaPagoDto = 'efectivo' | 'tarjeta' | 'transferencia' | 'nota_credito'
export type MonedaDto = 'DOP' | 'USD' | 'COP'

export interface VentaResumenDto {
  id: string
  numeroFactura: string
  estado: EstadoVentaDto
  tipoVenta: TipoVentaDto
  sucursalId: string
  moneda: string
  fechaEmision: string
  clienteId?: string
  total: number
  tieneCambios: boolean
  tieneDevoluciones: boolean
  tieneNotasCredito: boolean
}

export interface VentaLineaDto {
  id: string
  productoId: string
  descripcionSnapshot: string
  cantidad: number
  precioUnitario: number
  moneda: string
  descuento?:
    | { tipo: 'monto'; monto: number; moneda: string }
    | { tipo: 'porcentaje'; valor: number }
  importeNeto: number
}

export interface PagoDto {
  id: string
  formaPago: string
  monto: number
  moneda: string
  notaCreditoId?: string
  vuelto?: number
}

export interface HistorialVentaDto {
  id: string
  tipoEvento: string
  usuarioId: string
  fecha: string
  resultado: string
  detalle?: string
}

export interface LineaCambioDto {
  productoId: string
  cantidad: number
  precioUnitario?: number
  descripcionSnapshot?: string
}

export interface CambioDto {
  id: string
  fecha: string
  usuarioId: string
  lineasDevueltas: LineaCambioDto[]
  lineasNuevas: LineaCambioDto[]
  valorDevuelto?: number
  valorNuevo?: number
  diferenciaMonto: number
  moneda: string
  resolucion: string
}

export interface DevolucionDto {
  id: string
  fecha: string
  usuarioId: string
  lineas: Array<{ productoId: string; cantidad: number }>
  aptitudReingreso: string
  compensacion: string
  montoCompensacion: number
  moneda: string
}

export interface NotaCreditoDto {
  id: string
  ventaOrigenId: string
  clienteId: string
  fecha: string
  usuarioId: string
  monto: number
  moneda: string
  motivo: string
  estado: string
  montoAplicado: number
  aplicaciones: Array<{ ventaDestinoId: string; montoAplicado: number; fecha: string }>
}

export interface NotaCreditoDisponibleDto {
  id: string
  ventaOrigenId: string
  numeroFacturaOrigen: string
  clienteId: string
  monto: number
  montoAplicado: number
  saldoPendiente: number
  moneda: string
  motivo: string
  estado: string
  fecha: string
}

/** Listado administrativo de NC (consulta; sin emisión desde esta vista). */
export interface NotaCreditoAdminDto {
  id: string
  fecha: string
  clienteId: string
  clienteNombre?: string
  ventaOrigenId: string
  numeroFacturaOrigen: string
  estado: string
  monto: number
  montoAplicado: number
  saldoPendiente: number
  moneda: string
  motivo: string
  usuarioId: string
  sucursalId: string
  ventaVersion: number
  aplicaciones: Array<{ ventaDestinoId: string; montoAplicado: number; fecha: string }>
}

export interface ListNotasCreditoParams {
  estado?: string
  clienteId?: string
  sucursalId?: string
  desde?: string
  hasta?: string
  texto?: string
  numeroFactura?: string
  limit?: number
  offset?: number
}

export interface VentaDetalleDto {
  id: string
  numeroFactura: string
  estado: EstadoVentaDto
  tipoVenta: TipoVentaDto
  clienteId?: string
  sucursalId: string
  almacenId: string
  usuarioEmisionId: string
  moneda: string
  fechaEmision: string
  subtotal: number
  totalDescuentos: number
  total: number
  version: number
  tieneCambios: boolean
  tieneDevoluciones: boolean
  tieneNotasCredito: boolean
  motivoAnulacion?: string
  lineas: VentaLineaDto[]
  pagos: PagoDto[]
  cambios: CambioDto[]
  devoluciones: DevolucionDto[]
  notasCredito: NotaCreditoDto[]
  historial: HistorialVentaDto[]
}

export interface EmitirVentaRequest {
  tipoVenta: TipoVentaDto
  clienteId?: string
  /** Identidad del maestro Administración (única fuente de verdad). */
  clienteSnapshot?: { nombre: string; activo: boolean }
  sucursalId: string
  almacenId: string
  moneda: MonedaDto
  lineas: Array<{
    productoId: string
    cantidad: number
    precioUnitario?: number
    descuentoPorcentaje?: number
    descuentoMonto?: number
  }>
  pagos: Array<{
    formaPago: FormaPagoDto
    monto: number
    notaCreditoId?: string
    montoEntregadoEfectivo?: number
  }>
  idempotencyKey: string
}

export interface ListVentasParams {
  sucursalId?: string
  estado?: EstadoVentaDto
  clienteId?: string
  desde?: string
  hasta?: string
  numeroFactura?: string
  limit?: number
  offset?: number
}

/** Movimiento del Inventory Engine asociado a una factura / postventa. */
export interface InventarioEfectoVentaDto {
  id: string
  operacion: string
  sentido: string
  productoId: string
  producto: string
  cantidad: number
  almacenId: string
  documentoTipo: string
  documentoId: string
  fecha: string
  usuarioId: string
  saldoAnterior: number
  saldoPosterior: number
}

const BASE = '/api/v1/ventas'

export const ventasApi = {
  isEnabled: () => isApiEnabled('ventas'),

  async listar(params: ListVentasParams = {}): Promise<VentaResumenDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<VentaResumenDto[]>>(BASE, {
        ...withAuth(),
        params,
      })
      return unwrap(res)
    })
  },

  async getById(id: string): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<VentaDetalleDto>>(`${BASE}/${id}`, withAuth())
      return unwrap(res)
    })
  },

  async getByNumero(numero: string): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/por-numero/${encodeURIComponent(numero)}`,
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async emitir(payload: EmitirVentaRequest): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(BASE, payload, withAuth())
      return unwrap(res, 201)
    })
  },

  async emitirConPago(payload: EmitirVentaRequest): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(`${BASE}/pago`, payload, withAuth())
      return unwrap(res, 201)
    })
  },

  async emitirPagoMixto(payload: EmitirVentaRequest): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/pago-mixto`,
        payload,
        withAuth(),
      )
      return unwrap(res, 201)
    })
  },

  async reimprimir(id: string): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${id}/reimprimir`,
        {},
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async historial(id: string): Promise<HistorialVentaDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<HistorialVentaDto[]>>(
        `${BASE}/${id}/historial`,
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async buscarClientes(texto: string): Promise<Array<{ id: string; nombre: string; activo: boolean }>> {
    return safeCall(async () => {
      const res = await httpGet<
        ApiEnvelope<Array<{ id: string; nombre: string; activo: boolean }>>
      >(`${BASE}/clientes/buscar`, { ...withAuth(), params: { texto } })
      return unwrap(res)
    })
  },

  /** Movimientos reales del Inventory Engine ligados a la factura. */
  async inventarioRelacionado(id: string): Promise<InventarioEfectoVentaDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<InventarioEfectoVentaDto[]>>(
        `${BASE}/${id}/inventario`,
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async registrarCambio(
    id: string,
    body: {
      lineasDevueltas: Array<{ productoId: string; cantidad: number }>
      lineasNuevas: Array<{ productoId: string; cantidad: number; precioUnitario?: number }>
      compensacionCliente?: 'devolucion_dinero' | 'nota_credito'
      pagoDiferencia?: {
        formaPago: FormaPagoDto
        monto: number
        montoEntregadoEfectivo?: number
      }
      idempotencyKey: string
      expectedVersion?: number
    },
  ): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${id}/cambios`,
        body,
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async emitirNotaCredito(
    id: string,
    body: { monto: number; motivo: string; expectedVersion?: number },
  ): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${id}/notas-credito`,
        body,
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async anularNotaCredito(
    ventaId: string,
    ncId: string,
    body?: { motivo?: string; expectedVersion?: number },
  ): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${ventaId}/notas-credito/${encodeURIComponent(ncId)}/anular`,
        body ?? {},
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async revertirAplicacionesNotaCredito(
    ventaId: string,
    ncId: string,
    body?: { expectedVersion?: number },
  ): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${ventaId}/notas-credito/${encodeURIComponent(ncId)}/revertir-aplicaciones`,
        body ?? {},
        withAuth(),
      )
      return unwrap(res)
    })
  },

  async listarNotasCreditoDisponibles(clienteId: string): Promise<NotaCreditoDisponibleDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<NotaCreditoDisponibleDto[]>>(
        `${BASE}/notas-credito/disponibles`,
        { ...withAuth(), params: { clienteId } },
      )
      return unwrap(res)
    })
  },

  /** Listado administrativo — solo consulta. Emisión sigue en expediente de factura. */
  async listarNotasCredito(params: ListNotasCreditoParams = {}): Promise<NotaCreditoAdminDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<NotaCreditoAdminDto[]>>(`${BASE}/notas-credito`, {
        ...withAuth(),
        params,
      })
      return unwrap(res)
    })
  },

  async anular(
    id: string,
    body: { motivo: string; idempotencyKey: string; expectedVersion?: number },
    asUser?: VentasUserId,
  ): Promise<VentaDetalleDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<VentaDetalleDto>>(
        `${BASE}/${id}/anular`,
        body,
        withAuth(asUser),
      )
      return unwrap(res)
    })
  },
}
