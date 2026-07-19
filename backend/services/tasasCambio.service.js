const repo = require('../repositories/tasasCambio.repository')
const { getMysqlPool } = require('../db-mysql')
const { registrarAuditoria, usuarioFromReq } = require('../lib/auditHelper')
const { toEstadoActiva } = require('../lib/statusHelpers')
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
    where.push('(o.codigo LIKE ? OR d.codigo LIKE ?)')
    params.push(`%${query.q}%`, `%${query.q}%`)
  }
  const est = toEstadoActiva(query.estado)
  if (est) {
    where.push('t.estado = ?')
    params.push(est)
  }
  return { wh: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

async function resolveMonedaIds(body, existing = null) {
  let origenId = body.fromCurrencyId || body.moneda_origen_id || existing?.moneda_origen_id
  let destinoId = body.toCurrencyId || body.moneda_destino_id || existing?.moneda_destino_id
  if (body.fromCurrency) {
    const id = await repo.findMonedaIdByCodigo(body.fromCurrency)
    if (id) origenId = id
  }
  if (body.toCurrency) {
    const id = await repo.findMonedaIdByCodigo(body.toCurrency)
    if (id) destinoId = id
  }
  return { origenId, destinoId }
}

async function list(query) {
  const { wh, params } = buildWhere(query)
  const total = await repo.count(wh, params)
  const rows = await repo.findPage({ where: wh, params, pageSize: query.pageSize, offset: query.offset })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Tasa no encontrada')
  return row
}

async function create(req, body) {
  const b = body || {}
  const { origenId, destinoId } = await resolveMonedaIds(b)
  const tasa = Number(b.value ?? b.tasa ?? b.rate)
  if (!origenId || !destinoId || !(tasa > 0)) {
    throw appError(400, 'Monedas y tasa (>0) son obligatorias')
  }
  if (String(origenId) === String(destinoId)) {
    throw appError(400, 'Origen y destino deben ser distintos')
  }
  const vigenteDesde = b.date || b.vigente_desde || new Date().toISOString().slice(0, 19).replace('T', ' ')
  const estado = toEstadoActiva(b.status ?? b.estado) || 'activa'
  const id = await repo.insert({
    origenId,
    destinoId,
    tasa,
    vigenteDesde,
    actualizadoPorId: usuarioFromReq(req),
    estado,
  })
  await audit(req, { modulo: 'configuracion', entidad: 'tasas_cambio', entidadId: id, accion: 'crear', descripcion: String(tasa) })
  return repo.findById(id)
}

async function update(req, id, body) {
  const b = body || {}
  const ex = await repo.findRawById(id)
  if (!ex) throw appError(404, 'Tasa no encontrada')
  const { origenId, destinoId } = await resolveMonedaIds(b, ex)
  const tasa = Number(b.value ?? b.tasa ?? b.rate ?? ex.tasa)
  const estado = toEstadoActiva(b.status ?? b.estado) || ex.estado || 'activa'
  const vigenteDesde = b.date || b.vigente_desde || ex.vigente_desde
  await repo.update(id, {
    origenId,
    destinoId,
    tasa,
    vigenteDesde,
    actualizadoPorId: usuarioFromReq(req),
    estado,
  })
  await audit(req, { modulo: 'configuracion', entidad: 'tasas_cambio', entidadId: id, accion: 'actualizar', descripcion: String(tasa) })
  return repo.findById(id)
}

async function patchEstado(req, id, body) {
  const estado = toEstadoActiva(body.status ?? body.estado)
  if (!estado) throw appError(400, 'Estado inválido')
  const ok = await repo.updateEstado(id, estado)
  if (!ok) throw appError(404, 'Tasa no encontrada')
  await audit(req, { modulo: 'configuracion', entidad: 'tasas_cambio', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  return repo.findById(id)
}

module.exports = { list, getById, create, update, patchEstado }
