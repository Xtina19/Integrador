/**
 * Model: DetalleFacturaProveedor
 * Tabla: detalle_factura_proveedor
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'detalle_factura_proveedor'

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    facturaProveedorId: Number(row.factura_proveedor_id),
    linea: Number(row.linea),
    productoId: Number(row.producto_id),
    detalleOrdenCompraId: optionalNumber(row.detalle_orden_compra_id),
    cantidad: Number(row.cantidad),
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
    factura_proveedor_id: entity.facturaProveedorId,
    linea: entity.linea,
    producto_id: entity.productoId,
    detalle_orden_compra_id: entity.detalleOrdenCompraId ?? null,
    cantidad: entity.cantidad,
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
  if (entity.detalleOrdenCompraId !== undefined) out.detalle_orden_compra_id = entity.detalleOrdenCompraId
  if (entity.cantidad !== undefined) out.cantidad = entity.cantidad
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
