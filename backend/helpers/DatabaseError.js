/**
 * Error de infraestructura MySQL / pool.
 * No usar para errores de programación o de uso incorrecto del repository.
 */

class DatabaseError extends Error {
  /**
   * @param {string} code Código catálogo DATABASE_*
   * @param {string} message Mensaje desarrollador
   * @param {{ cause?: Error, mysqlCode?: string|number, sqlState?: string }} [opts]
   */
  constructor(code, message, opts = {}) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.mysqlCode = opts.mysqlCode ?? null
    this.sqlState = opts.sqlState ?? null
    if (opts.cause) this.cause = opts.cause
  }
}

const DATABASE_CODES = Object.freeze({
  CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  TIMEOUT: 'DATABASE_TIMEOUT',
  DEADLOCK: 'DATABASE_DEADLOCK',
  DUPLICATE_KEY: 'DATABASE_DUPLICATE_KEY',
  FOREIGN_KEY: 'DATABASE_FOREIGN_KEY',
  CONSTRAINT: 'DATABASE_CONSTRAINT_VIOLATION',
})

/**
 * Traduce un error de mysql2 a DatabaseError cuando corresponde.
 * Si no se reconoce, envuelve como CONSTRAINT genérico o CONNECTION según errno.
 * @param {any} err
 * @returns {DatabaseError}
 */
function wrapMysqlError(err) {
  if (err instanceof DatabaseError) return err

  const errno = err?.errno ?? err?.code
  const sqlState = err?.sqlState
  const msg = err?.message || 'Error de base de datos'

  if (
    errno === 'ECONNREFUSED' ||
    errno === 'PROTOCOL_CONNECTION_LOST' ||
    errno === 'ENOTFOUND' ||
    errno === 'ECONNRESET' ||
    err?.fatal === true && String(msg).includes('connect')
  ) {
    return new DatabaseError(DATABASE_CODES.CONNECTION_FAILED, msg, {
      cause: err,
      mysqlCode: errno,
      sqlState,
    })
  }

  if (errno === 'ETIMEDOUT' || errno === 'PROTOCOL_SEQUENCE_TIMEOUT') {
    return new DatabaseError(DATABASE_CODES.TIMEOUT, msg, { cause: err, mysqlCode: errno, sqlState })
  }

  // MySQL numeric errno
  const n = Number(errno)
  if (n === 1213) {
    return new DatabaseError(DATABASE_CODES.DEADLOCK, msg, { cause: err, mysqlCode: n, sqlState })
  }
  if (n === 1062 || err?.code === 'ER_DUP_ENTRY') {
    return new DatabaseError(DATABASE_CODES.DUPLICATE_KEY, msg, { cause: err, mysqlCode: n || err.code, sqlState })
  }
  if (
    n === 1452 ||
    n === 1216 ||
    n === 1217 ||
    err?.code === 'ER_NO_REFERENCED_ROW_2' ||
    err?.code === 'ER_NO_REFERENCED_ROW' ||
    err?.code === 'ER_ROW_IS_REFERENCED_2'
  ) {
    return new DatabaseError(DATABASE_CODES.FOREIGN_KEY, msg, { cause: err, mysqlCode: n || err.code, sqlState })
  }

  return new DatabaseError(DATABASE_CODES.CONSTRAINT, msg, {
    cause: err,
    mysqlCode: errno,
    sqlState,
  })
}

module.exports = {
  DatabaseError,
  DATABASE_CODES,
  wrapMysqlError,
}
