const { Router } = require('express')
const { asyncHandler } = require('../../middlewares/asyncHandler')
const { validate } = require('../../middlewares/validate')
const { criticalWrite } = require('../../middlewares/comprasAuth')
const ctrl = require('../../controllers/compras/condicionesPago.controller')
const http = require('../../validators/compras/http/condicionPago.http.validator')

const router = Router()

router.get('/', validate(http.parseList), asyncHandler(ctrl.list))
router.get('/:id', validate(http.parseGetById), asyncHandler(ctrl.getById))
router.post('/', ...criticalWrite, validate(http.parseCreate), asyncHandler(ctrl.create))
router.put('/:id', ...criticalWrite, validate(http.parseUpdate), asyncHandler(ctrl.update))
router.patch('/:id/estado', ...criticalWrite, validate(http.parseSetEstado), asyncHandler(ctrl.setEstado))

module.exports = router
