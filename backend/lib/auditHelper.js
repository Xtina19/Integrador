/**
 * Helper de auditoría (tabla `auditoria`).
 * No bloquea el CRUD si la tabla/FK no está disponible.
 */
async function registrarAuditoria(pool, { modulo, entidad, entidadId, accion, descripcion, usuarioId }) {
  try {
    await pool.query(
      `INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [modulo, entidad, String(entidadId), accion, usuarioId || null, descripcion || null]
    )
  } catch (_) {
    /* silencioso */
  }
}

function usuarioFromReq(req) {
  const raw = req.headers['x-user-id']
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

module.exports = { registrarAuditoria, usuarioFromReq }
