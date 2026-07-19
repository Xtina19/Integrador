/**
 * Helpers de validación de dominio (sin Express).
 */

const { ValidationError } = require('../../../errors')

function fail(code, developerMessage, details = {}, message) {
  const userMessages = {
    VALIDATION_REQUIRED_FIELD: 'Complete los campos obligatorios.',
    VALIDATION_INVALID_FORMAT: 'El formato de uno de los datos no es válido.',
    VALIDATION_INVALID_RANGE: 'Hay un valor fuera del rango permitido.',
    VALIDATION_EMPTY_LINES: 'Debe agregar al menos una línea.',
    VALIDATION_QUERY_INVALID: 'Los filtros de búsqueda no son válidos.',
    VALIDATION_FAILED: 'Revise los datos enviados.',
  }
  throw new ValidationError(code, {
    message: message || userMessages[code] || userMessages.VALIDATION_FAILED,
    developerMessage,
    details,
  })
}

function requireDefined(value, field) {
  if (value === undefined || value === null || value === '') {
    fail('VALIDATION_REQUIRED_FIELD', `Campo obligatorio ausente: ${field}`, { field })
  }
  return value
}

function requireString(value, field, { min = 1, max = 500, upper = false } = {}) {
  requireDefined(value, field)
  if (typeof value !== 'string' && typeof value !== 'number') {
    fail('VALIDATION_INVALID_FORMAT', `${field} debe ser texto`, { field })
  }
  let s = String(value).trim()
  if (upper) s = s.toUpperCase()
  if (s.length < min) {
    fail('VALIDATION_REQUIRED_FIELD', `${field} vacío`, { field })
  }
  if (s.length > max) {
    fail('VALIDATION_INVALID_RANGE', `${field} excede longitud máxima ${max}`, { field, max })
  }
  return s
}

function requireId(value, field) {
  requireDefined(value, field)
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) {
    fail('VALIDATION_INVALID_FORMAT', `${field} debe ser un id numérico positivo`, { field })
  }
  return n
}

function optionalId(value, field) {
  if (value === undefined || value === null || value === '') return null
  return requireId(value, field)
}

function requireDate(value, field) {
  requireDefined(value, field)
  const s = String(value).trim()
  if (!/^\d{4}-\d{2}-\d{2}/.test(s) && Number.isNaN(Date.parse(s))) {
    fail('VALIDATION_INVALID_FORMAT', `${field} debe ser una fecha válida`, { field })
  }
  return s.length >= 10 ? s.slice(0, 10) : s
}

function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return null
  return requireDate(value, field)
}

function requireEnum(value, field, allowed) {
  requireDefined(value, field)
  if (!allowed.includes(value)) {
    fail('VALIDATION_INVALID_FORMAT', `${field} no es un valor permitido`, {
      field,
      allowed,
      value,
    })
  }
  return value
}

function optionalEnum(value, field, allowed) {
  if (value === undefined || value === null || value === '') return undefined
  return requireEnum(value, field, allowed)
}

function requireNonNegative(value, field) {
  requireDefined(value, field)
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    fail('VALIDATION_INVALID_RANGE', `${field} debe ser >= 0`, { field })
  }
  return n
}

function requirePositive(value, field) {
  requireDefined(value, field)
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) {
    fail('VALIDATION_INVALID_RANGE', `${field} debe ser > 0`, { field })
  }
  return n
}

function optionalNonNegative(value, field, defaultValue = 0) {
  if (value === undefined || value === null || value === '') return defaultValue
  return requireNonNegative(value, field)
}

function assertArrayNonEmpty(value, field = 'lineas') {
  if (!Array.isArray(value) || value.length === 0) {
    fail('VALIDATION_EMPTY_LINES', `Se requiere al menos un elemento en ${field}`, { field })
  }
  return value
}

module.exports = {
  fail,
  requireDefined,
  requireString,
  requireId,
  optionalId,
  requireDate,
  optionalDate,
  requireEnum,
  optionalEnum,
  requireNonNegative,
  requirePositive,
  optionalNonNegative,
  assertArrayNonEmpty,
}
