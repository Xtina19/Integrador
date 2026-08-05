const { getMysqlPool } = require('../db-mysql')
const { toFeStatus } = require('../lib/statusHelpers')

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    description: r.descripcion || '',
    status: toFeStatus(r.estado),
    productCount: Number(r.productCount || 0),
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM categorias ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id) AS productCount
     FROM categorias c ${where} ORDER BY c.nombre LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id) AS productCount
     FROM categorias c WHERE c.id = ?`,
    [id]
  )
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT id, estado FROM categorias WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert({ code, name, description, estado }) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO categorias (codigo, nombre, descripcion, estado) VALUES (?,?,?,?)`,
    [code, name, description || null, estado]
  )
  return result.insertId
}

async function update(id, { code, name, description, estado }) {
  const pool = getMysqlPool()
  await pool.query(`UPDATE categorias SET codigo=?, nombre=?, descripcion=?, estado=? WHERE id=?`, [
    code,
    name,
    description || null,
    estado,
    id,
  ])
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE categorias SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

async function findRawAfterPatch(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM categorias WHERE id = ?`, [id])
  return rows[0] || null
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado, findRawAfterPatch }
