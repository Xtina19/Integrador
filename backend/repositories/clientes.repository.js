const { getMysqlPool } = require('../db-mysql')

function mapRow(r) {
  return {
    id: String(r.id),
    codigo: r.codigo || r.dominio_id,
    nombre: r.nombre,
    tipo: 'persona',
    documentoTipo: 'cedula',
    documento: r.documento || '',
    telefono: r.telefono || '',
    correo: r.email || '',
    institucion: '',
    sucursalPreferidaId: '',
    estado: r.activo ? 'activo' : 'inactivo',
    observaciones: '',
    fechaAlta: r.created_at,
    creadoPor: '',
    actualizadoEn: r.updated_at,
    actualizadoPor: '',
    dominioId: r.dominio_id,
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM venta_clientes ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM venta_clientes ${where} ORDER BY nombre LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findByIdOrDominio(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM venta_clientes WHERE id = ? OR dominio_id = ?`, [id, id])
  return rows[0] || null
}

async function findById(id) {
  const row = await findByIdOrDominio(id)
  return row ? mapRow(row) : null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO venta_clientes (dominio_id, codigo, nombre, documento, email, telefono, activo)
     VALUES (?,?,?,?,?,?,?)`,
    [fields.dominioId, fields.codigo, fields.nombre, fields.documento, fields.email, fields.telefono, fields.activo]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE venta_clientes SET codigo=?, nombre=?, documento=?, email=?, telefono=?, activo=? WHERE id=?`,
    [fields.codigo, fields.nombre, fields.documento, fields.email, fields.telefono, fields.activo, id]
  )
}

async function updateActivo(id, activo) {
  const pool = getMysqlPool()
  await pool.query(`UPDATE venta_clientes SET activo=? WHERE id=?`, [activo, id])
}

module.exports = { mapRow, count, findPage, findById, findByIdOrDominio, insert, update, updateActivo }
