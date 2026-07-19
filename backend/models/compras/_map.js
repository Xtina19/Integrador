/**
 * Helpers de mapeo compartidos — models Compras.
 * Solo conversión BD ↔ valor de entidad (sin reglas de negocio).
 */

function activoFromRow(value) {
  return Number(value) === 1
}

function activoToColumn(value) {
  return value === false || value === 0 ? 0 : 1
}

function optionalNumber(value) {
  return value != null ? Number(value) : null
}

module.exports = {
  activoFromRow,
  activoToColumn,
  optionalNumber,
}
