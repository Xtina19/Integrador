const {
  requireId,
  requireString,
  requireDate,
  optionalDate,
  optionalId,
  optionalEnum,
  requirePositive,
  requireNonNegative,
  optionalNonNegative,
  assertArrayNonEmpty,
  fail,
} = require('./common')
const { ESTADO_PAGO } = require('../../../models/compras/facturaProveedor.model')

function validateLines(linesInput) {
  const lines = assertArrayNonEmpty(linesInput, 'lineas')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] || {}
    out.push({
      productoId: requireId(raw.productoId, `lineas[${i}].productoId`),
      detalleOrdenCompraId: optionalId(raw.detalleOrdenCompraId, `lineas[${i}].detalleOrdenCompraId`),
      cantidad: requirePositive(raw.cantidad, `lineas[${i}].cantidad`),
      costoUnitario: requireNonNegative(raw.costoUnitario, `lineas[${i}].costoUnitario`),
      descuento: optionalNonNegative(raw.descuento, `lineas[${i}].descuento`, 0),
      impuesto: optionalNonNegative(raw.impuesto, `lineas[${i}].impuesto`, 0),
    })
  }
  return out
}

function validateRegistrar(input = {}) {
  const ordenCompraId = requireId(input.ordenCompraId, 'ordenCompraId')
  const numeroFactura = requireString(input.numeroFactura, 'numeroFactura', { max: 50 })
  const monedaId = requireId(input.monedaId, 'monedaId')
  const fechaEmision = requireDate(input.fechaEmision, 'fechaEmision')
  return {
    ordenCompraId,
    proveedorId: optionalId(input.proveedorId, 'proveedorId'),
    numeroFactura,
    ncf: input.ncf != null && input.ncf !== '' ? String(input.ncf).trim() : null,
    monedaId,
    tasaCambio:
      input.tasaCambio !== undefined && input.tasaCambio !== null && input.tasaCambio !== ''
        ? requirePositive(input.tasaCambio, 'tasaCambio')
        : undefined,
    condicionPagoId: optionalId(input.condicionPagoId, 'condicionPagoId'),
    fechaEmision,
    fechaRecepcionDocumento: optionalDate(input.fechaRecepcionDocumento, 'fechaRecepcionDocumento'),
    fechaVencimiento: optionalDate(input.fechaVencimiento, 'fechaVencimiento'),
    estadoPago: optionalEnum(input.estadoPago, 'estadoPago', Object.values(ESTADO_PAGO)),
    observaciones: input.observaciones != null ? String(input.observaciones) : null,
    lineas: validateLines(input.lineas || input.detalles),
  }
}

function validateUpdate(input = {}) {
  const out = {}
  if (input.numeroFactura !== undefined) {
    out.numeroFactura = requireString(input.numeroFactura, 'numeroFactura', { max: 50 })
  }
  if (input.ncf !== undefined) {
    out.ncf = input.ncf == null || input.ncf === '' ? null : String(input.ncf).trim()
  }
  if (input.monedaId !== undefined) out.monedaId = requireId(input.monedaId, 'monedaId')
  if (input.tasaCambio !== undefined) {
    const t = requireNonNegative(input.tasaCambio, 'tasaCambio')
    if (t <= 0) {
      fail('VALIDATION_INVALID_RANGE', 'tasaCambio debe ser > 0', { field: 'tasaCambio' })
    }
    out.tasaCambio = t
  }
  if (input.condicionPagoId !== undefined) {
    out.condicionPagoId = requireId(input.condicionPagoId, 'condicionPagoId')
  }
  if (input.fechaEmision !== undefined) {
    out.fechaEmision = requireDate(input.fechaEmision, 'fechaEmision')
  }
  if (input.fechaRecepcionDocumento !== undefined) {
    out.fechaRecepcionDocumento = optionalDate(
      input.fechaRecepcionDocumento,
      'fechaRecepcionDocumento'
    )
  }
  if (input.fechaVencimiento !== undefined) {
    out.fechaVencimiento = optionalDate(input.fechaVencimiento, 'fechaVencimiento')
  }
  if (input.estadoPago !== undefined) {
    out.estadoPago = optionalEnum(input.estadoPago, 'estadoPago', Object.values(ESTADO_PAGO))
  }
  if (input.observaciones !== undefined) {
    out.observaciones = input.observaciones == null ? null : String(input.observaciones)
  }
  if (input.lineas !== undefined || input.detalles !== undefined) {
    out.lineas = validateLines(input.lineas || input.detalles)
  }
  if (!Object.keys(out).length) {
    fail('VALIDATION_REQUIRED_FIELD', 'No hay campos para actualizar', { field: 'body' })
  }
  return out
}

module.exports = {
  validateRegistrar,
  validateUpdate,
  validateLines,
}
