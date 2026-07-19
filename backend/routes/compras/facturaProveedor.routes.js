const { Router } = require('express')
const { asyncHandler } = require('../../middlewares/asyncHandler')
const { validate } = require('../../middlewares/validate')
const { criticalWrite } = require('../../middlewares/comprasAuth')
const ctrl = require('../../controllers/compras/facturaProveedor.controller')
const http = require('../../validators/compras/http/facturaProveedor.http.validator')

const router = Router()

router.get('/', validate(http.parseList), asyncHandler(ctrl.list))
// Debe ir antes de /:id para no capturar "por-orden" como id
router.get('/por-orden/:ordenId', validate(http.parseByOrdenId), asyncHandler(ctrl.getByOrden))
router.get('/:id', validate(http.parseGetById), asyncHandler(ctrl.getById))
router.post('/', ...criticalWrite, validate(http.parseRegistrar), asyncHandler(ctrl.create))
router.put('/:id', ...criticalWrite, validate(http.parseUpdate), asyncHandler(ctrl.update))
router.post('/:id/anular', ...criticalWrite, validate(http.parseAnular), asyncHandler(ctrl.anular))

module.exports = router
