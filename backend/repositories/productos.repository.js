const { getMysqlPool } = require('../db-mysql')

const SELECT = `
  SELECT p.*, c.nombre AS categoria_nombre, e.nombre AS editorial_nombre,
         m.codigo AS moneda_compra_codigo
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN editoriales e ON e.id = p.editorial_id
  LEFT JOIN monedas m ON m.id = p.moneda_compra_id`

function mapRow(r) {
  const estado = r.estado === 'activo' ? 'active' : 'inactive'
  const monedaCodigo =
    r.moneda_compra_codigo ||
    (Number(r.moneda_compra_id) === 2 ? 'USD' : Number(r.moneda_compra_id) === 3 ? 'EUR' : 'DOP')
  return {
    id: String(r.id),
    code: r.codigo,
    isbn: r.isbn || '',
    barcode: r.codigo_barras || '',
    title: r.titulo,
    author: r.autor || '',
    language: r.idioma || 'es',
    originCountry: r.pais_origen || '',
    category: r.categoria_nombre || '',
    categoryId: r.categoria_id ? String(r.categoria_id) : '',
    subcategory: r.subcategoria || '',
    publisher: r.editorial_nombre || '',
    publisherId: r.editorial_id ? String(r.editorial_id) : '',
    price: Number(r.precio || 0),
    cost: Number(r.costo || 0),
    averageCost: Number(r.costo_promedio ?? r.costo ?? 0),
    weightKg: r.peso_kg != null ? Number(r.peso_kg) : null,
    dimensions: r.dimensiones || '',
    currency: monedaCodigo,
    purchaseCurrencyId: r.moneda_compra_id != null ? String(r.moneda_compra_id) : '1',
    status: estado,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function count(where, params) {
  const pool = getMysqlPool()
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM productos p ${where}`, params)
  return Number(total)
}

async function findPage({ where, params, pageSize, offset }) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} ${where} ORDER BY p.titulo LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    offset,
  ])
  return rows.map(mapRow)
}

async function findById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`${SELECT} WHERE p.id = ?`, [id])
  return rows.length ? mapRow(rows[0]) : null
}

async function findRawById(id) {
  const pool = getMysqlPool()
  const [rows] = await pool.query(`SELECT * FROM productos WHERE id = ?`, [id])
  return rows[0] || null
}

async function insert(fields) {
  const pool = getMysqlPool()
  const [result] = await pool.query(
    `INSERT INTO productos (codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      fields.code,
      fields.isbn,
      fields.title,
      fields.author,
      fields.categoryId,
      fields.publisherId,
      fields.cost,
      fields.price,
      fields.estado,
    ]
  )
  return result.insertId
}

async function update(id, fields) {
  const pool = getMysqlPool()
  await pool.query(
    `UPDATE productos SET codigo=?, isbn=?, titulo=?, autor=?, categoria_id=?, editorial_id=?, costo=?, precio=?, estado=? WHERE id=?`,
    [
      fields.code,
      fields.isbn,
      fields.title,
      fields.author,
      fields.categoryId,
      fields.publisherId,
      fields.cost,
      fields.price,
      fields.estado,
      id,
    ]
  )
}

async function updateEstado(id, estado) {
  const pool = getMysqlPool()
  const [r] = await pool.query(`UPDATE productos SET estado=? WHERE id=?`, [estado, id])
  return r.affectedRows > 0
}

module.exports = { mapRow, count, findPage, findById, findRawById, insert, update, updateEstado }
