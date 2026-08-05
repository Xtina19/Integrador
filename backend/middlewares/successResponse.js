/**
 * Respuesta exitosa homogénea LibroSys (Compras y módulos Express).
 *
 * Contrato canónico:
 *   { success: true, message?: string, data: T, meta?: object }
 *
 * Compatibilidad: el 3.er argumento puede ser un status HTTP (number)
 * como en llamadas existentes `sendSuccess(res, data, 201)`.
 */

/**
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number|{ status?: number, message?: string|null, meta?: object|null }} [optionsOrStatus]
 */
function sendSuccess(res, data, optionsOrStatus = 200) {
  let status = 200
  let message
  let meta

  if (typeof optionsOrStatus === 'number') {
    status = optionsOrStatus
  } else if (optionsOrStatus && typeof optionsOrStatus === 'object') {
    status = optionsOrStatus.status ?? 200
    if (optionsOrStatus.message != null) message = optionsOrStatus.message
    if (optionsOrStatus.meta != null) meta = optionsOrStatus.meta
  }

  /** @type {{ success: true, data: *, message?: string, meta?: object }} */
  const body = { success: true, data }
  if (message !== undefined) body.message = message
  if (meta !== undefined) body.meta = meta

  return res.status(status).json(body)
}

/**
 * Listados paginados: filas en `data`, paginación en `meta`.
 * @param {import('express').Response} res
 * @param {unknown[]} rows
 * @param {{ page: number, pageSize: number, total: number }} pagination
 * @param {string} [message]
 */
function sendPaginated(res, rows, pagination, message) {
  return sendSuccess(res, rows, {
    message: message ?? undefined,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
  })
}

module.exports = { sendSuccess, sendPaginated }
