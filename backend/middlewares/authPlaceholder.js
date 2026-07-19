/**
 * Placeholder de autenticación (solo /api/compras).
 *
 * - No bloquea la petición.
 * - Si ya existe req.user (middleware futuro), no lo sobrescribe.
 * - Si no, intenta poblar req.user.id desde header x-user-id (dev/pruebas).
 *
 * Integración futura: reemplazar por auth real que exija token y asigne req.user.
 */
function authPlaceholder(req, res, next) {
  if (req.user && (req.user.id != null || req.user.userId != null)) {
    return next()
  }

  const header = req.headers['x-user-id']
  if (header != null && header !== '') {
    const n = Number(header)
    if (Number.isInteger(n) && n > 0) {
      req.user = { id: n, source: 'x-user-id' }
    }
  }

  next()
}

module.exports = { authPlaceholder }
