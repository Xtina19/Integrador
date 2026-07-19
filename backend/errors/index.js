/**
 * Catálogo de excepciones LibroSys (jerarquía global).
 */

const { AppError } = require('./AppError')
const { ValidationError } = require('./ValidationError')
const { BusinessError } = require('./BusinessError')
const { PurchaseError } = require('./PurchaseError')
const { DatabaseError, DATABASE_CODES, wrapMysqlError } = require('./DatabaseError')

module.exports = {
  AppError,
  ValidationError,
  BusinessError,
  PurchaseError,
  DatabaseError,
  DATABASE_CODES,
  wrapMysqlError,
}
