const domain = require('../domain/condicionPago.domain.validator')
const { actorFromReq, parseIdParam, parseListQuery } = require('./common')
const { ESTADO } = require('../../../models/compras/condicionPago.model')
const { fail } = require('../domain/common')

function parseList(req) {
  const { page, pageSize, filters } = parseListQuery(req)
  return { page, pageSize, ...filters, actorUserId: actorFromReq(req) }
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

function parseSetEstado(req) {
  const id = parseIdParam(req.params.id)
  const estado = (req.body && req.body.estado) || req.params.estado
  if (!Object.values(ESTADO).includes(estado)) {
    fail('VALIDATION_INVALID_FORMAT', 'estado inválido', { field: 'estado', allowed: Object.values(ESTADO) })
  }
  return { id, estado, actorUserId: actorFromReq(req) }
}

module.exports = {
  parseList,
  parseGetById,
  parseCreate,
  parseUpdate,
  parseSetEstado,
}
