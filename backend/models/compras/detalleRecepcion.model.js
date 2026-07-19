/**
 * Model: DetalleRecepcion
 * Tabla: detalle_recepcion
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'detalle_recepcion'

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    recepcionId: Number(row.recepcion_id),
    detalleOrdenCompraId: Number(row.detalle_orden_compra_id),
    productoId: Number(row.producto_id),
    cantidadRecibida: Number(row.cantidad_recibida),
    costoUnitario: Number(row.costo_unitario),
    activo: activoFromRow(row.activo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: optionalNumber(row.created_by),
    updatedBy: optionalNumber(row.updated_by),
  }
}

function toInsert(entity) {
  return {
    recepcion_id: entity.recepcionId,
    detalle_orden_compra_id: entity.detalleOrdenCompraId,
    producto_id: entity.productoId,
    cantidad_recibida: entity.cantidadRecibida,
    costo_unitario: entity.costoUnitario,
    activo: activoToColumn(entity.activo),
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.detalleOrdenCompraId !== undefined) out.detalle_orden_compra_id = entity.detalleOrdenCompraId
  if (entity.productoId !== undefined) out.producto_id = entity.productoId
  if (entity.cantidadRecibida !== undefined) out.cantidad_recibida = entity.cantidadRecibida
  if (entity.costoUnitario !== undefined) out.costo_unitario = entity.costoUnitario
  if (entity.activo !== undefined) out.activo = activoToColumn(entity.activo)
  if (entity.updatedBy !== undefined) out.updated_by = entity.updatedBy
  return out
}

module.exports = {
  TABLE,
  fromRow,
  toInsert,
  toUpdate,
}
