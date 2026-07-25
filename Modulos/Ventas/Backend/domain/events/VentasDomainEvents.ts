export type VentasDomainEventName =
  | 'FacturaEmitida'
  | 'PagoRegistradoEnVenta'
  | 'PagoMixtoCompletado'
  | 'DescuentoAplicadoEnVenta'
  | 'CambioVentaRegistrado'
  | 'DevolucionVentaRegistrada'
  | 'NotaCreditoEmitida'
  | 'NotaCreditoAplicada'
  | 'FacturaAnulada'
  | 'FacturaReimpresa'
  | 'EfectoInventarioVentaSolicitado'
  | 'EfectoInventarioVentaConfirmado'
  | 'EfectoInventarioVentaFallido'

export interface DomainEventBase {
  readonly eventId: string
  readonly name: VentasDomainEventName
  readonly occurredAt: Date
  readonly aggregateType: 'Venta'
  readonly aggregateId: string
}

export interface FacturaEmitidaEvent extends DomainEventBase {
  readonly name: 'FacturaEmitida'
  readonly payload: {
    numeroFactura: string
    sucursalId: string
    total: number
    moneda: string
    tipoVenta: string
  }
}

export interface PagoRegistradoEnVentaEvent extends DomainEventBase {
  readonly name: 'PagoRegistradoEnVenta'
  readonly payload: { pagoIds: string[]; totalPagado: number }
}

export interface PagoMixtoCompletadoEvent extends DomainEventBase {
  readonly name: 'PagoMixtoCompletado'
  readonly payload: { cantidadFormas: number; total: number }
}

export interface DescuentoAplicadoEnVentaEvent extends DomainEventBase {
  readonly name: 'DescuentoAplicadoEnVenta'
  readonly payload: { totalDescuentos: number }
}

export interface CambioVentaRegistradoEvent extends DomainEventBase {
  readonly name: 'CambioVentaRegistrado'
  readonly payload: { cambioId: string }
}

export interface DevolucionVentaRegistradaEvent extends DomainEventBase {
  readonly name: 'DevolucionVentaRegistrada'
  readonly payload: { devolucionId: string }
}

export interface NotaCreditoEmitidaEvent extends DomainEventBase {
  readonly name: 'NotaCreditoEmitida'
  readonly payload: { notaCreditoId: string; monto: number }
}

export interface NotaCreditoAplicadaEvent extends DomainEventBase {
  readonly name: 'NotaCreditoAplicada'
  readonly payload: { notaCreditoId: string; ventaDestinoId: string; monto: number }
}

export interface FacturaAnuladaEvent extends DomainEventBase {
  readonly name: 'FacturaAnulada'
  readonly payload: { motivo: string }
}

export interface FacturaReimpresaEvent extends DomainEventBase {
  readonly name: 'FacturaReimpresa'
  readonly payload: { usuarioId: string }
}

export interface EfectoInventarioVentaSolicitadoEvent extends DomainEventBase {
  readonly name: 'EfectoInventarioVentaSolicitado'
  readonly payload: { tipoEfecto: string; idempotencyKey: string }
}

export interface EfectoInventarioVentaConfirmadoEvent extends DomainEventBase {
  readonly name: 'EfectoInventarioVentaConfirmado'
  readonly payload: { tipoEfecto: string }
}

export interface EfectoInventarioVentaFallidoEvent extends DomainEventBase {
  readonly name: 'EfectoInventarioVentaFallido'
  readonly payload: { tipoEfecto: string; message: string }
}

export type VentasDomainEvent =
  | FacturaEmitidaEvent
  | PagoRegistradoEnVentaEvent
  | PagoMixtoCompletadoEvent
  | DescuentoAplicadoEnVentaEvent
  | CambioVentaRegistradoEvent
  | DevolucionVentaRegistradaEvent
  | NotaCreditoEmitidaEvent
  | NotaCreditoAplicadaEvent
  | FacturaAnuladaEvent
  | FacturaReimpresaEvent
  | EfectoInventarioVentaSolicitadoEvent
  | EfectoInventarioVentaConfirmadoEvent
  | EfectoInventarioVentaFallidoEvent

let eventSeq = 0
export function newEventId(): string {
  eventSeq += 1
  return `evt-ven-${Date.now()}-${eventSeq}`
}
