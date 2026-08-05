/**
 * Model: OrdenCompra
 * Tabla: orden_compra
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const { activoFromRow, activoToColumn, optionalNumber } = require('./_map')

const TABLE = 'orden_compra'

const TIPO_COMPRA = Object.freeze({
  NACIONAL: 'nacional',
  INTERNACIONAL: 'internacional',
})

const ESTADO = Object.freeze({
  BORRADOR: 'borrador',
  PENDIENTE_APROBACION: 'pendiente_aprobacion',
  APROBADA: 'aprobada',
  PARCIALMENTE_RECIBIDA: 'parcialmente_recibida',
  RECIBIDA: 'recibida',
  CERRADA: 'cerrada',
  CANCELADA: 'cancelada',
})

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    codigo: row.codigo,
    proveedorId: Number(row.proveedor_id),
    sucursalId: optionalNumber(row.sucursal_id),
    monedaId: Number(row.moneda_id),
    tasaCambio: Number(row.tasa_cambio),
    condicionPagoId: Number(row.condicion_pago_id),
    tipoCompra: row.tipo_compra,
    fechaOrden: row.fecha_orden,
    fechaEntregaEstimada: row.fecha_entrega_estimada ?? null,
    subtotal: Number(row.subtotal),
    descuento: Number(row.descuento),
    impuestos: Number(row.impuestos),
    total: Number(row.total),
    estado: row.estado,
    activo: activoFromRow(row.activo),
    observaciones: row.observaciones ?? null,
    fechaAprobacion: row.fecha_aprobacion ?? null,
    aprobadoPor: optionalNumber(row.aprobado_por),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: optionalNumber(row.created_by),
    updatedBy: optionalNumber(row.updated_by),
  }
}

function toInsert(entity) {
  return {
    codigo: entity.codigo,
    proveedor_id: entity.proveedorId,
    sucursal_id: entity.sucursalId ?? null,
    moneda_id: entity.monedaId,
    tasa_cambio: entity.tasaCambio ?? 1,
    condicion_pago_id: entity.condicionPagoId,
    tipo_compra: entity.tipoCompra ?? TIPO_COMPRA.NACIONAL,
    fecha_orden: entity.fechaOrden,
    fecha_entrega_estimada: entity.fechaEntregaEstimada ?? null,
    subtotal: entity.subtotal ?? 0,
    descuento: entity.descuento ?? 0,
    impuestos: entity.impuestos ?? 0,
    total: entity.total ?? 0,
    estado: entity.estado ?? ESTADO.BORRADOR,
    activo: activoToColumn(entity.activo),
    observaciones: entity.observaciones ?? null,
    fecha_aprobacion: entity.fechaAprobacion ?? null,
    aprobado_por: entity.aprobadoPor ?? null,
    created_by: entity.createdBy ?? null,
    updated_by: entity.updatedBy ?? null,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.proveedorId !== undefined) out.proveedor_id = entity.proveedorId
  if (entity.sucursalId !== undefined) out.sucursal_id = entity.sucursalId
  if (entity.monedaId !== undefined) out.moneda_id = entity.monedaId
  if (entity.tasaCambio !== undefined) out.tasa_cambio = entity.tasaCambio
  if (entity.condicionPagoId !== undefined) out.condicion_pago_id = entity.condicionPagoId
  if (entity.tipoCompra !== undefined) out.tipo_compra = entity.tipoCompra
  if (entity.fechaOrden !== undefined) out.fecha_orden = entity.fechaOrden
  if (entity.fechaEntregaEstimada !== undefined) out.fecha_entrega_estimada = entity.fechaEntregaEstimada
  if (entity.subtotal !== undefined) out.subtotal = entity.subtotal
  if (entity.descuento !== undefined) out.descuento = entity.descuento
  if (entity.impuestos !== undefined) out.impuestos = entity.impuestos
  if (entity.total !== undefined) out.total = entity.total
  if (entity.estado !== undefined) out.estado = entity.estado
  if (entity.activo !== undefined) out.activo = activoToColumn(entity.activo)
  if (entity.observaciones !== undefined) out.observaciones = entity.observaciones
  if (entity.fechaAprobacion !== undefined) out.fecha_aprobacion = entity.fechaAprobacion
  if (entity.aprobadoPor !== undefined) out.aprobado_por = entity.aprobadoPor
  if (entity.updatedBy !== undefined) out.updated_by = entity.updatedBy
  return out
}

module.exports = {
  TABLE,
  TIPO_COMPRA,
  ESTADO,
  fromRow,
  toInsert,
  toUpdate,
}
