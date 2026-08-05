/**
 * Model: NumeracionDocumentos
 * Tabla: numeracion_documentos
 * Mapeo BD ↔ entidad. Sin reglas de negocio ni persistencia.
 */

const TABLE = 'numeracion_documentos'

const TIPO_DOCUMENTO = Object.freeze({
  OC: 'OC',
  REC: 'REC',
  FP: 'FP',
})

function fromRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    tipoDocumento: row.tipo_documento,
    anio: Number(row.anio),
    ultimoNumero: Number(row.ultimo_numero),
    updatedAt: row.updated_at,
  }
}

function toInsert(entity) {
  return {
    tipo_documento: entity.tipoDocumento,
    anio: entity.anio,
    ultimo_numero: entity.ultimoNumero ?? 0,
  }
}

function toUpdate(entity) {
  const out = {}
  if (entity.ultimoNumero !== undefined) out.ultimo_numero = entity.ultimoNumero
  return out
}

module.exports = {
  TABLE,
  TIPO_DOCUMENTO,
  fromRow,
  toInsert,
  toUpdate,
}
