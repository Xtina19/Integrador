/**
 * Repository: condiciones_pago
 * Persistencia de catálogo. Sin reglas de negocio.
 */

const model = require('../../models/compras/condicionPago.model')
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
      sql: '(codigo LIKE ? OR nombre LIKE ?)',
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
    { wh, params, orderBy: 'nombre ASC', pageSize, offset },
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
  count,
  findPage,
  insert,
  update,
  updateEstado,
}
