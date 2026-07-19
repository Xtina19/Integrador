/**
 * Model: FacturaProveedor
 * Tabla: factura_proveedor
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'factura_proveedor'

const ESTADO = Object.freeze({
  REGISTRADA: 'registrada',
  CONTABILIZADA: 'contabilizada',
  ANULADA: 'anulada',
})

const ESTADO_PAGO = Object.freeze({
  PENDIENTE: 'pendiente',
  PARCIAL: 'parcial',
  PAGADA: 'pagada',
})

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    codigo: row.codigo,
    ordenCompraId: Number(row.orden_compra_id),
    proveedorId: Number(row.proveedor_id),
    numeroFactura: row.numero_factura,
    ncf: row.ncf ?? null,
    monedaId: Number(row.moneda_id),
    tasaCambio: Number(row.tasa_cambio),
    condicionPagoId: Number(row.condicion_pago_id),
    fechaEmision: row.fecha_emision,
    fechaRecepcionDocumento: row.fecha_recepcion_documento ?? null,
    fechaVencimiento: row.fecha_vencimiento ?? null,
    subtotal: Number(row.subtotal),
    descuento: Number(row.descuento),
    impuestos: Number(row.impuestos),
    total: Number(row.total),
    estado: row.estado,
    estadoPago: row.estado_pago,
    activo: activoFromRow(row.activo),
    observaciones: row.observaciones ?? null,
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
    proveedor_id: entity.proveedorId,
    numero_factura: entity.numeroFactura,
    ncf: entity.ncf ?? null,
    moneda_id: entity.monedaId,
    tasa_cambio: entity.tasaCambio ?? 1,
    condicion_pago_id: entity.condicionPagoId,
    fecha_emision: entity.fechaEmision,
    fecha_recepcion_documento: entity.fechaRecepcionDocumento ?? null,
    fecha_vencimiento: entity.fechaVencimiento ?? null,
    subtotal: entity.subtotal ?? 0,
    descuento: entity.descuento ?? 0,
    impuestos: entity.impuestos ?? 0,
    total: entity.total ?? 0,
    estado: entity.estado ?? ESTADO.REGISTRADA,
    estado_pago: entity.estadoPago ?? ESTADO_PAGO.PENDIENTE,
    activo: activoToColumn(entity.activo),
    observaciones: entity.observaciones ?? null,
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.numeroFactura !== undefined) out.numero_factura = entity.numeroFactura
  if (entity.ncf !== undefined) out.ncf = entity.ncf
  if (entity.monedaId !== undefined) out.moneda_id = entity.monedaId
  if (entity.tasaCambio !== undefined) out.tasa_cambio = entity.tasaCambio
  if (entity.condicionPagoId !== undefined) out.condicion_pago_id = entity.condicionPagoId
  if (entity.fechaEmision !== undefined) out.fecha_emision = entity.fechaEmision
  if (entity.fechaRecepcionDocumento !== undefined) {
    out.fecha_recepcion_documento = entity.fechaRecepcionDocumento
  }
  if (entity.fechaVencimiento !== undefined) out.fecha_vencimiento = entity.fechaVencimiento
  if (entity.subtotal !== undefined) out.subtotal = entity.subtotal
  if (entity.descuento !== undefined) out.descuento = entity.descuento
  if (entity.impuestos !== undefined) out.impuestos = entity.impuestos
  if (entity.total !== undefined) out.total = entity.total
  if (entity.estado !== undefined) out.estado = entity.estado
  if (entity.estadoPago !== undefined) out.estado_pago = entity.estadoPago
  if (entity.activo !== undefined) out.activo = activoToColumn(entity.activo)
  if (entity.observaciones !== undefined) out.observaciones = entity.observaciones
  if (entity.updatedBy !== undefined) out.updated_by = entity.updatedBy
  return out
}

module.exports = {
  TABLE,
  ESTADO,
  ESTADO_PAGO,
  fromRow,
  toInsert,
  toUpdate,
}
