import type { FormaPago, MonedaCodigo, TipoVenta } from '../../domain/enums'

/**
 * Armado transitorio de POS (VEN-DOM: no es Venta persistida / REST-01).
 * Solo capa de aplicación — al confirmar se crea el Aggregate `Venta`.
 */
export interface TicketPosLinea {
  productoId: string
  cantidad: number
  precioUnitario?: number
  descuentoPorcentaje?: number
  descuentoMonto?: number
}

export interface TicketPosPago {
  formaPago: FormaPago
  monto: number
  notaCreditoId?: string
  montoEntregadoEfectivo?: number
}

export interface TicketPos {
  tipoVenta: TipoVenta
  clienteId?: string
  sucursalId: string
  almacenId: string
  moneda: MonedaCodigo
  lineas: TicketPosLinea[]
  pagos: TicketPosPago[]
}
