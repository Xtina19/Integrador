const service = require('../services/productos.service')
const { sendOk, sendError } = require('../lib/response')
const { parseListQuery } = require('../lib/pagination')

function handleError(res, e) {
  return sendError(res, e.status || 500, e.message)
}

async function list(req, res) {
  try {
    sendOk(res, await service.list(parseListQuery(req)))
  } catch (e) {
    handleError(res, e)
  }
}

async function getById(req, res) {
  try {
    sendOk(res, await service.getById(req.params.id))
  } catch (e) {
    handleError(res, e)
  }
}

async function create(req, res) {
  try {
    sendOk(res, await service.create(req, req.body), 201)
  } catch (e) {
    handleError(res, e)
  }
}

async function update(req, res) {
  try {
    sendOk(res, await service.update(req, req.params.id, req.body))
  } catch (e) {
    handleError(res, e)
  }
}

async function patchEstado(req, res) {
  try {
    sendOk(res, await service.patchEstado(req, req.params.id, req.body))
  } catch (e) {
    handleError(res, e)
  }
}

module.exports = { list, getById, create, update, patchEstado }
