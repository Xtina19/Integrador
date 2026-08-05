const domain = require('../domain/recepcion.domain.validator')
const { actorFromReq, parseIdParam, parseListQuery } = require('./common')
const { ESTADO } = require('../../../models/compras/recepcion.model')
const { optionalEnum } = require('../domain/common')

function parseList(req) {
  const { page, pageSize, filters, rawQuery } = parseListQuery(req)
  if (rawQuery.ordenCompraId) filters.ordenCompraId = Number(rawQuery.ordenCompraId)
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

function parseConfirm(req) {
  const id = parseIdParam(req.params.id)
  const input = domain.validateConfirm(req.body || {})
  return { id, input, actorUserId: actorFromReq(req) }
}

function parseAnular(req) {
  return { id: parseIdParam(req.params.id), actorUserId: actorFromReq(req) }
}

module.exports = {
  parseList,
  parseGetById,
  parseCreate,
  parseUpdate,
  parseConfirm,
  parseAnular,
}
