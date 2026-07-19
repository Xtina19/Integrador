/**
 * Helpers HTTP para validators de Compras.
 *
 * actorFromReq — resolución del actor para auditoría:
 *   1. req.user.id   → cuando exista middleware de autenticación
 *   2. x-user-id     → desarrollo / pruebas (header)
 *   3. null          → sin actor
 */

const { fail } = require('../domain/common')

/**
 * @param {import('express').Request} req
 * @returns {number|null}
 */
function actorFromReq(req) {
  const fromUser = req?.user?.id ?? req?.user?.userId
  if (fromUser != null && fromUser !== '') {
    const n = Number(fromUser)
    if (Number.isInteger(n) && n > 0) return n
  }

  const header = req?.headers?.['x-user-id']
  if (header != null && header !== '') {
    const n = Number(header)
    if (Number.isInteger(n) && n > 0) return n
  }

  return null
}

function parseIdParam(raw, field = 'id') {
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    fail('VALIDATION_INVALID_FORMAT', `${field} de ruta inválido`, { field })
  }
  return n
}

/**
 * Query de listado paginado.
 */
function parseListQuery(req) {
  const q = req.query || {}
  let page = Number(q.page)
  let pageSize = Number(q.pageSize)
  if (q.page !== undefined && q.page !== '' && (!Number.isFinite(page) || page < 1)) {
    fail('VALIDATION_QUERY_INVALID', 'page inválido', { field: 'page' })
  }
  if (q.pageSize !== undefined && q.pageSize !== '' && (!Number.isFinite(pageSize) || pageSize < 1)) {
    fail('VALIDATION_QUERY_INVALID', 'pageSize inválido', { field: 'pageSize' })
  }
  page = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1
  pageSize = Number.isFinite(pageSize) && pageSize >= 1 ? Math.min(100, Math.floor(pageSize)) : 50

  const filters = {
    q: q.q != null && String(q.q).trim() !== '' ? String(q.q).trim() : undefined,
    estado: q.estado || q.status || undefined,
    activo: q.activo !== undefined && q.activo !== '' ? q.activo : undefined,
  }

  // Clean undefined
  Object.keys(filters).forEach((k) => filters[k] === undefined && delete filters[k])

  return { page, pageSize, filters, rawQuery: q }
}

module.exports = {
  actorFromReq,
  parseIdParam,
  parseListQuery,
}
