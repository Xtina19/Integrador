const repo = require('../repositories/editoriales.repository')
const { registrarAuditoriaSql, usuarioFromReq } = require('../lib/auditSqlServer')
const { toEstadoActivo } = require('../lib/statusHelpers')
const { wrapPage } = require('../lib/pagination')

function appError(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-()\s]{7,30}$/

function validateEmail(email) {
  if (!email) return null
  if (!EMAIL_RE.test(email)) return 'Email inválido'
  return null
}

function validatePhone(phone) {
  if (!phone) return null
  if (!PHONE_RE.test(phone)) return 'Teléfono inválido'
  return null
}

async function audit(req, opts) {
  await registrarAuditoriaSql({ ...opts, usuarioId: usuarioFromReq(req) })
}

function parseFields(body, existing = null) {
  const b = body || {}
  const emailRaw = b.email ?? existing?.email ?? null
  const contactRaw = b.contact ?? b.contacto ?? existing?.contact ?? null
  const email =
    emailRaw != null && String(emailRaw).trim()
      ? String(emailRaw).trim()
      : contactRaw && EMAIL_RE.test(String(contactRaw).trim())
        ? String(contactRaw).trim()
        : null

  return {
    code: String(b.code ?? b.codigo ?? existing?.code ?? '').trim().toUpperCase(),
    name: String(b.name ?? b.nombre ?? existing?.name ?? '').trim(),
    country: (() => {
      const v = b.country ?? b.pais ?? existing?.country ?? null
      return v != null && String(v).trim() ? String(v).trim() : null
    })(),
    contact: (() => {
      const v = b.contact ?? b.contacto ?? existing?.contact ?? null
      return v != null && String(v).trim() ? String(v).trim() : null
    })(),
    email,
    phone: (() => {
      const v = b.phone ?? b.telefono ?? existing?.phone ?? null
      return v != null && String(v).trim() ? String(v).trim() : null
    })(),
    contractType: (() => {
      const v = b.contractType ?? b.tipo_contrato ?? existing?.contractType ?? null
      return v != null && String(v).trim() ? String(v).trim() : null
    })(),
    contractExpiry: (() => {
      const v = b.contractExpiry ?? b.fecha_vencimiento ?? existing?.contractExpiry ?? null
      if (v == null || v === '') return null
      return String(v).slice(0, 10)
    })(),
    estado: toEstadoActivo(b.status ?? b.estado) || existing?.estadoDb || 'activo',
  }
}

function validateFields(fields, { requireCode = true } = {}) {
  if (requireCode && !fields.code) throw appError(400, 'Código y nombre son obligatorios')
  if (!fields.name) throw appError(400, 'Código y nombre son obligatorios')
  if (!fields.estado) throw appError(400, 'Estado inválido')
  const emailErr = validateEmail(fields.email)
  if (emailErr) throw appError(400, emailErr)
  const phoneErr = validatePhone(fields.phone)
  if (phoneErr) throw appError(400, phoneErr)
}

async function list(query) {
  const estado = toEstadoActivo(query.estado) || null
  const { total, rows } = await repo.findPage({
    q: query.q || null,
    estado,
    page: query.page,
    pageSize: query.pageSize,
  })
  return wrapPage(rows, query.page, query.pageSize, total)
}

async function search(query) {
  const q = String(query.q || '').trim()
  if (!q) throw appError(400, 'Debe indicar un criterio de búsqueda')
  return repo.search({
    q,
    soloActivos: query.soloActivos !== '0' && query.soloActivos !== 'false',
    top: Number(query.top) || 20,
  })
}

async function getById(id) {
  const row = await repo.findById(id)
  if (!row) throw appError(404, 'Editorial no encontrada')
  return row
}

async function create(req, body) {
  const fields = parseFields(body)
  validateFields(fields)
  const id = await repo.insert(fields)
  await audit(req, {
    modulo: 'editoriales',
    entidad: 'editoriales',
    entidadId: id,
    accion: 'crear',
    descripcion: fields.name,
  })
  return repo.findById(id)
}

async function update(req, id, body) {
  const existing = await repo.findById(id)
  if (!existing) throw appError(404, 'Editorial no encontrada')
  const fields = parseFields(body, {
    ...existing,
    estadoDb: toEstadoActivo(existing.status) || 'activo',
  })
  validateFields(fields)
  await repo.update(id, fields)
  await audit(req, {
    modulo: 'editoriales',
    entidad: 'editoriales',
    entidadId: id,
    accion: 'actualizar',
    descripcion: fields.name,
  })
  return repo.findById(id)
}

async function patchEstado(req, id, body) {
  const estado = toEstadoActivo(body.status ?? body.estado)
  if (!estado) throw appError(400, 'Estado inválido')
  await repo.updateEstado(id, estado)
  await audit(req, {
    modulo: 'editoriales',
    entidad: 'editoriales',
    entidadId: id,
    accion: 'actualizar',
    descripcion: `estado=${estado}`,
  })
  return repo.findById(id)
}

async function dashboard() {
  return repo.dashboard()
}

async function listProducts(query) {
  return repo.listProducts({
    editorialId: query.editorialId || query.editorial_id || null,
    q: query.q || null,
  })
}

module.exports = {
  list,
  search,
  getById,
  create,
  update,
  patchEstado,
  dashboard,
  listProducts,
}
