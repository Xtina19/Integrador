const { execProc } = require('../lib/sqlServer')
const { toFeStatus } = require('../lib/statusHelpers')

function mapRow(r) {
  if (!r) return null
  return {
    id: String(r.id),
    code: r.codigo,
    name: r.nombre,
    country: r.pais || '',
    contact: r.contacto || '',
    phone: r.telefono || '',
    email: r.email || '',
    contractType: r.tipo_contrato || '',
    contractExpiry: r.fecha_vencimiento
      ? String(r.fecha_vencimiento).slice(0, 10)
      : '',
    status: toFeStatus(r.estado),
    productCount: Number(r.productCount || 0),
    createdAt: r.created_at ? String(r.created_at) : undefined,
    updatedAt: r.updated_at ? String(r.updated_at) : undefined,
  }
}

/** Evita desfase de zona horaria al enviar DATE a mssql. */
function toSqlDate(value) {
  if (value == null || value === '') return null
  const s = String(value).slice(0, 10)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  return new Date(Date.UTC(y, mo - 1, d))
}

function mapSqlError(err) {
  const msg = String(
    err?.message ||
      err?.originalError?.info?.message ||
      err?.precedingErrors?.[0]?.message ||
      err ||
      ''
  )
  const number =
    err?.number ||
    err?.originalError?.info?.number ||
    err?.precedingErrors?.[0]?.number ||
    null
  if (number === 2627 || number === 2601 || /duplicate|UNIQUE|UK_editoriales/i.test(msg)) {
    const e = new Error(
      msg.includes('nombre') || /UK_editoriales_nombre/i.test(msg) ? 'Nombre duplicado' : 'Código duplicado'
    )
    e.status = 409
    return e
  }
  if (number === 547 && /CK_editoriales_email/i.test(msg)) {
    const e = new Error('Email inválido')
    e.status = 400
    return e
  }
  if ((number != null && number >= 50000) || /Editorial no encontrada|obligatorio|inválido|duplicado/i.test(msg)) {
    const e = new Error(msg.replace(/^Error:\s*/i, '').split('\n')[0])
    e.status = /no encontrada/i.test(msg) ? 404 : /duplicado/i.test(msg) ? 409 : 400
    return e
  }
  const e = new Error(msg || 'Error de base de datos')
  e.status = err?.status || 500
  return e
}

async function findPage({ q, estado, page, pageSize }) {
  try {
    const result = await execProc('dbo.sp_Editorial_Listar', (req, s) => {
      req.input('q', s.NVarChar(100), q || null)
      req.input('estado', s.NVarChar(20), estado || null)
      req.input('page', s.Int, page)
      req.input('pageSize', s.Int, pageSize)
    })
    const total = Number(result.recordsets?.[0]?.[0]?.total ?? 0)
    const rows = (result.recordsets?.[1] || []).map(mapRow)
    return { total, rows }
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function search({ q, soloActivos = true, top = 20 }) {
  try {
    const result = await execProc('dbo.sp_Editorial_Buscar', (req, s) => {
      req.input('q', s.NVarChar(100), q)
      req.input('soloActivos', s.Bit, soloActivos ? 1 : 0)
      req.input('top', s.Int, top)
    })
    return (result.recordset || []).map(mapRow)
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function findById(id) {
  try {
    const result = await execProc('dbo.sp_Editorial_Obtener', (req, s) => {
      req.input('id', s.Int, Number(id))
    })
    const row = result.recordset?.[0]
    return row ? mapRow(row) : null
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function insert(fields) {
  try {
    const result = await execProc('dbo.sp_Editorial_Crear', (req, s) => {
      req.input('codigo', s.NVarChar(20), fields.code)
      req.input('nombre', s.NVarChar(200), fields.name)
      req.input('pais', s.NVarChar(100), fields.country || null)
      req.input('contacto', s.NVarChar(150), fields.contact || null)
      req.input('email', s.NVarChar(150), fields.email || null)
      req.input('telefono', s.NVarChar(30), fields.phone || null)
      req.input('tipo_contrato', s.NVarChar(100), fields.contractType || null)
      req.input('fecha_vencimiento', s.Date, toSqlDate(fields.contractExpiry))
      req.input('estado', s.NVarChar(20), fields.estado)
      req.output('nuevo_id', s.Int)
    })
    return Number(result.output.nuevo_id)
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function update(id, fields) {
  try {
    await execProc('dbo.sp_Editorial_Actualizar', (req, s) => {
      req.input('id', s.Int, Number(id))
      req.input('codigo', s.NVarChar(20), fields.code)
      req.input('nombre', s.NVarChar(200), fields.name)
      req.input('pais', s.NVarChar(100), fields.country || null)
      req.input('contacto', s.NVarChar(150), fields.contact || null)
      req.input('email', s.NVarChar(150), fields.email || null)
      req.input('telefono', s.NVarChar(30), fields.phone || null)
      req.input('tipo_contrato', s.NVarChar(100), fields.contractType || null)
      req.input('fecha_vencimiento', s.Date, toSqlDate(fields.contractExpiry))
      req.input('estado', s.NVarChar(20), fields.estado)
    })
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function updateEstado(id, estado) {
  try {
    await execProc('dbo.sp_Editorial_CambiarEstado', (req, s) => {
      req.input('id', s.Int, Number(id))
      req.input('estado', s.NVarChar(20), estado)
    })
    return true
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function dashboard() {
  try {
    const result = await execProc('dbo.sp_Editorial_Dashboard')
    const summary = result.recordsets?.[0]?.[0] || {}
    const topPublisher = result.recordsets?.[1]?.[0]
      ? {
          id: String(result.recordsets[1][0].id),
          code: result.recordsets[1][0].codigo,
          name: result.recordsets[1][0].nombre,
          productCount: Number(result.recordsets[1][0].productCount || 0),
        }
      : null
    const byPublisher = (result.recordsets?.[2] || []).map((r) => ({
      id: String(r.id),
      code: r.codigo,
      name: r.nombre,
      status: toFeStatus(r.estado),
      productCount: Number(r.productCount || 0),
    }))
    const expiringSoon = (result.recordsets?.[3] || []).map((r) => ({
      id: String(r.id),
      code: r.codigo,
      name: r.nombre,
      contractType: r.tipo_contrato || '',
      contractExpiry: r.fecha_vencimiento ? String(r.fecha_vencimiento).slice(0, 10) : '',
      status: toFeStatus(r.estado),
      daysRemaining: Number(r.diasRestantes),
    }))
    return {
      total: Number(summary.total || 0),
      active: Number(summary.activas || 0),
      inactive: Number(summary.inactivas || 0),
      withoutProducts: Number(summary.sinProductos || 0),
      contractsExpired: Number(summary.contratosVencidos || 0),
      contractsExpiring: Number(summary.contratosPorVencer || 0),
      contractsActive: Number(summary.contratosVigentes || 0),
      topByProducts: topPublisher,
      productsByPublisher: byPublisher,
      expiringSoon,
    }
  } catch (err) {
    throw mapSqlError(err)
  }
}

async function listProducts({ editorialId, q }) {
  try {
    const result = await execProc('dbo.sp_Editorial_Productos', (req, s) => {
      req.input('editorial_id', s.Int, editorialId ? Number(editorialId) : null)
      req.input('q', s.NVarChar(100), q || null)
    })
    return (result.recordset || []).map((r) => ({
      id: String(r.id),
      code: r.codigo,
      isbn: r.isbn || '',
      title: r.titulo,
      author: r.autor || '',
      category: r.categoria || '',
      publisherId: String(r.editorial_id),
      publisher: r.editorial || '',
      stock: Number(r.stock || 0),
      status: toFeStatus(r.estado),
      price: Number(r.precio || 0),
    }))
  } catch (err) {
    throw mapSqlError(err)
  }
}

module.exports = {
  mapRow,
  findPage,
  search,
  findById,
  insert,
  update,
  updateEstado,
  dashboard,
  listProducts,
}
