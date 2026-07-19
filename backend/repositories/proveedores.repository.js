const { getMysqlPool } = require('../db-mysql')
const { toFeStatus } = require('../lib/statusHelpers')

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    contact: r.contacto || '',
    email: r.email || '',
    phone: r.telefono || '',
    country: r.pais || '',
    supplierType: r.tipo === 'internacional' ? 'Editorial' : 'Distribuidor',
    scope: r.tipo === 'internacional' ? 'international' : 'national',
    tipo: r.tipo,
    status: toFeStatus(r.estado),
    purchasesCount: 0,
    address: '',
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM proveedores ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM proveedores ${where} ORDER BY nombre LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM proveedores WHERE id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM proveedores WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO proveedores (codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES (?,?,?,?,?,?,?,?)`,
    [fields.code, fields.name, fields.contact, fields.email, fields.phone, fields.country, fields.tipo, fields.estado]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE proveedores SET codigo=?, nombre=?, contacto=?, email=?, telefono=?, pais=?, tipo=?, estado=? WHERE id=?`,
    [fields.code, fields.name, fields.contact, fields.email, fields.phone, fields.country, fields.tipo, fields.estado, id]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE proveedores SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
