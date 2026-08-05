const servicio = require('../../services/compras/condicionesPago.service')
const { sendSuccess, sendPaginated } = require('../../middlewares/successResponse')

async function list(req, res) {
  const { actorUserId, ...query } = req.validated
  const result = await servicio.list(query)
  return sendPaginated(res, result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  }, 'Condiciones de pago listadas correctamente.')
}

async function getById(req, res) {
  const { id } = req.validated
  const result = await servicio.getById(id)
  return sendSuccess(res, result, { message: 'Condición de pago obtenida correctamente.' })
}

async function create(req, res) {
  const { input, actorUserId } = req.validated
  const result = await servicio.create(input, actorUserId)
  return sendSuccess(res, result, {
    status: 201,
    message: 'Condición de pago creada correctamente.',
  })
}

async function update(req, res) {
  const { id, input, actorUserId } = req.validated
  const result = await servicio.update(id, input, actorUserId)
  return sendSuccess(res, result, { message: 'Condición de pago actualizada correctamente.' })
}

async function setEstado(req, res) {
  const { id, estado, actorUserId } = req.validated
  const result = await servicio.setEstado(id, estado, actorUserId)
  return sendSuccess(res, result, { message: 'Estado de condición de pago actualizado.' })
}

module.exports = {
  list,
  getById,
  create,
  update,
  setEstado,
}
