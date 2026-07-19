const { AppError } = require('./AppError')

/**
 * ValidationError — VALIDATION_* (entrada de dominio / forma).
 */
class ValidationError extends AppError {
  constructor(code, opts = {}) {
    super(code, { httpStatus: 400, ...opts })
    this.name = 'ValidationError'
  }
}

module.exports = { ValidationError }
