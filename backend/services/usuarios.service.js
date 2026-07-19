const crypto = require('crypto')
const repo = require('../repositories/usuarios.repository')
const { getMysqlPool } = require('../db-mysql')
const { registrarAuditoria, usuarioFromReq } = require('../lib/auditHelper')
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
    where.push('(u.codigo LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`, `%${query.q}%`)
  }
  if (query.estado === 'active' || query.estado === 'activo') {
    where.push(`u.estado = 'activo'`)
  } else if (query.estado === 'inactive' || query.estado === 'inactivo') {
    where.push(`u.estado = 'inactivo'`)
  } else if (query.estado === 'blocked' || query.estado === 'bloqueado') {
    where.push(`u.estado = 'bloqueado'`)
  }
  return { wh: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

function resolveEstado(body, existing = null) {
  if (body.status === 'active' || body.estado === 'activo') return 'activo'
  if (body.status === 'inactive' || body.estado === 'inactivo') return 'inactivo'
  if (body.status === 'blocked' || body.estado === 'bloqueado') return 'bloqueado'
  return existing?.estado || 'activo'
}

async function list(query) {
  const { wh, params } = buildWhere(query)
  const total = await repo.count(wh, params)
  const rows = await repo.findPage({ where: wh, params, pageSize: query.pageSize, offset: query.offset })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Usuario no encontrado')
  return row
}

async function create(req, body) {
  const b = body || {}
  const code = String(b.code ?? b.codigo ?? '').trim().toUpperCase()
  const name = String(b.name ?? b.nombre ?? '').trim()
  const email = String(b.email ?? '').trim()
  const roleId = b.roleId || b.rol_id
  if (!code || !name || !email || !roleId) {
    throw appError(400, 'Código, nombre, email y rol son obligatorios')
  }
  const password = String(b.password || 'Cambiar123!')
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  const fields = {
    roleId,
    code,
    name,
    lastName: b.lastName || b.apellido || null,
    email,
    passwordHash,
    phone: b.phone || b.telefono || null,
    estado: resolveEstado(b),
  }
  try {
    const id = await repo.insert(fields)
    await audit(req, { modulo: 'administracion', entidad: 'usuarios', entidadId: id, accion: 'crear', descripcion: email })
    return repo.findById(id)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código o email duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const b = body || {}
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Usuario no encontrado')
  const fields = {
    roleId: b.roleId ?? b.rol_id ?? ex.rol_id,
    code: String(b.code ?? b.codigo ?? ex.codigo).trim().toUpperCase(),
    name: String(b.name ?? b.nombre ?? ex.nombre).trim(),
    lastName: b.lastName ?? b.apellido ?? ex.apellido,
    email: String(b.email ?? ex.email).trim(),
    phone: b.phone ?? b.telefono ?? ex.telefono,
    estado: resolveEstado(b, ex),
  }
  try {
    await repo.update(id, fields)
    await audit(req, {
      modulo: 'administracion',
      entidad: 'usuarios',
      entidadId: id,
      accion: 'actualizar',
      descripcion: b.email || ex.email,
    })
    return repo.findById(id)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código o email duplicado')
    throw e
  }
}

async function patchEstado(req, id, body) {
  const raw = body.status ?? body.estado
  let estado = null
  if (raw === 'active' || raw === 'activo') estado = 'activo'
  if (raw === 'inactive' || raw === 'inactivo') estado = 'inactivo'
  if (raw === 'blocked' || raw === 'bloqueado') estado = 'bloqueado'
  if (!estado) throw appError(400, 'Estado inválido')
  const ok = await repo.updateEstado(id, estado)
  if (!ok) throw appError(404, 'Usuario no encontrado')
  await audit(req, { modulo: 'administracion', entidad: 'usuarios', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  return repo.findById(id)
}

module.exports = { list, getById, create, update, patchEstado }
