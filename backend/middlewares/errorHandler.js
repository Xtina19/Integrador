/**
 * Middleware global de errores — Error Envelope LibroSys.
 * Debe registrarse como ÚLTIMO middleware en Express.
 */

const { AppError } = require('../errors')
const { DatabaseError, DATABASE_CODES } = require('../helpers/DatabaseError')

function httpStatusForDatabase(code) {
  switch (code) {
    case DATABASE_CODES.CONNECTION_FAILED:
    case DATABASE_CODES.TIMEOUT:
      return 503
    case DATABASE_CODES.DEADLOCK:
    case DATABASE_CODES.DUPLICATE_KEY:
    case DATABASE_CODES.FOREIGN_KEY:
      return 409
    default:
      return 500
  }
}

function userMessageForDatabase(code) {
  switch (code) {
    case DATABASE_CODES.CONNECTION_FAILED:
    case DATABASE_CODES.TIMEOUT:
      return 'El servicio no está disponible temporalmente.'
    case DATABASE_CODES.DEADLOCK:
      return 'La operación entra en conflicto con el estado actual. Intente de nuevo.'
    case DATABASE_CODES.DUPLICATE_KEY:
      return 'La operación entra en conflicto con un registro existente.'
    case DATABASE_CODES.FOREIGN_KEY:
      return 'El dato relacionado no es válido.'
    default:
      return 'Ocurrió un error inesperado. Intente de nuevo.'
  }
}

function buildEnvelope(req, { code, message, developerMessage, details, httpStatus }) {
  return {
    success: false,
    error: {
      code,
      message,
      developerMessage: developerMessage || message,
      details: details || undefined,
      traceId: req.traceId || req.headers['x-trace-id'] || null,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url || null,
      method: req.method || null,
    },
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof AppError) {
    return res.status(err.httpStatus || 500).json(
      buildEnvelope(req, {
        code: err.code,
        message: err.message,
        developerMessage: err.developerMessage,
        details: err.details,
        httpStatus: err.httpStatus,
      })
    )
  }

  if (err instanceof DatabaseError) {
    const status = httpStatusForDatabase(err.code)
    return res.status(status).json(
      buildEnvelope(req, {
        code: err.code,
        message: userMessageForDatabase(err.code),
        developerMessage: err.message,
        details: { mysqlCode: err.mysqlCode, sqlState: err.sqlState },
        httpStatus: status,
      })
    )
  }

  // eslint-disable-next-line no-console
  console.error('[errorHandler]', req.traceId, err)

  return res.status(500).json(
    buildEnvelope(req, {
      code: 'COMMON_INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado. Intente de nuevo.',
      developerMessage: err?.message || 'Unhandled error',
      httpStatus: 500,
    })
  )
}

module.exports = { errorHandler, buildEnvelope }
