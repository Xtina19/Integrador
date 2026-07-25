/**
 * Pool SQL Server (mssql) — módulo Editoriales y utilidades compartidas.
 * Usa las mismas variables que backend/db.js (DB_SERVER, DB_USER, …).
 */
const { sql, getConnection } = require('../db')

async function getSqlPool() {
  const pool = await getConnection()
  if (!pool) {
    const err = new Error('No se pudo conectar a SQL Server')
    err.status = 503
    throw err
  }
  return pool
}

/**
 * Ejecuta un stored procedure y devuelve resultsets.
 * No usa SQL dinámico: solo nombre de SP fijo + parámetros tipados.
 */
async function execProc(procName, bindInputs) {
  const pool = await getSqlPool()
  const req = pool.request()
  if (typeof bindInputs === 'function') {
    bindInputs(req, sql)
  }
  return req.execute(procName)
}

module.exports = { sql, getSqlPool, execProc }
