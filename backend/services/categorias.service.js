const repo = require('../repositories/categorias.repository')
const { getMysqlPool } = require('../db-mysql')
const { registrarAuditoria, usuarioFromReq } = require('../lib/auditHelper')
const { toEstadoActivo, toFeStatus } = require('../lib/statusHelpers')
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
    where.push('(codigo LIKE ? OR nombre LIKE ? OR descripcion LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`)
  }
  const est = toEstadoActivo(query.estado)
  if (est) {
    where.push('estado = ?')
    params.push(est)
  }
  const wh = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return { wh, params }
}

async function list(query) {
  const { wh, params } = buildWhere(query)
  const total = await repo.count(wh, params)
  const rows = await repo.findPage({ where: wh, params, pageSize: query.pageSize, offset: query.offset })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Categoría no encontrada')
  return row
}

async function create(req, body) {
  const code = String(body.code ?? body.codigo ?? '').trim().toUpperCase()
  const name = String(body.name ?? body.nombre ?? '').trim()
  const description = String(body.description ?? body.descripcion ?? '').trim()
  const estado = toEstadoActivo(body.status ?? body.estado) || 'activo'
  if (!code || !name) throw appError(400, 'Código y nombre son obligatorios')
  try {
    const id = await repo.insert({ code, name, description, estado })
    await audit(req, { modulo: 'inventario', entidad: 'categorias', entidadId: id, accion: 'crear', descripcion: name })
    return { ...repo.mapRow({ id, codigo: code, nombre: name, descripcion: description, estado, productCount: 0 }) }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código o nombre duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const code = String(body.code ?? body.codigo ?? '').trim().toUpperCase()
  const name = String(body.name ?? body.nombre ?? '').trim()
  const description = String(body.description ?? body.descripcion ?? '').trim()
  const estado = toEstadoActivo(body.status ?? body.estado)
  if (!code || !name) throw appError(400, 'Código y nombre son obligatorios')
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Categoría no encontrada')
  try {
    await repo.update(id, { code, name, description, estado: estado || ex.estado })
    await audit(req, { modulo: 'inventario', entidad: 'categorias', entidadId: id, accion: 'actualizar', descripcion: name })
    return repo.findById(id)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código o nombre duplicado')
    throw e
  }
}

async function patchEstado(req, id, body) {
  const estado = toEstadoActivo(body.status ?? body.estado)
  if (!estado) throw appError(400, 'Estado inválido')
  const ok = await repo.updateEstado(id, estado)
  if (!ok) throw appError(404, 'Categoría no encontrada')
  await audit(req, { modulo: 'inventario', entidad: 'categorias', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  const row = await repo.findRawAfterPatch(id)
  return {
    id: String(row.id),
    code: row.codigo,
    name: row.nombre,
    description: row.descripcion || '',
    status: toFeStatus(row.estado),
    productCount: 0,
  }
}

module.exports = { list, getById, create, update, patchEstado }
