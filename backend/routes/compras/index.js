/**
 * Router raíz del módulo Compras.
 *
 * Prefijos montados (server.js):
 *   /api/compras
 *   /api/v1/compras   (alias REST alineado a Ventas)
 *
 * Recursos (nomenclatura REST en español, plural):
 *   GET|POST          /condiciones-pago
 *   GET|PUT|PATCH     /condiciones-pago/:id
 *   GET|POST          /ordenes
 *   GET|PUT           /ordenes/:id
 *   POST              /ordenes/:id/{enviar-aprobacion|aprobar|cancelar|cerrar}
 *   GET|POST          /recepciones
 *   GET|PUT           /recepciones/:id
 *   POST              /recepciones/:id/{confirmar|anular}
 *   GET|POST          /facturas
 *   GET               /facturas/por-orden/:ordenId
 *   GET|PUT           /facturas/:id
 *   POST              /facturas/:id/anular
 *
 * Pipeline: [criticalWrite?] → validate(http.*) → asyncHandler(controller) → service → repository
 *
 * Autorización (FASE 8): mutaciones usan requireComprasActor + requireComprasRole(ADMIN|COMPRAS).
 * Lecturas: authPlaceholder en el mount (actor opcional).
 */
const { Router } = require('express')

const router = Router()

router.use('/condiciones-pago', require('./condicionesPago.routes'))
router.use('/ordenes', require('./ordenCompra.routes'))
router.use('/recepciones', require('./recepcion.routes'))
router.use('/facturas', require('./facturaProveedor.routes'))

module.exports = router
