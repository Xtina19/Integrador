/**
 * Paginación y filtros de listado (query string).
 */
function parseListQuery(req) {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50))
  const q = String(req.query.q || '').trim()
  const estado = req.query.estado || req.query.status || ''
  return { page, pageSize, offset: (page - 1) * pageSize, q, estado }
}

function wrapPage(rows, page, pageSize, total) {
  return { data: rows, page, pageSize, total: Number(total) }
}

module.exports = { parseListQuery, wrapPage }
