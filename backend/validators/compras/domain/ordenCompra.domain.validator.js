const {
  requireId,
  requireDate,
  optionalDate,
  requireEnum,
  optionalEnum,
  requirePositive,
  requireNonNegative,
  optionalNonNegative,
  optionalId,
  assertArrayNonEmpty,
  fail,
} = require('./common')
const { TIPO_COMPRA, ESTADO } = require('../../../models/compras/ordenCompra.model')

function validateLines(linesInput) {
  const lines = assertArrayNonEmpty(linesInput, 'lineas')
  const seen = new Set()
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] || {}
    const productoId = requireId(raw.productoId, `lineas[${i}].productoId`)
    if (seen.has(productoId)) {
      fail('VALIDATION_REQUIRED_FIELD', 'Producto duplicado en líneas de la orden', {
        field: 'lineas',
        reason: 'duplicate_product',
        productoId,
        index: i,
      })
    }
    seen.add(productoId)
    out.push({
      productoId,
      cantidadSolicitada: requirePositive(
        raw.cantidadSolicitada ?? raw.cantidad,
        `lineas[${i}].cantidadSolicitada`
      ),
      costoUnitario: requireNonNegative(raw.costoUnitario, `lineas[${i}].costoUnitario`),
      descuento: optionalNonNegative(raw.descuento, `lineas[${i}].descuento`, 0),
      impuesto: optionalNonNegative(raw.impuesto, `lineas[${i}].impuesto`, 0),
    })
  }
  return out
}

function validateCreate(input = {}) {
  const proveedorId = requireId(input.proveedorId, 'proveedorId')
  const monedaId = requireId(input.monedaId, 'monedaId')
  const condicionPagoId = requireId(input.condicionPagoId, 'condicionPagoId')
  const fechaOrden = requireDate(input.fechaOrden, 'fechaOrden')
  const lineas = validateLines(input.lineas || input.detalles)
  const estado = optionalEnum(input.estado, 'estado', [
    ESTADO.BORRADOR,
    ESTADO.PENDIENTE_APROBACION,
  ])
  return {
    proveedorId,
    sucursalId: optionalId(input.sucursalId, 'sucursalId'),
    monedaId,
    // Si no viene, el service resuelve desde tasas_cambio (no asumir 1)
    tasaCambio:
      input.tasaCambio !== undefined && input.tasaCambio !== null && input.tasaCambio !== ''
        ? requirePositive(input.tasaCambio, 'tasaCambio')
        : undefined,
    condicionPagoId,
    tipoCompra: requireEnum(
      input.tipoCompra || TIPO_COMPRA.NACIONAL,
      'tipoCompra',
      Object.values(TIPO_COMPRA)
    ),
    fechaOrden,
    fechaEntregaEstimada: optionalDate(input.fechaEntregaEstimada, 'fechaEntregaEstimada'),
    observaciones: input.observaciones != null ? String(input.observaciones) : null,
    estado,
    lineas,
  }
}

function validateUpdate(input = {}) {
  const out = {}
  if (input.proveedorId !== undefined) out.proveedorId = requireId(input.proveedorId, 'proveedorId')
  if (input.sucursalId !== undefined) out.sucursalId = optionalId(input.sucursalId, 'sucursalId')
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
  if (input.tipoCompra !== undefined) {
    out.tipoCompra = requireEnum(input.tipoCompra, 'tipoCompra', Object.values(TIPO_COMPRA))
  }
  if (input.fechaOrden !== undefined) out.fechaOrden = requireDate(input.fechaOrden, 'fechaOrden')
  if (input.fechaEntregaEstimada !== undefined) {
    out.fechaEntregaEstimada = optionalDate(input.fechaEntregaEstimada, 'fechaEntregaEstimada')
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
  validateCreate,
  validateUpdate,
  validateLines,
}
