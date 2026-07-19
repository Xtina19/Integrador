const { getMysqlPool } = require('../db-mysql')
const { toFeStatus } = require('../lib/statusHelpers')

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    description: r.descripcion || '',
    status: toFeStatus(r.estado),
    users: Number(r.users_count || 0),
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM roles ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT r.*, (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS users_count
     FROM roles r ${where} ORDER BY r.nombre LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT r.*, (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS users_count FROM roles r WHERE r.id = ?`,
    [id]
  )
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM roles WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(`INSERT INTO roles (codigo, nombre, descripcion, estado) VALUES (?,?,?,?)`, [
    fields.code,
    fields.name,
    fields.description,
    fields.estado,
  ])
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(`UPDATE roles SET codigo=?, nombre=?, descripcion=?, estado=? WHERE id=?`, [
    fields.code,
    fields.name,
    fields.description,
    fields.estado,
    id,
  ])
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE roles SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
