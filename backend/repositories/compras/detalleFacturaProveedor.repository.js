/**
 * Repository: detalle_factura_proveedor
 * API por conjunto (parent). Sin CRUD individual público.
 */

const model = require('../../models/compras/detalleFacturaProveedor.model')
const { query } = require('../../helpers/dbExecutor')
const { insertManyEntities, deleteByParentColumn } = require('./_sql')

const { TABLE, fromRow, toInsert } = model

async function findByParentId(facturaProveedorId, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE factura_proveedor_id = ? ORDER BY linea ASC`,
    [facturaProveedorId],
    conn
  )
  return rows.map(fromRow)
}

async function insertMany(entities, conn = null) {
  return insertManyEntities(TABLE, toInsert, entities, conn)
}

async function deleteByParentId(facturaProveedorId, conn = null) {
  return deleteByParentColumn(TABLE, 'factura_proveedor_id', facturaProveedorId, conn)
}

module.exports = {
  findByParentId,
  insertMany,
  deleteByParentId,
}
