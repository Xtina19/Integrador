/**
 * Resolución de tasa de cambio desde el catálogo ERP (monedas + tasas_cambio).
 * No hardcodea tasas: consulta la vigente origen → destino (default DOP).
 */
const { getMysqlPool } = require('../../db-mysql')
const { PurchaseError } = require('../../errors')

/**
 * @param {number} monedaId
 * @param {{ destinoCodigo?: string, fecha?: string|Date|null, conn?: import('mysql2/promise').PoolConnection|null }} [opts]
 * @returns {Promise<number>}
 */
async function resolveTasaCambio(monedaId, opts = {}) {
  const destinoCodigo = String(opts.destinoCodigo || 'DOP').toUpperCase()
  const pool = opts.conn || getMysqlPool()

  const [monedas] = await pool.query(`SELECT id, codigo FROM monedas WHERE id = ?`, [Number(monedaId)])
  const origen = monedas[0]
  if (!origen) {
    throw new PurchaseError('PURCHASE_CURRENCY_NOT_FOUND', {
      message: 'Moneda no encontrada en el catálogo del ERP.',
      developerMessage: `monedaId=${monedaId}`,
      httpStatus: 404,
    })
  }

  const origenCodigo = String(origen.codigo).toUpperCase()
  if (origenCodigo === destinoCodigo) {
    return 1
  }

  const [destRows] = await pool.query(`SELECT id FROM monedas WHERE codigo = ? LIMIT 1`, [destinoCodigo])
  const destinoId = destRows[0]?.id
  if (!destinoId) {
    throw new PurchaseError('PURCHASE_CURRENCY_NOT_FOUND', {
      message: `Moneda destino ${destinoCodigo} no configurada.`,
      developerMessage: `destinoCodigo=${destinoCodigo}`,
      httpStatus: 404,
    })
  }

  const fecha = opts.fecha ? new Date(opts.fecha) : new Date()
  const fechaSql = Number.isNaN(fecha.getTime())
    ? new Date().toISOString().slice(0, 19).replace('T', ' ')
    : fecha.toISOString().slice(0, 19).replace('T', ' ')

  const [tasas] = await pool.query(
    `SELECT tasa
     FROM tasas_cambio
     WHERE moneda_origen_id = ?
       AND moneda_destino_id = ?
       AND estado = 'activa'
       AND vigente_desde <= ?
       AND (vigente_hasta IS NULL OR vigente_hasta >= ?)
     ORDER BY vigente_desde DESC
     LIMIT 1`,
    [origen.id, destinoId, fechaSql, fechaSql]
  )

  if (!tasas[0]) {
    throw new PurchaseError('PURCHASE_EXCHANGE_RATE_NOT_FOUND', {
      message: `No hay tasa de cambio vigente ${origenCodigo} → ${destinoCodigo}. Configure tasas en Administración.`,
      developerMessage: `origenId=${origen.id} destinoId=${destinoId} fecha=${fechaSql}`,
      httpStatus: 422,
    })
  }

  const tasa = Number(tasas[0].tasa)
  if (!(tasa > 0)) {
    throw new PurchaseError('PURCHASE_EXCHANGE_RATE_INVALID', {
      message: 'La tasa de cambio vigente no es válida.',
      developerMessage: `tasa=${tasas[0].tasa}`,
      httpStatus: 422,
    })
  }

  return tasa
}

/**
 * Si el cliente envía tasaCambio > 0 la respeta; si no, resuelve desde catálogo.
 * @param {number} monedaId
 * @param {number|null|undefined} tasaInput
 * @param {{ destinoCodigo?: string, fecha?: string|Date|null, conn?: import('mysql2/promise').PoolConnection|null }} [opts]
 */
async function resolveTasaCambioOrInput(monedaId, tasaInput, opts = {}) {
  const n = tasaInput != null ? Number(tasaInput) : NaN
  if (Number.isFinite(n) && n > 0) return n
  return resolveTasaCambio(monedaId, opts)
}

module.exports = { resolveTasaCambio, resolveTasaCambioOrInput }
