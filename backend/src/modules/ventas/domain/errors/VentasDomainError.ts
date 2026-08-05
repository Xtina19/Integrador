export type VentasErrorCode =
  | 'INVALID_QUANTITY'
  | 'INVALID_MONEY'
  | 'INVALID_STATE'
  | 'INVALID_LINE'
  | 'INVALID_PAYMENT'
  | 'INVALID_DISCOUNT'
  | 'INVALID_CUSTOMER'
  | 'INVALID_CREDIT_NOTE'
  | 'POST_SALE_NOT_ALLOWED'
  | 'INSUFFICIENT_NET_QUANTITY'
  | 'CREDIT_EXCEEDED'
  | 'PAYMENT_INCOMPLETE'
  | 'NEGATIVE_TOTAL'
  | 'EMPTY_LINES'
  | 'CURRENCY_MISMATCH'
  | 'VERSION_CONFLICT'
  | 'FORBIDDEN_TRANSITION'

export class VentasDomainError extends Error {
  readonly code: VentasErrorCode
  readonly details?: Readonly<Record<string, unknown>>

  constructor(
    code: VentasErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message)
    this.name = 'VentasDomainError'
    this.code = code
    this.details = details
  }
}
