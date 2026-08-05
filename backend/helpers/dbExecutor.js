/**
 * Ejecutor SQL mínimo: resuelve conn | pool y normaliza resultados.
 * Sin logs, auditoría, retries ni transacciones.
 */

const { getMysqlPool } = require('../db-mysql')
const { wrapMysqlError } = require('./DatabaseError')

/**
 * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection|null|undefined} conn
 */
function getExecutor(conn) {
  return conn || getMysqlPool()
}

/**
 * Ejecuta consulta parametrizada.
 * @returns {{ rows: any, fields: any, result: any }}
 *   - SELECT/SHOW: rows = array de filas
 *   - INSERT/UPDATE/DELETE: result = ResultSetHeader; rows = igual a result por compatibilidad
 */
async function query(sql, params = [], conn = null) {
  const executor = getExecutor(conn)
  try {
    const [rowsOrResult, fields] = await executor.query(sql, params)
    if (rowsOrResult && typeof rowsOrResult === 'object' && 'affectedRows' in rowsOrResult) {
      return { rows: rowsOrResult, result: rowsOrResult, fields }
    }
    return { rows: rowsOrResult, result: rowsOrResult, fields }
  } catch (err) {
    throw wrapMysqlError(err)
  }
}

module.exports = {
  getExecutor,
  query,
}
