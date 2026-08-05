const servicio = require('../../services/compras/recepcion.service')
const { sendSuccess, sendPaginated } = require('../../middlewares/successResponse')

async function list(req, res) {
  const { page, pageSize, filters } = req.validated
  const result = await servicio.list({ page, pageSize, ...filters })
  return sendPaginated(res, result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  }, 'Recepciones listadas correctamente.')
}

async function getById(req, res) {
  const { id } = req.validated
  const result = await servicio.getById(id)
  return sendSuccess(res, result, { message: 'Recepción obtenida correctamente.' })
}

async function create(req, res) {
  const { input, actorUserId } = req.validated
  const result = await servicio.crear(input, actorUserId)
  return sendSuccess(res, result, {
    status: 201,
    message: 'Recepción registrada correctamente.',
  })
}

async function update(req, res) {
  const { id, input, actorUserId } = req.validated
  const result = await servicio.actualizar(id, input, actorUserId)
  return sendSuccess(res, result, { message: 'Recepción actualizada correctamente.' })
}

async function confirm(req, res) {
  const { id, input, actorUserId } = req.validated
  const result = await servicio.confirmar(id, input, actorUserId)
  return sendSuccess(res, result, { message: 'Recepción confirmada correctamente.' })
}

async function anular(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.anular(id, actorUserId)
  return sendSuccess(res, result, { message: 'Recepción anulada correctamente.' })
}

module.exports = {
  list,
  getById,
  create,
  update,
  confirm,
  anular,
}
