import type { FormaPago, MonedaCodigo, TipoVenta } from '../../domain/enums'

export interface EmitirVentaCommand {
  tipoVenta: TipoVenta
  clienteId?: string
  /**
   * Identidad del maestro Administración (única fuente de verdad).
   * Si se envía, Ventas actualiza su ACL de identidad sin catálogo duplicado ni sync.
   */
  clienteSnapshot?: { nombre: string; activo: boolean }
  sucursalId: string
  almacenId: string
  usuarioId: string
  moneda: MonedaCodigo
  lineas: Array<{
    productoId: string
    cantidad: number
    precioUnitario?: number
    descuentoPorcentaje?: number
    descuentoMonto?: number
  }>
  pagos: Array<{
    formaPago: FormaPago
    monto: number
    /** Obligatorio si formaPago === nota_credito. */
    notaCreditoId?: string
    montoEntregadoEfectivo?: number
  }>
  idempotencyKey: string
}

export interface RegistrarCambioCommand {
  ventaId: string
  usuarioId: string
  lineasDevueltas: Array<{ productoId: string; cantidad: number }>
  /** Vacío = solo devolución física (sin producto de salida). */
  lineasNuevas: Array<{ productoId: string; cantidad: number; precioUnitario?: number }>
  /**
   * Si la diferencia es a favor del cliente:
   * - devolucion_dinero: caja devuelve efectivo
   * - nota_credito: emite NC por la diferencia
   */
  compensacionCliente?: 'devolucion_dinero' | 'nota_credito'
  /** Pago únicamente por la diferencia cuando valorNuevo > valorDevuelto. */
  pagoDiferencia?: {
    formaPago: FormaPago
    monto: number
    montoEntregadoEfectivo?: number
  }
  idempotencyKey: string
  expectedVersion?: number
}

export interface EmitirNotaCreditoCommand {
  ventaId: string
  usuarioId: string
  monto: number
  motivo: string
  expectedVersion?: number
}

export interface AnularNotaCreditoCommand {
  ventaId: string
  notaCreditoId: string
  usuarioId: string
  motivo?: string
  expectedVersion?: number
}

export interface RevertirAplicacionesNotaCreditoCommand {
  ventaId: string
  notaCreditoId: string
  usuarioId: string
  expectedVersion?: number
}

export interface AnularVentaCommand {
  ventaId: string
  usuarioId: string
  motivo: string
  idempotencyKey: string
  expectedVersion?: number
}

export interface ReimprimirVentaCommand {
  ventaId: string
  usuarioId: string
}
