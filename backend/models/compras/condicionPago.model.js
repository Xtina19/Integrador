/**
 * Model: CondicionPago
 * Tabla: condiciones_pago
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'condiciones_pago'

const ESTADO = Object.freeze({
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
})

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    codigo: row.codigo,
    nombre: row.nombre,
    diasCredito: Number(row.dias_credito),
    estado: row.estado,
    activo: activoFromRow(row.activo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: optionalNumber(row.created_by),
    updatedBy: optionalNumber(row.updated_by),
  }
}

function toInsert(entity) {
  return {
    codigo: entity.codigo,
    nombre: entity.nombre,
    dias_credito: entity.diasCredito ?? 0,
    estado: entity.estado ?? ESTADO.ACTIVO,
    activo: activoToColumn(entity.activo),
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.codigo !== undefined) out.codigo = entity.codigo
  if (entity.nombre !== undefined) out.nombre = entity.nombre
  if (entity.diasCredito !== undefined) out.dias_credito = entity.diasCredito
  if (entity.estado !== undefined) out.estado = entity.estado
  if (entity.activo !== undefined) out.activo = activoToColumn(entity.activo)
  if (entity.updatedBy !== undefined) out.updated_by = entity.updatedBy
  return out
}

module.exports = {
  TABLE,
  ESTADO,
  fromRow,
  toInsert,
  toUpdate,
}
