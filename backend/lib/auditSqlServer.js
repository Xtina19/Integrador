/**
 * Auditoría best-effort sobre SQL Server.
 * Si la tabla `auditoria` no existe, no bloquea el CRUD.
 */
const { getSqlPool, sql } = require('./sqlServer')

async function registrarAuditoriaSql({ modulo, entidad, entidadId, accion, descripcion, usuarioId }) {
  try {
    const pool = await getSqlPool()
    await pool
      .request()
      .input('modulo', sql.NVarChar(50), modulo)
      .input('entidad', sql.NVarChar(80), entidad)
      .input('entidadId', sql.NVarChar(40), String(entidadId))
      .input('accion', sql.NVarChar(40), accion)
      .input('usuarioId', sql.Int, usuarioId || null)
      .input('descripcion', sql.NVarChar(500), descripcion || null)
      .query(`
        IF OBJECT_ID(N'dbo.auditoria', N'U') IS NOT NULL
        BEGIN
          INSERT INTO dbo.auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
          VALUES (@modulo, @entidad, @entidadId, @accion, @usuarioId, @descripcion)
        END
      `)
  } catch (_) {
    /* silencioso */
  }
}

function usuarioFromReq(req) {
  const raw = req.headers['x-user-id']
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

module.exports = { registrarAuditoriaSql, usuarioFromReq }
