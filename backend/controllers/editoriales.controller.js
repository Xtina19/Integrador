const service = require('../services/editoriales.service')
const { sendOk, sendError } = require('../lib/response')
const { parseListQuery } = require('../lib/pagination')

function handleError(res, e) {
  const status = e.status || 500
  const message =
    status >= 500
      ? 'No fue posible completar la operación en este momento.'
      : e.message || 'Error interno'
  return sendError(res, status, message)
}

async function list(req, res) {
  try {
    sendOk(res, await service.list(parseListQuery(req)))
  } catch (e) {
    handleError(res, e)
  }
}

async function search(req, res) {
  try {
    sendOk(res, await service.search(req.query))
  } catch (e) {
    handleError(res, e)
  }
}

async function dashboard(req, res) {
  try {
    sendOk(res, await service.dashboard())
  } catch (e) {
    handleError(res, e)
  }
}

async function listProducts(req, res) {
  try {
    sendOk(res, await service.listProducts(req.query))
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

module.exports = {
  list,
  search,
  dashboard,
  listProducts,
  getById,
  create,
  update,
  patchEstado,
}
