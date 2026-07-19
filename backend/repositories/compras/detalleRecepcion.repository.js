/**
 * Repository: detalle_recepcion
 * API por conjunto (parent). Sin CRUD individual público.
 */

const model = require('../../models/compras/detalleRecepcion.model')
const { query } = require('../../helpers/dbExecutor')
const { insertManyEntities, deleteByParentColumn } = require('./_sql')

const { TABLE, fromRow, toInsert } = model

async function findByParentId(recepcionId, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE recepcion_id = ? ORDER BY id ASC`,
    [recepcionId],
    conn
  )
  return rows.map(fromRow)
}

async function insertMany(entities, conn = null) {
  return insertManyEntities(TABLE, toInsert, entities, conn)
}

async function deleteByParentId(recepcionId, conn = null) {
  return deleteByParentColumn(TABLE, 'recepcion_id', recepcionId, conn)
}

module.exports = {
  findByParentId,
  insertMany,
  deleteByParentId,
}
