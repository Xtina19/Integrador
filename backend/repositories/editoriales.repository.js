const { getMysqlPool } = require('../db-mysql')
const { toFeStatus } = require('../lib/statusHelpers')

function mapRow(r, productCount = 0) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    country: r.pais || '',
    contact: r.contacto || r.email || '',
    phone: r.telefono || '',
    email: r.email || '',
    contractType: r.tipo_contrato || '',
    contractExpiry: r.fecha_vencimiento ? String(r.fecha_vencimiento).slice(0, 10) : '',
    status: toFeStatus(r.estado),
    productCount,
    address: '',
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM editoriales ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT e.*, (SELECT COUNT(*) FROM productos p WHERE p.editorial_id = e.id) AS productCount
     FROM editoriales e ${where} ORDER BY e.nombre LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  )
  return rows.map((r) => mapRow(r, Number(r.productCount || 0)))
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(
    `SELECT e.*, (SELECT COUNT(*) FROM productos p WHERE p.editorial_id = e.id) AS productCount
     FROM editoriales e WHERE e.id = ?`,
    [id]
  )
  return rows.length ? mapRow(rows[0], Number(rows[0].productCount || 0)) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM editoriales WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO editoriales (codigo, nombre, pais, contacto, email, telefono, tipo_contrato, fecha_vencimiento, estado)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      fields.code,
      fields.name,
      fields.country,
      fields.contact,
      fields.email,
      fields.phone,
      fields.contractType,
      fields.contractExpiry,
      fields.estado,
    ]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE editoriales SET codigo=?, nombre=?, pais=?, contacto=?, email=?, telefono=?, tipo_contrato=?, fecha_vencimiento=?, estado=? WHERE id=?`,
    [
      fields.code,
      fields.name,
      fields.country,
      fields.contact,
      fields.email,
      fields.phone,
      fields.contractType,
      fields.contractExpiry,
      fields.estado,
      id,
    ]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE editoriales SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
