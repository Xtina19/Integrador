/**
 * Utilidades internas de services Compras (tx, auditoría, traducción DB).
 *
 * Patrón transaccional unificado:
 *   return await withTransaction(async (conn) => {
 *     // todas las escrituras + audit(..., conn) con la misma conn
 *   })
 */

const { getMysqlPool } = require('../../db-mysql')
const { registrarAuditoria } = require('../../lib/auditHelper')
const { DatabaseError, DATABASE_CODES, PurchaseError, ValidationError, AppError } = require('../../errors')

async function withTransaction(work) {
  const pool = getMysqlPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await work(conn)
    await conn.commit()
    return result
  } catch (err) {
    try {
      await conn.rollback()
    } catch (_) {
      /* ignore */
    }
    throw err
  } finally {
    conn.release()
  }
}

/**
 * Auditoría en la misma conexión que la TX cuando se pasa `conn`.
 * Sin `conn`, usa el pool (solo lecturas / casos excepcionales).
 * registrarAuditoria sigue siendo best-effort (errores silenciados).
 *
 * @param {number|null} actorUserId
 * @param {{ entidad: string, entidadId: number|string, accion: string, descripcion?: string }} payload
 * @param {import('mysql2/promise').PoolConnection|null} [conn]
 */
async function audit(actorUserId, payload, conn = null) {
  await registrarAuditoria(conn || getMysqlPool(), {
    modulo: 'compras',
    entidad: payload.entidad,
    entidadId: payload.entidadId,
    accion: payload.accion,
    descripcion: payload.descripcion,
    usuarioId: actorUserId || null,
  })
}

function translateDbError(err, map = {}) {
  if (!(err instanceof DatabaseError)) throw err
  if (err.code === DATABASE_CODES.DUPLICATE_KEY && map.duplicate) {
    throw map.duplicate
  }
  if (err.code === DATABASE_CODES.FOREIGN_KEY && map.foreignKey) {
    throw map.foreignKey
  }
  throw new AppError('COMMON_INTERNAL_ERROR', {
    message: 'Ocurrió un error inesperado. Intente de nuevo.',
    developerMessage: err.developerMessage || err.message,
    httpStatus: 500,
    cause: err,
    details: { databaseCode: err.code },
  })
}

/**
 * Totales de línea (cálculo). La forma/rango de cantidades ya fue validada en domain validators.
 */
function lineTotals(line) {
  const qty = Number(line.cantidadSolicitada ?? line.cantidad)
  const costo = Number(line.costoUnitario)
  const descuento = Number(line.descuento ?? 0)
  const impuesto = Number(line.impuesto ?? 0)
  const subtotal = qty * costo - descuento + impuesto
  return { qty, costo, descuento, impuesto, subtotal: Math.round(subtotal * 100) / 100 }
}

function headerFromLines(lines) {
  let subtotal = 0
  let descuento = 0
  let impuestos = 0
  for (const l of lines) {
    subtotal += Number(l.subtotal) || 0
    descuento += Number(l.descuento) || 0
    impuestos += Number(l.impuesto) || 0
  }
  const total = Math.round((subtotal) * 100) / 100
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    descuento: Math.round(descuento * 100) / 100,
    impuestos: Math.round(impuestos * 100) / 100,
    total,
  }
}

module.exports = {
  withTransaction,
  audit,
  translateDbError,
  lineTotals,
  headerFromLines,
  PurchaseError,
  ValidationError,
  AppError,
  DatabaseError,
  DATABASE_CODES,
}
