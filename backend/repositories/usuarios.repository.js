const { getMysqlPool } = require('../db-mysql')

const SELECT = `SELECT u.*, r.nombre AS rol_nombre FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id`

function mapRow(r) {
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    lastName: r.apellido || '',
    email: r.email,
    phone: r.telefono || '',
    roleId: String(r.rol_id),
    roleName: r.rol_nombre || '',
    status: r.estado === 'activo' ? 'active' : r.estado === 'bloqueado' ? 'blocked' : 'inactive',
    lastAccess: r.ultimo_acceso,
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM usuarios u ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} ${where} ORDER BY u.nombre LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} WHERE u.id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM usuarios WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO usuarios (rol_id, codigo, nombre, apellido, email, password_hash, telefono, estado)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      fields.roleId,
      fields.code,
      fields.name,
      fields.lastName,
      fields.email,
      fields.passwordHash,
      fields.phone,
      fields.estado,
    ]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE usuarios SET rol_id=?, codigo=?, nombre=?, apellido=?, email=?, telefono=?, estado=? WHERE id=?`,
    [fields.roleId, fields.code, fields.name, fields.lastName, fields.email, fields.phone, fields.estado, id]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE usuarios SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
