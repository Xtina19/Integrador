export type InventoryDomainEventName =
  | 'MovimientoRegistrado'
  | 'StockActualizado'

export interface DomainEventBase {
  readonly eventId: string
  readonly name: InventoryDomainEventName
  readonly occurredAt: Date
  readonly aggregateType: string
  readonly aggregateId: string
}

export interface MovimientoRegistradoEvent extends DomainEventBase {
  readonly name: 'MovimientoRegistrado'
  readonly payload: {
    movimientoId: string
    tipoMovimiento: string
    productoId: string
    almacenId: string
    cantidad: number
    saldoAnterior: number
    saldoPosterior: number
    documentoTipo: string
    documentoId: string
    idempotencyKey: string
  }
}

export interface StockActualizadoEvent extends DomainEventBase {
  readonly name: 'StockActualizado'
  readonly payload: {
    existenciaId: string
    productoId: string
    almacenId: string
    saldoNuevo: number
    version: number
  }
}

export type InventoryDomainEvent =
  | MovimientoRegistradoEvent
  | StockActualizadoEvent
