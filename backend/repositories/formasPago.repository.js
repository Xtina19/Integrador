const { getMysqlPool } = require('../db-mysql')

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    status: r.estado === 'activa' ? 'active' : 'inactive',
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM formas_pago ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM formas_pago ${where} ORDER BY nombre LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM formas_pago WHERE id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM formas_pago WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(`INSERT INTO formas_pago (codigo, nombre, estado) VALUES (?,?,?)`, [
    fields.code,
    fields.name,
    fields.estado,
  ])
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(`UPDATE formas_pago SET codigo=?, nombre=?, estado=? WHERE id=?`, [
    fields.code,
    fields.name,
    fields.estado,
    id,
  ])
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE formas_pago SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
