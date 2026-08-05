const domain = require('../domain/ordenCompra.domain.validator')
const { actorFromReq, parseIdParam, parseListQuery } = require('./common')
const { ESTADO, TIPO_COMPRA } = require('../../../models/compras/ordenCompra.model')
const { optionalEnum } = require('../domain/common')

function parseList(req) {
  const { page, pageSize, filters, rawQuery } = parseListQuery(req)
  if (rawQuery.proveedorId) filters.proveedorId = Number(rawQuery.proveedorId)
  if (rawQuery.tipoCompra) {
    filters.tipoCompra = optionalEnum(rawQuery.tipoCompra, 'tipoCompra', Object.values(TIPO_COMPRA))
  }
  if (rawQuery.estado) {
    filters.estado = optionalEnum(rawQuery.estado, 'estado', Object.values(ESTADO))
  }
  if (rawQuery.fechaDesde) filters.fechaDesde = String(rawQuery.fechaDesde)
  if (rawQuery.fechaHasta) filters.fechaHasta = String(rawQuery.fechaHasta)
  return { page, pageSize, filters, actorUserId: actorFromReq(req) }
}

function parseGetById(req) {
  return { id: parseIdParam(req.params.id), actorUserId: actorFromReq(req) }
}

function parseCreate(req) {
  const input = domain.validateCreate(req.body || {})
  return { input, actorUserId: actorFromReq(req) }
}

function parseUpdate(req) {
  const id = parseIdParam(req.params.id)
  const input = domain.validateUpdate(req.body || {})
  return { id, input, actorUserId: actorFromReq(req) }
}

/** Acciones de ciclo: aprobar, cancelar, cerrar, enviar-aprobacion */
function parseActionId(req) {
  return { id: parseIdParam(req.params.id), actorUserId: actorFromReq(req) }
}

module.exports = {
  parseList,
  parseGetById,
  parseCreate,
  parseUpdate,
  parseActionId,
}
