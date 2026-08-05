/**
 * Mapeo de estados UI ↔ MySQL (activo/activa).
 */
function toEstadoActivo(raw) {
  if (raw === 'active' || raw === 'activo' || raw === 'activa' || raw === true || raw === 1 || raw === '1') {
    return 'activo'
  }
  if (raw === 'inactive' || raw === 'inactivo' || raw === 'inactiva' || raw === false || raw === 0 || raw === '0') {
    return 'inactivo'
  }
  return null
}

function toEstadoActiva(raw) {
  if (raw === 'active' || raw === 'activo' || raw === 'activa') return 'activa'
  if (raw === 'inactive' || raw === 'inactivo' || raw === 'inactiva') return 'inactiva'
  return null
}

function toFeStatus(estado) {
  if (estado === 'activo' || estado === 'activa' || estado === 1 || estado === true) return 'active'
  return 'inactive'
}

module.exports = { toEstadoActivo, toEstadoActiva, toFeStatus }
