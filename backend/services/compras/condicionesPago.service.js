/**
 * Service: condiciones de pago (cat?logo compartido).
 * Forma (codigo, nombre, rangos) la validan domain validators; aqu? solo negocio/persistencia.
 */

const repo = require('../../repositories/compras/condicionPago.repository')
const { ESTADO } = require('../../models/compras/condicionPago.model')
const { DatabaseError, DATABASE_CODES, PurchaseError } = require('../../errors')
const { withTransaction, audit, translateDbError } = require('./_internal')

async function list({ page = 1, pageSize = 50, q, estado, activo } = {}) {
  const filters = { q, estado, activo }
  const offset = (Math.max(1, page) - 1) * pageSize
  const [total, data] = await Promise.all([
    repo.count(filters),
    repo.findPage({ filters, pageSize, offset }),
  ])
  return { data, page, pageSize, total }
}

async function getById(id, conn = null) {
  const row = await repo.findById(id, conn)
  if (!row) {
    throw new PurchaseError('PURCHASE_CONDITION_NOT_FOUND', {
      message: 'Condici?n de pago no encontrada.',
      developerMessage: 'La condici?n de pago no existe.',
      httpStatus: 404,
    })
  }
  return row
}

async function create(input, actorUserId = null) {
  const codigo = input.codigo
  const nombre = input.nombre
  const diasCredito = Number(input.diasCredito ?? 0)

  try {
    return await withTransaction(async (conn) => {
      const id = await repo.insert(
        {
          codigo,
          nombre,
          diasCredito,
          estado: input.estado || ESTADO.ACTIVO,
          activo: input.activo !== false,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'condiciones_pago',
          entidadId: id,
          accion: 'crear',
          descripcion: `Condici?n ${codigo} creada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY) {
      throw new PurchaseError('PURCHASE_CONDITION_DUPLICATE_CODE', {
        message: 'Ya existe un registro con ese c?digo.',
        developerMessage: 'C?digo de condici?n de pago duplicado.',
        httpStatus: 409,
      })
    }
    if (err instanceof PurchaseError) throw err
    translateDbError(err)
  }
}

async function update(id, input, actorUserId = null) {
  await getById(id)
  const patch = { updatedBy: actorUserId }
  if (input.codigo !== undefined) patch.codigo = input.codigo
  if (input.nombre !== undefined) patch.nombre = input.nombre
  if (input.diasCredito !== undefined) patch.diasCredito = Number(input.diasCredito)
  if (input.estado !== undefined) patch.estado = input.estado
  if (input.activo !== undefined) patch.activo = input.activo

  try {
    return await withTransaction(async (conn) => {
      await repo.update(id, patch, conn)
      await audit(
        actorUserId,
        {
          entidad: 'condiciones_pago',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `Condici?n ${id} actualizada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY) {
      throw new PurchaseError('PURCHASE_CONDITION_DUPLICATE_CODE', {
        message: 'Ya existe un registro con ese c?digo.',
        developerMessage: 'C?digo de condici?n de pago duplicado.',
        httpStatus: 409,
      })
    }
    if (err instanceof PurchaseError) throw err
    translateDbError(err)
  }
}

async function setEstado(id, estado, actorUserId = null) {
  await getById(id)
  try {
    return await withTransaction(async (conn) => {
      await repo.updateEstado(id, estado, { updatedBy: actorUserId }, conn)
      await audit(
        actorUserId,
        {
          entidad: 'condiciones_pago',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `Condici?n ${id} estado=${estado}`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError) throw err
    translateDbError(err)
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  setEstado,
}
