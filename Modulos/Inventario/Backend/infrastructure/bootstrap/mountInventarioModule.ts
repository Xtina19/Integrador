/**
 * Monta el módulo Inventario (DDD) sobre el Express legacy.
 * Persistencia durable de conteos en data/inventario/conteo_fisico_store.json
 * (espejo de las tablas MySQL 22_conteo_fisico_dominio.sql).
 */
import type { Express, Request, Response, NextFunction } from 'express'
import {
  createInventarioComposition,
  seedInventarioJoselitoCompleto,
  type InventarioComposition,
} from '../composition/createInventarioComposition'
import { createInventarioRouter } from '../api/http/routes/inventarioRoutes'
import { requestObservabilityMiddleware } from '../observability/requestContext'
import { sendHttpError } from '../api/http/errorHandler'
import { inventarioOpenApiDocument } from '../api/openapi/inventarioOpenApi'

let mounted = false
let sharedComposition: InventarioComposition | null = null

export function getInventarioComposition(): InventarioComposition | null {
  return sharedComposition
}

export function mountInventarioModule(legacyApp: Express): InventarioComposition {
  if (mounted && sharedComposition) return sharedComposition

  const composition = createInventarioComposition({ durableConteo: true, durableDescarte: true })
  seedInventarioJoselitoCompleto(composition)
  composition.auth.grant('admin', '*')
  composition.auth.grant('inventario', '*')
  composition.auth.grant('user-1', '*')

  legacyApp.use(requestObservabilityMiddleware(composition.logger, composition.metrics))

  legacyApp.get('/api/inventario/openapi.json', (_req, res) => {
    res.status(200).json(inventarioOpenApiDocument)
  })

  legacyApp.use('/api/inventario', createInventarioRouter(composition))

  legacyApp.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return
    req.observability?.logger.error('unhandled_error', {
      event: 'unhandled_error',
      error: err instanceof Error ? err.message : String(err),
    })
    sendHttpError(
      res,
      500,
      'UNEXPECTED',
      err instanceof Error ? err.message : 'Error inesperado',
    )
  })

  mounted = true
  sharedComposition = composition
  composition.logger.info('inventario_module_mounted', {
    event: 'inventario_module_mounted',
    basePath: '/api/inventario',
  })
  return composition
}
