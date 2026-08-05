/**
 * Repository: detalle_orden_compra
 * API por conjunto (parent). Sin CRUD individual público.
 */

const model = require('../../models/compras/detalleOrdenCompra.model')
const { query } = require('../../helpers/dbExecutor')
const { insertManyEntities, deleteByParentColumn } = require('./_sql')

const { TABLE, fromRow, toInsert } = model

async function findByParentId(ordenCompraId, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE orden_compra_id = ? ORDER BY linea ASC`,
    [ordenCompraId],
    conn
  )
  return rows.map(fromRow)
}

async function insertMany(entities, conn = null) {
  return insertManyEntities(TABLE, toInsert, entities, conn)
}

async function deleteByParentId(ordenCompraId, conn = null) {
  return deleteByParentColumn(TABLE, 'orden_compra_id', ordenCompraId, conn)
}

module.exports = {
  findByParentId,
  insertMany,
  deleteByParentId,
}
