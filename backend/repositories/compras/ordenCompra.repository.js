/**
 * Repository: orden_compra (cabecera)
 * Persistencia. Sin transiciones de negocio ni validaciones.
 */

const model = require('../../models/compras/ordenCompra.model')
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
      key: 'proveedorId',
      sql: 'proveedor_id = ?',
      params: (f) => [f.proveedorId],
    },
    {
      key: 'tipoCompra',
      sql: 'tipo_compra = ?',
      params: (f) => [f.tipoCompra],
    },
    {
      key: 'fechaDesde',
      sql: 'fecha_orden >= ?',
      params: (f) => [f.fechaDesde],
    },
    {
      key: 'fechaHasta',
      sql: 'fecha_orden <= ?',
      params: (f) => [f.fechaHasta],
    },
    activoClause(),
  ])
}

async function findById(id, conn = null) {
  return findByIdRow(TABLE, fromRow, id, conn)
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
    { wh, params, orderBy: 'fecha_orden DESC, id DESC', pageSize, offset },
    conn
  )
}

async function insert(entity, conn = null) {
  return insertEntity(TABLE, toInsert, entity, conn)
}

async function update(id, patch, conn = null) {
  return updateEntity(TABLE, toUpdate, id, patch, conn)
}

/**
 * Persistencia de columnas de estado (valores ya decididos por la capa de servicio).
 * @param {object} [extra] Campos opcionales: fechaAprobacion, aprobadoPor, updatedBy
 */
async function updateEstado(id, estado, extra = {}, conn = null) {
  const patch = toUpdate({
    estado,
    fechaAprobacion: extra.fechaAprobacion,
    aprobadoPor: extra.aprobadoPor,
    updatedBy: extra.updatedBy,
  })
  patch.estado = estado
  const upd = buildUpdate(TABLE, patch, id)
  const { result } = await query(upd.sql, upd.params, conn)
  return result.affectedRows > 0
}

module.exports = {
  findById,
  count,
  findPage,
  insert,
  update,
  updateEstado,
}
