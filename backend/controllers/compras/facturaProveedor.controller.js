const servicio = require('../../services/compras/facturaProveedor.service')
const { sendSuccess, sendPaginated } = require('../../middlewares/successResponse')

async function list(req, res) {
  const { page, pageSize, filters } = req.validated
  const result = await servicio.list({ page, pageSize, ...filters })
  return sendPaginated(res, result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  }, 'Facturas de proveedor listadas correctamente.')
}

async function getById(req, res) {
  const { id } = req.validated
  const result = await servicio.getById(id)
  return sendSuccess(res, result, { message: 'Factura de proveedor obtenida correctamente.' })
}

async function getByOrden(req, res) {
  const { ordenCompraId } = req.validated
  const result = await servicio.getByOrdenCompraId(ordenCompraId)
  return sendSuccess(res, result, { message: 'Factura por orden obtenida correctamente.' })
}

async function create(req, res) {
  const { input, actorUserId } = req.validated
  const result = await servicio.registrar(input, actorUserId)
  return sendSuccess(res, result, {
    status: 201,
    message: 'Factura de proveedor registrada correctamente.',
  })
}

async function update(req, res) {
  const { id, input, actorUserId } = req.validated
  const result = await servicio.actualizar(id, input, actorUserId)
  return sendSuccess(res, result, { message: 'Factura de proveedor actualizada correctamente.' })
}

async function anular(req, res) {
  const { id, actorUserId } = req.validated
  const result = await servicio.anular(id, actorUserId)
  return sendSuccess(res, result, { message: 'Factura de proveedor anulada correctamente.' })
}

module.exports = {
  list,
  getById,
  getByOrden,
  create,
  update,
  anular,
}
