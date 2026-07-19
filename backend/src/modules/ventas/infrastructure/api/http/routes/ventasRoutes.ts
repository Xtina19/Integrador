import { Router, type Request, type Response, type NextFunction } from 'express'
import type { VentasComposition } from '../../../composition/createVentasComposition'
import { VentasController } from '../controllers/VentasController'
import { createVentasAuthMiddleware } from '../middleware/authMiddleware'
import { sendHttpError } from '../errorHandler'
import { ValidationError } from '../validators/ventaHttpValidators'

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res).catch((error) => {
      if (error instanceof ValidationError) {
        sendHttpError(res, 400, 'VALIDATION', error.message)
        return
      }
      next(error)
    })
  }
}

/**
 * Rutas versionadas del módulo Ventas.
 * Base mount esperado: `/api/v1/ventas`
 */
export function createVentasRouter(composition: VentasComposition): Router {
  const router = Router()
  const controller = new VentasController(composition)
  const auth = createVentasAuthMiddleware(composition)

  // Emisión / pagos (antes de /:id)
  router.post('/', auth('emitir'), asyncHandler((req, res) => controller.emitir(req, res)))
  router.post(
    '/pago',
    auth('emitir'),
    asyncHandler((req, res) => controller.registrarPago(req, res)),
  )
  router.post(
    '/pago-mixto',
    auth('emitir'),
    asyncHandler((req, res) => controller.registrarPagoMixto(req, res)),
  )

  // Listado y búsqueda de cliente
  router.get('/', auth('consultar'), asyncHandler((req, res) => controller.listar(req, res)))
  router.get(
    '/clientes/buscar',
    auth('buscar_cliente'),
    asyncHandler((req, res) => controller.buscarCliente(req, res)),
  )
  router.get(
    '/notas-credito/disponibles',
    auth('nota_credito'),
    asyncHandler((req, res) => controller.listarNotasCreditoDisponibles(req, res)),
  )
  /** Listado administrativo (consulta). Emisión sigue solo en POST /:id/notas-credito. */
  router.get(
    '/notas-credito',
    auth('consultar'),
    asyncHandler((req, res) => controller.listarNotasCredito(req, res)),
  )
  router.get(
    '/por-numero/:numero',
    auth('consultar'),
    asyncHandler((req, res) => controller.detallePorNumero(req, res)),
  )

  // Detalle y postventa
  router.get('/:id', auth('consultar'), asyncHandler((req, res) => controller.detalle(req, res)))
  router.get(
    '/:id/historial',
    auth('consultar'),
    asyncHandler((req, res) => controller.historial(req, res)),
  )
  router.get(
    '/:id/inventario',
    auth('consultar'),
    asyncHandler((req, res) => controller.inventarioRelacionado(req, res)),
  )
  router.post(
    '/:id/reimprimir',
    auth('reimprimir'),
    asyncHandler((req, res) => controller.reimprimir(req, res)),
  )
  router.post(
    '/:id/cambios',
    auth('cambio'),
    asyncHandler((req, res) => controller.registrarCambio(req, res)),
  )
  router.post(
    '/:id/notas-credito',
    auth('nota_credito'),
    asyncHandler((req, res) => controller.emitirNotaCredito(req, res)),
  )
  router.post(
    '/:id/notas-credito/:ncId/anular',
    auth('nota_credito'),
    asyncHandler((req, res) => controller.anularNotaCredito(req, res)),
  )
  router.post(
    '/:id/notas-credito/:ncId/revertir-aplicaciones',
    auth('nota_credito'),
    asyncHandler((req, res) => controller.revertirAplicacionesNotaCredito(req, res)),
  )
  router.post(
    '/:id/anular',
    auth('anular'),
    asyncHandler((req, res) => controller.cancelar(req, res)),
  )
  router.post(
    '/:id/cancelar',
    auth('anular'),
    asyncHandler((req, res) => controller.cancelar(req, res)),
  )

  return router
}
