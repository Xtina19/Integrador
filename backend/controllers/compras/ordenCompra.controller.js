const servicio = require('../../services/compras/ordenCompra.service')
const { sendSuccess, sendPaginated } = require('../../middlewares/successResponse')

async function list(req, res) {
  const { page, pageSize, filters } = req.validated
  const result = await servicio.list({ page, pageSize, ...filters })
  return sendPaginated(res, result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  }, 'Órdenes de compra listadas correctamente.')
}

async function getById(req, res) {
  const { id } = req.validated
  const result = await servicio.getById(id)
  return sendSuccess(res, result, { message: 'Orden de compra obtenida correctamente.' })
}

async function create(req, res) {
  const { input, actorUserId } = req.validated
  const result = await servicio.crear(input, actorUserId)
  return sendSuccess(res, result, {
    status: 201,
    message: 'Orden de compra registrada correctamente.',
  })
}

async function update(req, res) {
  const { id, input, actorUserId } = req.validated
  const result = await servicio.actualizar(id, input, actorUserId)
  return sendSuccess(res, result, { message: 'Orden de compra actualizada correctamente.' })
}

async function enviarAprobacion(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.enviarAprobacion(id, actorUserId)
  return sendSuccess(res, result, { message: 'Orden enviada a aprobación.' })
}

async function aprobar(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.aprobar(id, actorUserId)
  return sendSuccess(res, result, { message: 'Orden de compra aprobada.' })
}

async function cancelar(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.cancelar(id, actorUserId)
  return sendSuccess(res, result, { message: 'Orden de compra cancelada.' })
}

async function cerrar(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.cerrar(id, actorUserId)
  return sendSuccess(res, result, { message: 'Orden de compra cerrada.' })
}

module.exports = {
  list,
  getById,
  create,
  update,
  enviarAprobacion,
  aprobar,
  cancelar,
  cerrar,
}
