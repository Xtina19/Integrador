/**
 * Repository: numeracion_documentos
 * Persistencia de correlativos (lock + incremento). Sin formato de código de negocio.
 *
 * Concurrencia (FASE 9):
 *   1. ensureRow — INSERT tolerante a carrera (UNIQUE tipo+anio).
 *   2. SELECT … FOR UPDATE — bloquea la fila dentro de la TX del caller.
 *   3. UPDATE ultimo_numero — incremento serializado por el lock.
 */

const model = require('../../models/compras/numeracionDocumentos.model')
const { query } = require('../../helpers/dbExecutor')
const { assertConn, buildInsert, buildUpdate } = require('./_sql')
const { DatabaseError, DATABASE_CODES, AppError } = require('../../errors')

const { TABLE, fromRow, toInsert, toUpdate } = model

async function findByTipoAnio(tipoDocumento, anio, conn = null) {
  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE tipo_documento = ? AND anio = ? LIMIT 1`,
    [tipoDocumento, anio],
    conn
  )
  return rows.length ? fromRow(rows[0]) : null
}

async function ensureRow(tipoDocumento, anio, conn = null) {
  const existing = await findByTipoAnio(tipoDocumento, anio, conn)
  if (existing) return existing

  try {
    const { sql, params } = buildInsert(TABLE, toInsert({ tipoDocumento, anio, ultimoNumero: 0 }))
    await query(sql, params, conn)
  } catch (err) {
    // Carrera: otra TX insertó la misma clave UNIQUE — continuar al FOR UPDATE.
    const isDup =
      err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY
    if (!isDup) throw err
  }

  return findByTipoAnio(tipoDocumento, anio, conn)
}

/**
 * Bloquea la fila y incrementa ultimo_numero.
 * @param {import('mysql2/promise').PoolConnection} conn Conexión en transacción (obligatoria).
 * @returns {{ tipoDocumento: string, anio: number, numero: number }}
 */
async function lockAndIncrement(tipoDocumento, anio, conn) {
  assertConn(conn, 'lockAndIncrement')

  await ensureRow(tipoDocumento, anio, conn)

  const { rows } = await query(
    `SELECT * FROM ${TABLE} WHERE tipo_documento = ? AND anio = ? FOR UPDATE`,
    [tipoDocumento, anio],
    conn
  )
  if (!rows.length) {
    throw new AppError('COMMON_INTERNAL_ERROR', {
      message: 'Ocurrió un error inesperado. Intente de nuevo.',
      developerMessage: `[ComprasRepository] lockAndIncrement: fila no encontrada (${tipoDocumento}/${anio})`,
      httpStatus: 500,
    })
  }

  const current = fromRow(rows[0])
  const next = current.ultimoNumero + 1
  const patch = toUpdate({ ultimoNumero: next })
  const upd = buildUpdate(TABLE, patch, current.id)
  await query(upd.sql, upd.params, conn)

  return {
    tipoDocumento,
    anio: Number(anio),
    numero: next,
  }
}

module.exports = {
  lockAndIncrement,
}
