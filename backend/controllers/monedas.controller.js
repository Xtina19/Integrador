const service = require('../services/monedas.service')
const { sendOk, sendError } = require('../lib/response')

function handleError(res, e) {
  return sendError(res, e.status || 500, e.message)
}

async function list(req, res) {
  try {
    sendOk(res, await service.list())
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

async function remove(req, res) {
  try {
    sendOk(res, await service.remove(req, req.params.id))
  } catch (e) {
    handleError(res, e)
  }
}

module.exports = { list, getById, create, update, patchEstado, remove }
