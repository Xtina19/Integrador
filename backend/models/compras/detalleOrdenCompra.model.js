/**
 * Model: DetalleOrdenCompra
 * Tabla: detalle_orden_compra
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'detalle_orden_compra'

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    ordenCompraId: Number(row.orden_compra_id),
    linea: Number(row.linea),
    productoId: Number(row.producto_id),
    cantidadSolicitada: Number(row.cantidad_solicitada),
    costoUnitario: Number(row.costo_unitario),
    descuento: Number(row.descuento),
    impuesto: Number(row.impuesto),
    subtotal: Number(row.subtotal),
    activo: activoFromRow(row.activo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: optionalNumber(row.created_by),
    updatedBy: optionalNumber(row.updated_by),
  }
}

function toInsert(entity) {
  return {
    orden_compra_id: entity.ordenCompraId,
    linea: entity.linea,
    producto_id: entity.productoId,
    cantidad_solicitada: entity.cantidadSolicitada,
    costo_unitario: entity.costoUnitario,
    descuento: entity.descuento ?? 0,
    impuesto: entity.impuesto ?? 0,
    subtotal: entity.subtotal,
    activo: activoToColumn(entity.activo),
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.linea !== undefined) out.linea = entity.linea
  if (entity.productoId !== undefined) out.producto_id = entity.productoId
  if (entity.cantidadSolicitada !== undefined) out.cantidad_solicitada = entity.cantidadSolicitada
  if (entity.costoUnitario !== undefined) out.costo_unitario = entity.costoUnitario
  if (entity.descuento !== undefined) out.descuento = entity.descuento
  if (entity.impuesto !== undefined) out.impuesto = entity.impuesto
  if (entity.subtotal !== undefined) out.subtotal = entity.subtotal
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
