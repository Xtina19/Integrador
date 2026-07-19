/**
 * Model: Recepcion
 * Tabla: recepcion
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'recepcion'

const ESTADO = Object.freeze({
  BORRADOR: 'borrador',
  CONFIRMADA: 'confirmada',
  ANULADA: 'anulada',
})

const RESULTADO_INSPECCION = Object.freeze({
  ACEPTADA: 'aceptada',
  PARCIALMENTE_ACEPTADA: 'parcialmente_aceptada',
  RECHAZADA: 'rechazada',
})

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    codigo: row.codigo,
    ordenCompraId: Number(row.orden_compra_id),
    almacenId: Number(row.almacen_id),
    fechaRecepcion: row.fecha_recepcion,
    usuarioReceptor: Number(row.usuario_receptor),
    usuarioInspector: optionalNumber(row.usuario_inspector),
    resultadoInspeccion: row.resultado_inspeccion ?? null,
    observaciones: row.observaciones ?? null,
    estado: row.estado,
    activo: activoFromRow(row.activo),
    fechaConfirmacion: row.fecha_confirmacion ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: optionalNumber(row.created_by),
    updatedBy: optionalNumber(row.updated_by),
  }
}

function toInsert(entity) {
  return {
    codigo: entity.codigo,
    orden_compra_id: entity.ordenCompraId,
    almacen_id: entity.almacenId,
    fecha_recepcion: entity.fechaRecepcion,
    usuario_receptor: entity.usuarioReceptor,
    usuario_inspector: entity.usuarioInspector ?? null,
    resultado_inspeccion: entity.resultadoInspeccion ?? null,
    observaciones: entity.observaciones ?? null,
    estado: entity.estado ?? ESTADO.BORRADOR,
    activo: activoToColumn(entity.activo),
    fecha_confirmacion: entity.fechaConfirmacion ?? null,
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.almacenId !== undefined) out.almacen_id = entity.almacenId
  if (entity.fechaRecepcion !== undefined) out.fecha_recepcion = entity.fechaRecepcion
  if (entity.usuarioReceptor !== undefined) out.usuario_receptor = entity.usuarioReceptor
  if (entity.usuarioInspector !== undefined) out.usuario_inspector = entity.usuarioInspector
  if (entity.resultadoInspeccion !== undefined) out.resultado_inspeccion = entity.resultadoInspeccion
  if (entity.observaciones !== undefined) out.observaciones = entity.observaciones
  if (entity.estado !== undefined) out.estado = entity.estado
  if (entity.activo !== undefined) out.activo = activoToColumn(entity.activo)
  if (entity.fechaConfirmacion !== undefined) out.fecha_confirmacion = entity.fechaConfirmacion
  if (entity.updatedBy !== undefined) out.updated_by = entity.updatedBy
  return out
}

module.exports = {
  TABLE,
  ESTADO,
  RESULTADO_INSPECCION,
  fromRow,
  toInsert,
  toUpdate,
}
