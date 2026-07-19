/**
 * Autorización del módulo Compras (FASE 8).
 *
 * No inventa permisos nuevos: usa roles existentes del seed
 * (ADMIN, COMPRAS) para operaciones críticas de escritura.
 * Lecturas siguen con authPlaceholder (actor opcional).
 *
 * Roles permitidos en acciones críticas = operadores del módulo Compras,
 * coherente con rol COMPRAS del seed (Luis) y ADMIN (Ana).
 */

const { query } = require('../helpers/dbExecutor')
const { AppError } = require('../errors')

const ROLES_OPERADOR_COMPRAS = Object.freeze(['ADMIN', 'COMPRAS'])

/**
 * Exige actor autenticado (x-user-id / req.user) para auditoría.
 */
function requireComprasActor(req, res, next) {
  const id = req.user?.id ?? req.user?.userId
  const n = Number(id)
  if (!Number.isInteger(n) || n <= 0) {
    return next(
      new AppError('COMMON_UNAUTHORIZED', {
        message: 'Debe autenticarse para realizar esta operación.',
        developerMessage: 'Falta actor (x-user-id / req.user.id) en ruta crítica de Compras.',
        httpStatus: 401,
      })
    )
  }
  req.user = { ...(req.user || {}), id: n }
  return next()
}

/**
 * Exige que el usuario tenga un rol de operador Compras (ADMIN | COMPRAS).
 * @param {string[]} [allowedRoles]
 */
function requireComprasRole(allowedRoles = ROLES_OPERADOR_COMPRAS) {
  const allowed = new Set(allowedRoles.map((r) => String(r).toUpperCase()))

  return async function requireComprasRoleMiddleware(req, res, next) {
    try {
      const userId = Number(req.user?.id ?? req.user?.userId)
      if (!Number.isInteger(userId) || userId <= 0) {
        return next(
          new AppError('COMMON_UNAUTHORIZED', {
            message: 'Debe autenticarse para realizar esta operación.',
            developerMessage: 'requireComprasRole sin actor.',
            httpStatus: 401,
          })
        )
      }

      const { rows } = await query(
        `SELECT r.codigo AS rol_codigo
         FROM usuarios u
         INNER JOIN roles r ON r.id = u.rol_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      )

      if (!rows.length) {
        return next(
          new AppError('COMMON_FORBIDDEN', {
            message: 'No tiene permiso para esta operación.',
            developerMessage: `Usuario ${userId} no encontrado o sin rol.`,
            httpStatus: 403,
          })
        )
      }

      const rol = String(rows[0].rol_codigo || '').toUpperCase()
      if (!allowed.has(rol)) {
        return next(
          new AppError('COMMON_FORBIDDEN', {
            message: 'No tiene permiso para esta operación de Compras.',
            developerMessage: `Rol ${rol} no autorizado. Requiere: ${[...allowed].join(', ')}`,
            httpStatus: 403,
            details: { rol, allowed: [...allowed] },
          })
        )
      }

      req.user = { ...(req.user || {}), id: userId, rol }
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

/** Cadena tipica para mutaciones críticas: actor + rol operador. */
const criticalWrite = [requireComprasActor, requireComprasRole()]

module.exports = {
  requireComprasActor,
  requireComprasRole,
  criticalWrite,
  ROLES_OPERADOR_COMPRAS,
}
