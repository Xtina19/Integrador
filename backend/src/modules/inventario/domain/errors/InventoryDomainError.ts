export type InventoryErrorCode =
  | 'INVALID_QUANTITY'
  | 'INVALID_SALDO'
  | 'INSUFFICIENT_STOCK'
  | 'NEGATIVE_STOCK'
  | 'VERSION_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_MOVEMENT_TYPE'
  | 'INVALID_DOCUMENT_REF'
  | 'INVALID_ADJUSTMENT'
  | 'INVALID_COMPENSATION'
  | 'MISSING_ACTOR'
  | 'MISSING_IDEMPOTENCY_KEY'
  | 'ALMACEN_BLOQUEADO'
  | 'PRODUCTO_INACTIVO'

export class InventoryDomainError extends Error {
  readonly code: InventoryErrorCode
  readonly details?: Readonly<Record<string, unknown>>

  constructor(
    code: InventoryErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message)
    this.name = 'InventoryDomainError'
    this.code = code
    this.details = details
  }
}
