const {
  requireId,
  requireDate,
  optionalId,
  requireEnum,
  requirePositive,
  requireNonNegative,
  optionalNonNegative,
  assertArrayNonEmpty,
  fail,
} = require('./common')
const { RESULTADO_INSPECCION } = require('../../../models/compras/recepcion.model')

function validateLines(linesInput) {
  const lines = assertArrayNonEmpty(linesInput, 'lineas')
  const seen = new Set()
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] || {}
    const detalleOrdenCompraId = requireId(
      raw.detalleOrdenCompraId,
      `lineas[${i}].detalleOrdenCompraId`
    )
    if (seen.has(detalleOrdenCompraId)) {
      fail('VALIDATION_REQUIRED_FIELD', 'Línea de OC duplicada en la recepción', {
        field: 'lineas',
        reason: 'duplicate_detalle_orden',
        detalleOrdenCompraId,
        index: i,
      })
    }
    seen.add(detalleOrdenCompraId)
    out.push({
      detalleOrdenCompraId,
      productoId: raw.productoId != null ? requireId(raw.productoId, `lineas[${i}].productoId`) : undefined,
      cantidadRecibida: requirePositive(raw.cantidadRecibida, `lineas[${i}].cantidadRecibida`),
      costoUnitario:
        raw.costoUnitario !== undefined
          ? requireNonNegative(raw.costoUnitario, `lineas[${i}].costoUnitario`)
          : undefined,
    })
  }
  return out
}

function validateCreate(input = {}) {
  const ordenCompraId = requireId(input.ordenCompraId, 'ordenCompraId')
  const almacenId = requireId(input.almacenId, 'almacenId')
  const fechaRecepcion = requireDate(input.fechaRecepcion, 'fechaRecepcion')
  const usuarioReceptor = requireId(input.usuarioReceptor, 'usuarioReceptor')
  return {
    ordenCompraId,
    almacenId,
    fechaRecepcion,
    usuarioReceptor,
    usuarioInspector: optionalId(input.usuarioInspector, 'usuarioInspector'),
    observaciones: input.observaciones != null ? String(input.observaciones) : null,
    lineas: validateLines(input.lineas || input.detalles),
  }
}

function validateUpdate(input = {}) {
  const out = {}
  if (input.almacenId !== undefined) out.almacenId = requireId(input.almacenId, 'almacenId')
  if (input.fechaRecepcion !== undefined) {
    out.fechaRecepcion = requireDate(input.fechaRecepcion, 'fechaRecepcion')
  }
  if (input.usuarioReceptor !== undefined) {
    out.usuarioReceptor = requireId(input.usuarioReceptor, 'usuarioReceptor')
  }
  if (input.usuarioInspector !== undefined) {
    out.usuarioInspector = optionalId(input.usuarioInspector, 'usuarioInspector')
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

function validateConfirm(input = {}) {
  return {
    resultadoInspeccion: requireEnum(
      input.resultadoInspeccion,
      'resultadoInspeccion',
      Object.values(RESULTADO_INSPECCION)
    ),
    usuarioInspector: optionalId(input.usuarioInspector, 'usuarioInspector'),
    observaciones:
      input.observaciones !== undefined
        ? input.observaciones == null
          ? null
          : String(input.observaciones)
        : undefined,
  }
}

module.exports = {
  validateCreate,
  validateUpdate,
  validateConfirm,
  validateLines,
}
