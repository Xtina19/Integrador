const { getMysqlPool } = require('../db-mysql')
const { toFeStatus } = require('../lib/statusHelpers')

const SELECT = `
  SELECT a.*, s.nombre AS sucursal_nombre, s.direccion AS sucursal_direccion,
         s.ciudad AS sucursal_ciudad, s.telefono AS sucursal_telefono
  FROM almacenes a
  LEFT JOIN sucursales s ON s.id = a.sucursal_id`

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    type: r.tipo,
    capacity: r.capacidad != null ? Number(r.capacidad) : null,
    branchId: r.sucursal_id != null ? String(r.sucursal_id) : '',
    branchName: r.sucursal_nombre || '',
    status: toFeStatus(r.estado),
    address: r.sucursal_direccion || '',
    city: r.sucursal_ciudad || '',
    phone: r.sucursal_telefono || '',
    manager: '',
    inventory: 0,
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM almacenes a ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} ${where} ORDER BY a.nombre LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} WHERE a.id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM almacenes WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO almacenes (sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES (?,?,?,?,?,?)`,
    [fields.branchId, fields.code, fields.name, fields.type, fields.capacity, fields.estado]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE almacenes SET sucursal_id=?, codigo=?, nombre=?, tipo=?, capacidad=?, estado=? WHERE id=?`,
    [fields.branchId, fields.code, fields.name, fields.type, fields.capacity, fields.estado, id]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE almacenes SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
