const domain = require('../domain/facturaProveedor.domain.validator')
const { actorFromReq, parseIdParam, parseListQuery } = require('./common')
const { ESTADO, ESTADO_PAGO } = require('../../../models/compras/facturaProveedor.model')
const { optionalEnum } = require('../domain/common')

function parseList(req) {
  const { page, pageSize, filters, rawQuery } = parseListQuery(req)
  if (rawQuery.proveedorId) filters.proveedorId = Number(rawQuery.proveedorId)
  if (rawQuery.ordenCompraId) filters.ordenCompraId = Number(rawQuery.ordenCompraId)
  if (rawQuery.estado) {
    filters.estado = optionalEnum(rawQuery.estado, 'estado', Object.values(ESTADO))
  }
  if (rawQuery.estadoPago) {
    filters.estadoPago = optionalEnum(rawQuery.estadoPago, 'estadoPago', Object.values(ESTADO_PAGO))
  }
  return { page, pageSize, filters, actorUserId: actorFromReq(req) }
}

function parseGetById(req) {
  return { id: parseIdParam(req.params.id), actorUserId: actorFromReq(req) }
}

function parseByOrdenId(req) {
  const ordenId = parseIdParam(req.params.ordenId || req.params.id, 'ordenId')
  return { ordenCompraId: ordenId, actorUserId: actorFromReq(req) }
}

function parseRegistrar(req) {
  const input = domain.validateRegistrar(req.body || {})
  return { input, actorUserId: actorFromReq(req) }
}

function parseUpdate(req) {
  const id = parseIdParam(req.params.id)
  const input = domain.validateUpdate(req.body || {})
  return { id, input, actorUserId: actorFromReq(req) }
}

function parseAnular(req) {
  return { id: parseIdParam(req.params.id), actorUserId: actorFromReq(req) }
}

module.exports = {
  parseList,
  parseGetById,
  parseByOrdenId,
  parseRegistrar,
  parseUpdate,
  parseAnular,
}
