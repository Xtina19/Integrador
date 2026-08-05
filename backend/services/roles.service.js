const repo = require('../repositories/roles.repository')
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
    where.push('(codigo LIKE ? OR nombre LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`)
  }
  const est = toEstadoActivo(query.estado)
  if (est) {
    where.push('estado = ?')
    params.push(est)
  }
  return { wh: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

async function list(query) {
  const { wh, params } = buildWhere(query)
  const total = await repo.count(wh, params)
  const rows = await repo.findPage({ where: wh, params, pageSize: query.pageSize, offset: query.offset })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Rol no encontrado')
  return row
}

async function create(req, body) {
  const b = body || {}
  const code = String(b.code ?? b.codigo ?? '').trim().toUpperCase()
  const name = String(b.name ?? b.nombre ?? '').trim()
  if (!code || !name) throw appError(400, 'Código y nombre son obligatorios')
  const fields = {
    code,
    name,
    description: b.description || b.descripcion || null,
    estado: toEstadoActivo(b.status ?? b.estado) || 'activo',
  }
  try {
    const id = await repo.insert(fields)
    await audit(req, { modulo: 'administracion', entidad: 'roles', entidadId: id, accion: 'crear', descripcion: name })
    return repo.mapRow({ id, codigo: code, nombre: name, descripcion: fields.description, estado: fields.estado, users_count: 0 })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const b = body || {}
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Rol no encontrado')
  const fields = {
    code: String(b.code ?? b.codigo ?? ex.codigo).trim().toUpperCase(),
    name: String(b.name ?? b.nombre ?? ex.nombre).trim(),
    description: b.description ?? b.descripcion ?? ex.descripcion,
    estado: toEstadoActivo(b.status ?? b.estado) || ex.estado,
  }
  try {
    await repo.update(id, fields)
    await audit(req, { modulo: 'administracion', entidad: 'roles', entidadId: id, accion: 'actualizar', descripcion: fields.name })
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
  if (!ok) throw appError(404, 'Rol no encontrado')
  await audit(req, { modulo: 'administracion', entidad: 'roles', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  const row = await repo.findRawById(id)
  return repo.mapRow({ ...row, users_count: 0 })
}

module.exports = { list, getById, create, update, patchEstado }
