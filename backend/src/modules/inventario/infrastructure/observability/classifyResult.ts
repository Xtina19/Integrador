import { ApplicationResult } from '../../application/results/ApplicationResult'

export function classifyApplicationResult<T>(result: ApplicationResult<T>): {
  ok: boolean
  versionConflict?: boolean
  idempotencyReplay?: boolean
  engineError?: boolean
} {
  if (result.ok) {
    return {
      ok: true,
      idempotencyReplay: result.replayed === true,
    }
  }

  const domainCode = String(result.details?.domainCode ?? '')
  return {
    ok: false,
    versionConflict:
      result.code === 'CONFLICT' || domainCode === 'VERSION_CONFLICT',
    engineError:
      domainCode === 'INSUFFICIENT_STOCK' ||
      domainCode === 'NEGATIVE_STOCK' ||
      domainCode === 'ALMACEN_BLOQUEADO' ||
      domainCode === 'PRODUCTO_INACTIVO',
  }
}
