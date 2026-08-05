/**
 * Repository: recepcion (cabecera)
 * Persistencia. Sin reglas de negocio ni Inventory Engine.
 */

const model = require('../../models/compras/recepcion.model')
const { query } = require('../../helpers/dbExecutor')
const {
  buildUpdate,
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
      sql: 'codigo LIKE ?',
      params: (f) => [likeParam(f.q)],
    },
    {
      key: 'estado',
      sql: 'estado = ?',
      params: (f) => [f.estado],
    },
    {
      key: 'ordenCompraId',
      sql: 'orden_compra_id = ?',
      params: (f) => [f.ordenCompraId],
    },
    {
      key: 'fechaDesde',
      sql: 'fecha_recepcion >= ?',
      params: (f) => [f.fechaDesde],
    },
    {
      key: 'fechaHasta',
      sql: 'fecha_recepcion <= ?',
      params: (f) => [f.fechaHasta],
    },
    activoClause(),
  ])
}

async function findById(id, conn = null) {
  return findByIdRow(TABLE, fromRow, id, conn)
}

async function findByOrdenCompraId(ordenCompraId, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE orden_compra_id = ? ORDER BY fecha_recepcion DESC, id DESC`,
    [ordenCompraId],
    conn
  )
  return rows.map(fromRow)
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
    { wh, params, orderBy: 'fecha_recepcion DESC, id DESC', pageSize, offset },
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
  const patch = toUpdate({
    estado,
    fechaConfirmacion: extra.fechaConfirmacion,
    resultadoInspeccion: extra.resultadoInspeccion,
    updatedBy: extra.updatedBy,
  })
  patch.estado = estado
  const upd = buildUpdate(TABLE, patch, id)
  const { result } = await query(upd.sql, upd.params, conn)
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
