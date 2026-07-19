const repo = require('../repositories/editoriales.repository')
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
    where.push('(codigo LIKE ? OR nombre LIKE ? OR pais LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`)
  }
  const est = toEstadoActivo(query.estado)
  if (est) {
    where.push('estado = ?')
    params.push(est)
  }
  return { wh: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

function parseFields(body, existing = null) {
  const b = body || {}
  return {
    code: String(b.code ?? b.codigo ?? existing?.codigo ?? '').trim().toUpperCase(),
    name: String(b.name ?? b.nombre ?? existing?.nombre ?? '').trim(),
    country: b.country ?? b.pais ?? existing?.pais ?? null,
    contact: b.contact ?? b.contacto ?? existing?.contacto ?? null,
    email: b.email ?? existing?.email ?? null,
    phone: b.phone ?? b.telefono ?? existing?.telefono ?? null,
    contractType: b.contractType ?? b.tipo_contrato ?? existing?.tipo_contrato ?? null,
    contractExpiry: b.contractExpiry ?? b.fecha_vencimiento ?? existing?.fecha_vencimiento ?? null,
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
  if (!row) throw appError(404, 'Editorial no encontrada')
  return row
}

async function create(req, body) {
  const fields = parseFields(body)
  if (!fields.code || !fields.name) throw appError(400, 'Código y nombre son obligatorios')
  try {
    const id = await repo.insert(fields)
    await audit(req, { modulo: 'inventario', entidad: 'editoriales', entidadId: id, accion: 'crear', descripcion: fields.name })
    const [row] = [await repo.findRawById(id)]
    return repo.mapRow(row, 0)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Editorial no encontrada')
  const fields = parseFields(body, ex)
  try {
    await repo.update(id, fields)
    await audit(req, { modulo: 'inventario', entidad: 'editoriales', entidadId: id, accion: 'actualizar', descripcion: fields.name })
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
  if (!ok) throw appError(404, 'Editorial no encontrada')
  await audit(req, { modulo: 'inventario', entidad: 'editoriales', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  const row = await repo.findRawById(id)
  return repo.mapRow(row, 0)
}

module.exports = { list, getById, create, update, patchEstado }
