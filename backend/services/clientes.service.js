const repo = require('../repositories/clientes.repository')
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
    where.push('(nombre LIKE ? OR codigo LIKE ? OR documento LIKE ? OR email LIKE ? OR dominio_id LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`, `%${query.q}%`, `%${query.q}%`)
  }
  if (query.estado === 'activo' || query.estado === 'active') {
    where.push('activo = 1')
  } else if (query.estado === 'inactivo' || query.estado === 'inactive') {
    where.push('activo = 0')
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
  if (!row) throw appError(404, 'Cliente no encontrado')
  return row
}

async function create(req, body) {
  const b = body || {}
  const nombre = String(b.nombre ?? b.name ?? '').trim()
  if (!nombre) throw appError(400, 'Nombre es obligatorio')
  const dominioId = String(b.dominioId || b.dominio_id || `CLI-${Date.now()}`).trim()
  const codigo = String(b.codigo || dominioId).trim()
  const activo = b.estado === 'inactivo' || b.estado === 'bloqueado' || b.status === 'inactive' ? 0 : 1
  try {
    const id = await repo.insert({
      dominioId,
      codigo,
      nombre,
      documento: b.documento || null,
      email: b.correo || b.email || null,
      telefono: b.telefono || null,
      activo,
    })
    await audit(req, { modulo: 'ventas', entidad: 'venta_clientes', entidadId: id, accion: 'crear', descripcion: nombre })
    const row = await repo.findByIdOrDominio(id)
    return repo.mapRow(row)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Código o dominio duplicado')
    throw e
  }
}

async function update(req, id, body) {
  const b = body || {}
  const ex = await repo.findByIdOrDominio(id)
  if (!ex) throw appError(404, 'Cliente no encontrado')
  const nombre = String(b.nombre ?? b.name ?? ex.nombre).trim()
  let activo = ex.activo
  if (b.estado === 'activo' || b.status === 'active') activo = 1
  if (b.estado === 'inactivo' || b.estado === 'bloqueado' || b.status === 'inactive') activo = 0
  await repo.update(ex.id, {
    codigo: b.codigo ?? ex.codigo,
    nombre,
    documento: b.documento ?? ex.documento,
    email: b.correo ?? b.email ?? ex.email,
    telefono: b.telefono ?? ex.telefono,
    activo,
  })
  await audit(req, { modulo: 'ventas', entidad: 'venta_clientes', entidadId: ex.id, accion: 'actualizar', descripcion: nombre })
  const row = await repo.findByIdOrDominio(ex.id)
  return repo.mapRow(row)
}

async function patchEstado(req, id, body) {
  const raw = body.status ?? body.estado
  const activo =
    raw === 'activo' || raw === 'active' || raw === true || raw === 1
      ? 1
      : raw === 'inactivo' || raw === 'inactive' || raw === false || raw === 0
        ? 0
        : null
  if (activo === null) throw appError(400, 'Estado inválido')
  const ex = await repo.findByIdOrDominio(id)
  if (!ex) throw appError(404, 'Cliente no encontrado')
  await repo.updateActivo(ex.id, activo)
  await audit(req, {
    modulo: 'ventas',
    entidad: 'venta_clientes',
    entidadId: ex.id,
    accion: 'actualizar',
    descripcion: `activo=${activo}`,
  })
  const row = await repo.findByIdOrDominio(ex.id)
  return repo.mapRow(row)
}

module.exports = { list, getById, create, update, patchEstado }
