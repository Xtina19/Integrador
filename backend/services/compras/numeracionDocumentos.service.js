/**
 * Service: numeración de documentos Compras (única fuente de códigos OC / REC / FP).
 * No abre transacciones propias — exige conn externa.
 * Formato de código de negocio: TYPE-YYYY-######
 *
 * FASE 7: no existe generación paralela. OrdenCompra, Recepción y FacturaProveedor
 * deben llamar únicamente a generarCodigo() dentro de withTransaction.
 */

const numeracionRepo = require('../../repositories/compras/numeracionDocumentos.repository')
const { TIPO_DOCUMENTO } = require('../../models/compras/numeracionDocumentos.model')
const { PurchaseError, ValidationError, AppError } = require('../../errors')

const TIPOS_VALIDOS = new Set(Object.values(TIPO_DOCUMENTO))

function formatCodigo(tipoDocumento, anio, numero) {
  return `${tipoDocumento}-${anio}-${String(numero).padStart(6, '0')}`
}

/**
 * @param {'OC'|'REC'|'FP'} tipoDocumento
 * @param {import('mysql2/promise').PoolConnection} conn Obligatoria (transacción del caller).
 * @param {number} [anio]
 * @returns {Promise<{ tipoDocumento: string, anio: number, numero: number, codigo: string }>}
 */
async function generarCodigo(tipoDocumento, conn, anio = new Date().getFullYear()) {
  if (!conn) {
    throw new AppError('COMMON_INTERNAL_ERROR', {
      message: 'Ocurrió un error inesperado. Intente de nuevo.',
      developerMessage:
        '[numeracionDocumentos.service] generarCodigo requiere una conexión transaccional (conn).',
      httpStatus: 500,
    })
  }
  if (!TIPOS_VALIDOS.has(tipoDocumento)) {
    throw new ValidationError('VALIDATION_INVALID_FORMAT', {
      message: 'El formato de uno de los datos no es válido.',
      developerMessage: `tipoDocumento inválido: ${tipoDocumento}`,
      details: { field: 'tipoDocumento' },
    })
  }

  try {
    const { tipoDocumento: tipo, anio: year, numero } = await numeracionRepo.lockAndIncrement(
      tipoDocumento,
      Number(anio),
      conn
    )
    return {
      tipoDocumento: tipo,
      anio: year,
      numero,
      codigo: formatCodigo(tipo, year, numero),
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new PurchaseError('PURCHASE_NUMERATION_FAILED', {
      message: 'No se pudo asignar el número del documento.',
      developerMessage: err.message || 'Fallo al generar correlativo',
      httpStatus: 500,
      cause: err,
    })
  }
}

module.exports = {
  generarCodigo,
  TIPO_DOCUMENTO,
  formatCodigo,
}
