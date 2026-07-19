/**
 * Reexporta DatabaseError de infraestructura (helpers).
 * Misma clase usada por repositories/compras.
 */

const { DatabaseError, DATABASE_CODES, wrapMysqlError } = require('../helpers/DatabaseError')

module.exports = {
  DatabaseError,
  DATABASE_CODES,
  wrapMysqlError,
}
