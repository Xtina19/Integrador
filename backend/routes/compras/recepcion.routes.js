const { Router } = require('express')
const { asyncHandler } = require('../../middlewares/asyncHandler')
const { validate } = require('../../middlewares/validate')
const { criticalWrite } = require('../../middlewares/comprasAuth')
const ctrl = require('../../controllers/compras/recepcion.controller')
const http = require('../../validators/compras/http/recepcion.http.validator')

const router = Router()

router.get('/', validate(http.parseList), asyncHandler(ctrl.list))
router.get('/:id', validate(http.parseGetById), asyncHandler(ctrl.getById))
router.post('/', ...criticalWrite, validate(http.parseCreate), asyncHandler(ctrl.create))
router.put('/:id', ...criticalWrite, validate(http.parseUpdate), asyncHandler(ctrl.update))
router.post('/:id/confirmar', ...criticalWrite, validate(http.parseConfirm), asyncHandler(ctrl.confirm))
router.post('/:id/anular', ...criticalWrite, validate(http.parseAnular), asyncHandler(ctrl.anular))

module.exports = router
