const repo = require('../repositories/monedas.repository')
const { getMysqlPool } = require('../db-mysql')
const { registrarAuditoria, usuarioFromReq } = require('../lib/auditHelper')
const { toEstadoActiva } = require('../lib/statusHelpers')

function appError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

function parseBody(body = {}, { defaults = true } = {}) {
  const code = String(body.code ?? body.codigo ?? '').trim().toUpperCase()
  const name = String(body.name ?? body.nombre ?? '').trim()
  const symbol = String(body.symbol ?? body.simbolo ?? '').trim()
  const statusRaw = body.status ?? body.estado
  const hasStatus = statusRaw !== undefined && statusRaw !== null && statusRaw !== ''
  const estado = hasStatus ? toEstadoActiva(statusRaw) : defaults ? 'activa' : null
  const hasDefault = body.isDefault !== undefined || body.es_principal !== undefined
  const isDefault = hasDefault ? Boolean(body.isDefault ?? body.es_principal) : defaults ? false : null
  return { code, name, symbol, estado, isDefault, hasStatus, hasDefault }
}

function validateFields({ code, name, symbol, estado }) {
  if (!/^[A-Z]{3}$/.test(code)) return 'El código debe ser ISO de 3 letras (ej. DOP).'
  if (!name || name.length < 2) return 'El nombre es obligatorio (mín. 2 caracteres).'
  if (!symbol) return 'El símbolo es obligatorio.'
  if (!estado) return 'Estado inválido (active/inactive o activa/inactiva).'
  return null
}

async function audit(req, opts) {
  await registrarAuditoria(getMysqlPool(), { ...opts, usuarioId: usuarioFromReq(req) })
}

async function list() {
  return repo.findAll()
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Moneda no encontrada')
  return row
}

async function create(req, body) {
  const data = parseBody(body)
  const errMsg = validateFields(data)
  if (errMsg) throw appError(400, errMsg)
  try {
    const insertId = await repo.insert(data)
    await audit(req, { modulo: 'configuracion', entidad: 'monedas', entidadId: insertId, accion: 'crear', descripcion: data.name })
    return repo.findById(insertId)
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Ya existe una moneda con ese código.')
    throw e
  }
}

async function update(req, id, body) {
  const data = parseBody(body, { defaults: false })
  if (!data.code || !data.name || !data.symbol) throw appError(400, 'code, name y symbol son obligatorios.')
  if (!/^[A-Z]{3}$/.test(data.code)) throw appError(400, 'El código debe ser ISO de 3 letras (ej. DOP).')
  if (data.hasStatus && !data.estado) throw appError(400, 'Estado inválido.')
  try {
    const row = await repo.update(id, data)
    if (!row) throw appError(404, 'Moneda no encontrada')
    await audit(req, { modulo: 'configuracion', entidad: 'monedas', entidadId: id, accion: 'actualizar', descripcion: data.name })
    return row
  } catch (e) {
    if (e.status) throw e
    if (e.code === 'ER_DUP_ENTRY') throw appError(409, 'Ya existe una moneda con ese código.')
    throw e
  }
}

async function patchEstado(req, id, body) {
  const estado = toEstadoActiva(body?.status ?? body?.estado)
  if (!estado) throw appError(400, 'Indique status/estado: active|inactive o activa|inactiva')
  const row = await repo.updateEstado(id, estado)
  if (!row) throw appError(404, 'Moneda no encontrada')
  await audit(req, { modulo: 'configuracion', entidad: 'monedas', entidadId: id, accion: 'actualizar', descripcion: `estado=${estado}` })
  return row
}

async function remove(req, id) {
  const refs = await repo.countTasaRefs(id)
  if (refs > 0) {
    throw appError(409, 'No se puede eliminar: hay tasas de cambio asociadas. Desactive la moneda en su lugar.')
  }
  try {
    const ok = await repo.remove(id)
    if (!ok) throw appError(404, 'Moneda no encontrada')
    await audit(req, { modulo: 'configuracion', entidad: 'monedas', entidadId: id, accion: 'eliminar', descripcion: `id=${id}` })
    return { ok: true }
  } catch (e) {
    if (e.status) throw e
    if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.code === 'ER_ROW_IS_REFERENCED') {
      throw appError(409, 'No se puede eliminar: la moneda está en uso. Desactívela en su lugar.')
    }
    throw e
  }
}

module.exports = { list, getById, create, update, patchEstado, remove }
