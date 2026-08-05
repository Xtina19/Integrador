const { BusinessError } = require('./BusinessError')

/**
 * PurchaseError — códigos PURCHASE_* del catálogo.
 */
class PurchaseError extends BusinessError {
  constructor(code, opts = {}) {
    super(code, opts)
    this.name = 'PurchaseError'
  }
}

module.exports = { PurchaseError }
