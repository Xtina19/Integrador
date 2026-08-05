/**
 * Repository: factura_proveedor (cabecera)
 * Persistencia. Sin reglas de negocio (nacional / 1:1 las aplica el Service).
 */

const model = require('../../models/compras/facturaProveedor.model')
const { query } = require('../../helpers/dbExecutor')
const {
  likeParam,
  composeWhere,
  activoClause,
  findByIdRow,
  countWithWhere,
  findPageWithWhere,
  insertEntity,
  updateEntity,
} = require('./_sql')

const { TABLE, fromRow, toInsert, toUpdate } = model

function buildWhere(filters = {}) {
  return composeWhere(filters, [
    {
      key: 'q',
      sql: '(codigo LIKE ? OR numero_factura LIKE ?)',
      params: (f) => {
        const p = likeParam(f.q)
        return [p, p]
      },
    },
    {
      key: 'estado',
      sql: 'estado = ?',
      params: (f) => [f.estado],
    },
    {
      key: 'estadoPago',
      sql: 'estado_pago = ?',
      params: (f) => [f.estadoPago],
    },
    {
      key: 'proveedorId',
      sql: 'proveedor_id = ?',
      params: (f) => [f.proveedorId],
    },
    {
      key: 'ordenCompraId',
      sql: 'orden_compra_id = ?',
      params: (f) => [f.ordenCompraId],
    },
    activoClause(),
  ])
}

async function findById(id, conn = null) {
  return findByIdRow(TABLE, fromRow, id, conn)
}

async function findByOrdenCompraId(ordenCompraId, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE orden_compra_id = ? LIMIT 1`,
    [ordenCompraId],
    conn
  )
  return rows.length ? fromRow(rows[0]) : null
}

async function count(filters = {}, conn = null) {
  const { wh, params } = buildWhere(filters)
  return countWithWhere(TABLE, wh, params, conn)
}

async function findPage({ filters = {}, pageSize = 50, offset = 0 } = {}, conn = null) {
  const { wh, params } = buildWhere(filters)
  return findPageWithWhere(
    TABLE,
    fromRow,
    { wh, params, orderBy: 'fecha_emision DESC, id DESC', pageSize, offset },
    conn
  )
}

async function insert(entity, conn = null) {
  return insertEntity(TABLE, toInsert, entity, conn)
}

async function update(id, patch, conn = null) {
  return updateEntity(TABLE, toUpdate, id, patch, conn)
}

async function updateEstado(id, estado, extra = {}, conn = null) {
  const patch = { estado }
  if (extra.updatedBy !== undefined) patch.updated_by = extra.updatedBy
  const sets = Object.keys(patch)
    .map((c) => `${c} = ?`)
    .join(', ')
  const params = [...Object.values(patch), id]
  const { result } = await query(`UPDATE ${TABLE} SET ${sets} WHERE id = ?`, params, conn)
  return result.affectedRows > 0
}

module.exports = {
  findById,
  findByOrdenCompraId,
  count,
  findPage,
  insert,
  update,
  updateEstado,
}
