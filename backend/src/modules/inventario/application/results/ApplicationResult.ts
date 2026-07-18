import { InventoryDomainError } from '../../domain/errors/InventoryDomainError'

export type ApplicationFailureCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'DOMAIN_RULE'
  | 'UNEXPECTED'

export type ApplicationResult<T> =
  | { ok: true; value: T; replayed?: boolean }
  | {
      ok: false
      code: ApplicationFailureCode
      message: string
      details?: Readonly<Record<string, unknown>>
    }

export function ok<T>(value: T, replayed = false): ApplicationResult<T> {
  return replayed ? { ok: true, value, replayed: true } : { ok: true, value }
}

export function fail<T = never>(
  code: ApplicationFailureCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ApplicationResult<T> {
  return { ok: false, code, message, details }
}

export function mapDomainError(
  error: unknown,
): ApplicationResult<never> {
  if (error instanceof InventoryDomainError) {
    const code: ApplicationFailureCode =
      error.code === 'VERSION_CONFLICT' ||
      error.code === 'IDEMPOTENCY_CONFLICT'
        ? 'CONFLICT'
        : error.code === 'ALMACEN_BLOQUEADO' ||
            error.code === 'PRODUCTO_INACTIVO' ||
            error.code === 'INSUFFICIENT_STOCK' ||
            error.code === 'NEGATIVE_STOCK' ||
            error.code === 'INVALID_ADJUSTMENT' ||
            error.code === 'INVALID_COMPENSATION' ||
            error.code === 'INVALID_MOVEMENT_TYPE' ||
            error.code === 'INVALID_DOCUMENT_REF' ||
            error.code === 'INVALID_QUANTITY' ||
            error.code === 'INVALID_SALDO' ||
            error.code === 'MISSING_ACTOR' ||
            error.code === 'MISSING_IDEMPOTENCY_KEY'
          ? 'DOMAIN_RULE'
          : 'DOMAIN_RULE'
    return fail(code, error.message, {
      domainCode: error.code,
      ...error.details,
    })
  }
  return fail(
    'UNEXPECTED',
    error instanceof Error ? error.message : 'Error inesperado',
  )
}

export async function withUnitOfWork<T>(
  uow: { begin(): Promise<void>; commit(): Promise<void>; rollback(): Promise<void> },
  fn: () => Promise<ApplicationResult<T>>,
): Promise<ApplicationResult<T>> {
  await uow.begin()
  try {
    const result = await fn()
    if (result.ok) {
      await uow.commit()
    } else {
      await uow.rollback()
    }
    return result
  } catch (error) {
    await uow.rollback()
    return mapDomainError(error)
  }
}
