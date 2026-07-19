const { AppError } = require('./AppError')

/**
 * BusinessError — padre semántico de reglas de dominio.
 */
class BusinessError extends AppError {
  constructor(code, opts = {}) {
    super(code, { httpStatus: opts.httpStatus ?? 409, ...opts })
    this.name = 'BusinessError'
  }
}

module.exports = { BusinessError }
