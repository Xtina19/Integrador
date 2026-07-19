const { getMysqlPool } = require('../db-mysql')

function mapRow(row) {
  if (!row) return null
  return {
    id: String(row.id),
    code: row.codigo,
    name: row.nombre,
    symbol: row.simbolo,
    isDefault: Boolean(row.es_principal),
    status: row.estado === 'activa' ? 'active' : 'inactive',
  }
}

async function findAll() {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT id, codigo, nombre, simbolo, es_principal, estado
     FROM monedas ORDER BY es_principal DESC, codigo ASC`
  )
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT id, codigo, nombre, simbolo, es_principal, estado FROM monedas WHERE id = ?`,
    [id]
  )
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT id, es_principal, estado FROM monedas WHERE id = ?`, [id])
  return rows[0] || null
}

async function countTasaRefs(id) {
  const pool = getMysqlPool()
  const [refs] = await pool.query(
    `SELECT COUNT(*) AS n FROM tasas_cambio WHERE moneda_origen_id = ? OR moneda_destino_id = ?`,
    [id, id]
  )
  return Number(refs[0]?.n || 0)
}

async function insert(data) {
  const pool = getMysqlPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    if (data.isDefault) {
      await conn.query(`UPDATE monedas SET es_principal = 0 WHERE es_principal = 1`)
    }
    const [result] = await conn.query(
      `INSERT INTO monedas (codigo, nombre, simbolo, es_principal, estado) VALUES (?, ?, ?, ?, ?)`,
      [data.code, data.name, data.symbol, data.isDefault ? 1 : 0, data.estado]
    )
    await conn.commit()
    return result.insertId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

async function update(id, data) {
  const pool = getMysqlPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [existingRows] = await conn.query(`SELECT id, es_principal, estado FROM monedas WHERE id = ?`, [id])
    const existing = existingRows[0]
    if (!existing) {
      await conn.rollback()
      return null
    }
    const esPrincipal = data.hasDefault ? (data.isDefault ? 1 : 0) : Number(existing.es_principal)
    const estado = data.hasStatus ? data.estado : existing.estado
    if (esPrincipal === 1) {
      await conn.query(`UPDATE monedas SET es_principal = 0 WHERE es_principal = 1 AND id <> ?`, [id])
    }
    await conn.query(
      `UPDATE monedas SET codigo = ?, nombre = ?, simbolo = ?, es_principal = ?, estado = ? WHERE id = ?`,
      [data.code, data.name, data.symbol, esPrincipal, estado, id]
    )
    await conn.commit()
    return findById(id)
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [result] = await pool.query(`UPDATE monedas SET estado = ? WHERE id = ?`, [estado, id])
  if (!result.affectedRows) return null
  return findById(id)
}

async function remove(id) {
  const pool = getMysqlPool()
  const [result] = await pool.query(`DELETE FROM monedas WHERE id = ?`, [id])
  return result.affectedRows > 0
}

module.exports = { mapRow, findAll, findById, findRawById, countTasaRefs, insert, update, updateEstado, remove }
