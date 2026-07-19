const {
  requireString,
  requireNonNegative,
  optionalEnum,
  fail,
} = require('./common')
const { ESTADO } = require('../../../models/compras/condicionPago.model')

function validateCreate(input = {}) {
  const codigo = requireString(input.codigo, 'codigo', { max: 20, upper: true })
  const nombre = requireString(input.nombre, 'nombre', { max: 100 })
  const diasCredito = requireNonNegative(input.diasCredito ?? 0, 'diasCredito')
  const estado = optionalEnum(input.estado, 'estado', Object.values(ESTADO))
  return {
    codigo,
    nombre,
    diasCredito,
    estado,
    activo: input.activo !== false && input.activo !== 0,
  }
}

function validateUpdate(input = {}) {
  const out = {}
  if (input.codigo !== undefined) {
    out.codigo = requireString(input.codigo, 'codigo', { max: 20, upper: true })
  }
  if (input.nombre !== undefined) {
    out.nombre = requireString(input.nombre, 'nombre', { max: 100 })
  }
  if (input.diasCredito !== undefined) {
    out.diasCredito = requireNonNegative(input.diasCredito, 'diasCredito')
  }
  if (input.estado !== undefined) {
    out.estado = optionalEnum(input.estado, 'estado', Object.values(ESTADO))
  }
  if (input.activo !== undefined) {
    out.activo = !(input.activo === false || input.activo === 0)
  }
  if (!Object.keys(out).length) {
    fail('VALIDATION_REQUIRED_FIELD', 'No hay campos para actualizar', { field: 'body' })
  }
  return out
}

module.exports = {
  validateCreate,
  validateUpdate,
}
