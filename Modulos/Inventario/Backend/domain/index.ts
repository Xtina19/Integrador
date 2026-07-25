export { InventoryDomainError } from './errors/InventoryDomainError'
export type { InventoryErrorCode } from './errors/InventoryDomainError'

export { Cantidad } from './value-objects/Cantidad'
export { Saldo } from './value-objects/Saldo'
export { Version } from './value-objects/Version'
export { IdempotencyKey } from './value-objects/IdempotencyKey'
export { DocumentoOrigenRef } from './value-objects/DocumentoOrigenRef'
export type { TipoDocumentoOrigen } from './value-objects/DocumentoOrigenRef'
export {
  sentidoDe,
  esTipoMovimiento,
} from './value-objects/TipoMovimiento'
export type {
  TipoMovimiento,
  SentidoMovimiento,
} from './value-objects/TipoMovimiento'

export { Existencia } from './entities/Existencia'
export { MovimientoInventario } from './entities/MovimientoInventario'
export { Kardex } from './entities/Kardex'
export { AuditoriaMovimiento } from './entities/AuditoriaMovimiento'

export { Transferencia } from './aggregates/Transferencia'
export { Descarte } from './aggregates/Descarte'
export { Ajuste } from './aggregates/Ajuste'
export { ConteoFisico } from './aggregates/ConteoFisico'

export type {
  InventoryDomainEvent,
  MovimientoRegistradoEvent,
  StockActualizadoEvent,
} from './events/InventoryDomainEvents'

export { InventoryEngine } from './services/InventoryEngine'
export type {
  EngineContext,
  EngineResult,
  RegistrarEntradaCommand,
  RegistrarSalidaCommand,
  AplicarDescarteCommand,
  AplicarAjusteCommand,
  RegistrarCompensacionCommand,
} from './services/InventoryEngine'
