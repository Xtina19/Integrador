import type { Response } from 'express'
import type { ApplicationResult } from '../../../application/results/ApplicationResult'

export function sendApplicationResult<T>(
  res: Response,
  result: ApplicationResult<T>,
  successStatus = 200,
): void {
  if (result.ok) {
    res.status(successStatus).json({
      success: true,
      data: result.value,
      replayed: result.replayed ?? false,
    })
    return
  }

  const status =
    result.code === 'NOT_FOUND'
      ? 404
      : result.code === 'VALIDATION'
        ? 400
        : result.code === 'FORBIDDEN'
          ? 403
          : result.code === 'CONFLICT'
            ? 409
            : result.code === 'DOMAIN_RULE'
              ? 422
              : result.code === 'INVENTORY_FAILURE'
                ? 502
                : 500

  res.status(status).json({
    success: false,
    error: {
      code: result.code,
      message: result.message,
      details: result.details,
    },
  })
}

export function sendHttpError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({
    success: false,
    error: { code, message },
  })
}
