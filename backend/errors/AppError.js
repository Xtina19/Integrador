/**
 * AppError — raíz de errores de aplicación LibroSys.
 * Catálogo: code estable + mensajes usuario/desarrollador + HTTP.
 */

class AppError extends Error {
  /**
   * @param {string} code
   * @param {object} opts
   * @param {string} opts.message Mensaje usuario
   * @param {string} [opts.developerMessage]
   * @param {number} [opts.httpStatus=500]
   * @param {object} [opts.details]
   * @param {Error} [opts.cause]
   */
  constructor(code, opts = {}) {
    const message = opts.message || opts.developerMessage || code
    super(message)
    this.name = 'AppError'
    this.code = code
    this.message = message
    this.developerMessage = opts.developerMessage || message
    this.httpStatus = opts.httpStatus ?? 500
    this.details = opts.details || undefined
    if (opts.cause) this.cause = opts.cause
  }
}

module.exports = { AppError }
