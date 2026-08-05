/**
 * Helpers internos de repositories Compras (SQL dinámico seguro).
 * Solo nombres de columna whitelistados desde toInsert/toUpdate del model.
 */

const { query } = require('../../helpers/dbExecutor')

function assertConn(conn, methodName) {
  if (!conn) {
    throw new Error(
      `[ComprasRepository] ${methodName} requiere una conexión transaccional (conn). No pasar pool.`
    )
  }
}

function buildInsert(table, columnValues) {
  const cols = Object.keys(columnValues)
  if (!cols.length) throw new Error(`[ComprasRepository] INSERT sin columnas en ${table}`)
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
  return { sql, params: cols.map((c) => columnValues[c]) }
}

function buildUpdate(table, columnValues, id) {
  const cols = Object.keys(columnValues)
  if (!cols.length) return null
  const sets = cols.map((c) => `${c} = ?`).join(', ')
  const sql = `UPDATE ${table} SET ${sets} WHERE id = ?`
  return { sql, params: [...cols.map((c) => columnValues[c]), id] }
}

function likeParam(q) {
  return `%${String(q).replace(/[%_]/g, '\\$&')}%`
}

function normalizeActivoFlag(activo) {
  return activo === true || activo === 1 || activo === '1' ? 1 : 0
}

function isFilterPresent(value) {
  return value !== undefined && value !== null && value !== ''
}

/**
 * Compone WHERE a partir de cláusulas declarativas (mismo SQL que antes, sin duplicar boilerplate).
 * @param {object} filters
 * @param {Array<{ key?: string, when?: (f: object) => boolean, sql: string, params?: (f: object) => any[] }>} clauses
 * @returns {{ wh: string, params: any[] }}
 */
function composeWhere(filters = {}, clauses = []) {
  const where = []
  const params = []
  for (const clause of clauses) {
    const active = clause.when ? clause.when(filters) : isFilterPresent(filters[clause.key])
    if (!active) continue
    where.push(clause.sql)
    if (typeof clause.params === 'function') {
      params.push(...clause.params(filters))
    }
  }
  return {
    wh: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  }
}

/** Cláusula estándar `activo = ?` (misma semántica en todos los repos cabecera). */
function activoClause() {
  return {
    key: 'activo',
    sql: 'activo = ?',
    params: (f) => [normalizeActivoFlag(f.activo)],
  }
}

async function findByIdRow(table, fromRow, id, conn = null) {
  const { rows } = await query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id], conn)
  return rows.length ? fromRow(rows[0]) : null
}

async function countWithWhere(table, wh, params, conn = null) {
  const { rows } = await query(`SELECT COUNT(*) AS total FROM ${table} ${wh}`, params, conn)
  return Number(rows[0].total)
}

async function findPageWithWhere(table, fromRow, { wh, params, orderBy, pageSize, offset }, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${table} ${wh} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
    conn
  )
  return rows.map(fromRow)
}

async function insertEntity(table, toInsert, entity, conn = null) {
  const { sql, params } = buildInsert(table, toInsert(entity))
  const { result } = await query(sql, params, conn)
  return result.insertId
}

async function updateEntity(table, toUpdate, id, patch, conn = null) {
  const upd = buildUpdate(table, toUpdate(patch), id)
  if (!upd) return false
  const { result } = await query(upd.sql, upd.params, conn)
  return result.affectedRows > 0
}

async function insertManyEntities(table, toInsert, entities, conn = null) {
  if (!entities || !entities.length) return []
  const ids = []
  for (const entity of entities) {
    const { sql, params } = buildInsert(table, toInsert(entity))
    const { result } = await query(sql, params, conn)
    ids.push(result.insertId)
  }
  return ids
}

async function deleteByParentColumn(table, parentColumn, parentId, conn = null) {
  const { result } = await query(`DELETE FROM ${table} WHERE ${parentColumn} = ?`, [parentId], conn)
  return result.affectedRows
}

module.exports = {
  assertConn,
  buildInsert,
  buildUpdate,
  likeParam,
  normalizeActivoFlag,
  isFilterPresent,
  composeWhere,
  activoClause,
  findByIdRow,
  countWithWhere,
  findPageWithWhere,
  insertEntity,
  updateEntity,
  insertManyEntities,
  deleteByParentColumn,
}
