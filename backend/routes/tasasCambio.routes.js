const express = require('express')
const ctrl = require('../controllers/tasasCambio.controller')

const router = express.Router()

router.get('/', ctrl.list)
router.get('/:id', ctrl.getById)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.patch('/:id/estado', ctrl.patchEstado)

module.exports = router
