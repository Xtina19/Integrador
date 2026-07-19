import { VentasDomainError } from '../../domain/errors/VentasDomainError'

export type ApplicationFailureCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'DOMAIN_RULE'
  | 'INVENTORY_FAILURE'
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

export function mapDomainError(error: unknown): ApplicationResult<never> {
  if (error instanceof VentasDomainError) {
    const code: ApplicationFailureCode =
      error.code === 'VERSION_CONFLICT'
        ? 'CONFLICT'
        : error.code === 'FORBIDDEN_TRANSITION' || error.code === 'POST_SALE_NOT_ALLOWED'
          ? 'FORBIDDEN'
          : 'DOMAIN_RULE'
    return fail(code, error.message, { domainCode: error.code, ...error.details })
  }
  return fail('UNEXPECTED', error instanceof Error ? error.message : 'Error inesperado')
}
