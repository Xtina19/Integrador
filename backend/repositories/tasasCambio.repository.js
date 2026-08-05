const { getMysqlPool } = require('../db-mysql')

const SELECT = `
  SELECT t.*, o.codigo AS origen_codigo, d.codigo AS destino_codigo,
         CONCAT(IFNULL(u.nombre,''),' ',IFNULL(u.apellido,'')) AS usuario_nombre
  FROM tasas_cambio t
  JOIN monedas o ON o.id = t.moneda_origen_id
  JOIN monedas d ON d.id = t.moneda_destino_id
  LEFT JOIN usuarios u ON u.id = t.actualizado_por_id`

function mapRow(r) {
  return {
    id: String(r.id),
    fromCurrency: r.origen_codigo,
    toCurrency: r.destino_codigo,
    fromCurrencyId: String(r.moneda_origen_id),
    toCurrencyId: String(r.moneda_destino_id),
    value: Number(r.tasa),
    date: r.vigente_desde ? String(r.vigente_desde).slice(0, 10) : '',
    vigenteHasta: r.vigente_hasta ? String(r.vigente_hasta).slice(0, 10) : null,
    updatedBy: r.usuario_nombre || '',
    notes: '',
    status: r.estado === 'inactiva' ? 'inactive' : 'active',
  }
}

async function findMonedaIdByCodigo(codigo) {
  const pool = getMysqlPool()
  const [m] = await pool.query(`SELECT id FROM monedas WHERE codigo = ?`, [String(codigo).toUpperCase()])
  return m[0]?.id || null
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tasas_cambio t
     JOIN monedas o ON o.id = t.moneda_origen_id
     JOIN monedas d ON d.id = t.moneda_destino_id ${where}`,
    params
  )
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} ${where} ORDER BY t.vigente_desde DESC LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} WHERE t.id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM tasas_cambio WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO tasas_cambio (moneda_origen_id, moneda_destino_id, tasa, vigente_desde, actualizado_por_id, estado)
     VALUES (?,?,?,?,?,?)`,
    [fields.origenId, fields.destinoId, fields.tasa, fields.vigenteDesde, fields.actualizadoPorId, fields.estado]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE tasas_cambio SET moneda_origen_id=?, moneda_destino_id=?, tasa=?, vigente_desde=?, actualizado_por_id=?, estado=? WHERE id=?`,
    [fields.origenId, fields.destinoId, fields.tasa, fields.vigenteDesde, fields.actualizadoPorId, fields.estado, id]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE tasas_cambio SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, findMonedaIdByCodigo, count, findPage, findById, findRawById, insert, update, updateEstado }
