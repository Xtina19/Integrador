const repo = require('../repositories/productos.repository')
const { getMysqlPool } = require('../db-mysql')
const { registrarAuditoria, usuarioFromReq } = require('../lib/auditHelper')
const { toEstadoActivo } = require('../lib/statusHelpers')
const { wrapPage } = require('../lib/pagination')

function appError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

async function audit(req, opts) {
  await registrarAuditoria(getMysqlPool(), { ...opts, usuarioId: usuarioFromReq(req) })
}

function buildWhere(query) {
  const where = []
  const params = []
  if (query.q) {
    where.push('(p.codigo LIKE ? OR p.titulo LIKE ? OR p.isbn LIKE ? OR p.autor LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`, `%${query.q}%`)
  }
  const est = toEstadoActivo(query.estado)
  if (est) {
    where.push('p.estado = ?')
    params.push(est)
  }
  return { wh: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

function parseFields(body, existing = null) {
  const b = body || {}
  return {
    code: String(b.code ?? b.codigo ?? existing?.codigo ?? '').trim().toUpperCase(),
    title: String(b.title ?? b.titulo ?? existing?.titulo ?? '').trim(),
    isbn: b.isbn ?? existing?.isbn ?? null,
    author: b.author ?? b.autor ?? existing?.autor ?? null,
    categoryId: b.categoryId ?? b.categoria_id ?? existing?.categoria_id ?? null,
    publisherId: b.publisherId ?? b.editorial_id ?? existing?.editorial_id ?? null,
    cost: Number(b.cost ?? b.costo ?? existing?.costo ?? 0),
    price: Number(b.price ?? b.precio ?? existing?.precio ?? 0),
    estado: toEstadoActivo(b.status ?? b.estado) || existing?.estado || 'activo',
  }
}

async function list(query) {
  const { wh, params } = buildWhere(query)
  const total = await repo.count(wh, params)
  const rows = await repo.findPage({ where: wh, params, pageSize: query.pageSize, offset: query.offset })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Producto no encontrado')
  return row
}

async function create(req, body) {
  const fields = parseFields(body)
  if (!fields.code || !fields.title) throw appError(400, 'Código y título son obligatorios')
  try {
    const id = await repo.insert(fields)
    await audit(req, { modulo: 'inventario', entidad: 'productos', entidadId: id, accion: 'crear', descripcion: fields.title })
    return repo.findById(id)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Producto no encontrado')
  const fields = parseFields(body, ex)
  try {
    await repo.update(id, fields)
    await audit(req, { modulo: 'inventario', entidad: 'productos', entidadId: id, accion: 'actualizar', descripcion: fields.title })
    return repo.findById(id)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código duplicado')
    throw e
  }
}

async function patchEstado(req, id, body) {
  const estado = toEstadoActivo(body.status ?? body.estado)
  if (!estado) throw appError(400, 'Estado inválido')
  const ok = await repo.updateEstado(id, estado)
  if (!ok) throw appError(404, 'Producto no encontrado')
  await audit(req, { modulo: 'inventario', entidad: 'productos', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  return repo.findById(id)
}

module.exports = { list, getById, create, update, patchEstado }
