import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import {
  createInventarioComposition,
  InventarioComposition,
  seedInventarioBasico,
} from '../../composition/createInventarioComposition'
import { createInventarioRouter } from './routes/inventarioRoutes'
import { sendHttpError } from './errorHandler'
import { requestObservabilityMiddleware } from '../../observability/requestContext'
import { inventarioOpenApiDocument } from '../openapi/inventarioOpenApi'

export function createInventarioHttpApp(
  composition?: InventarioComposition,
): { app: Express; composition: InventarioComposition } {
  const comp =
    composition ??
    createInventarioComposition({
      sequentialIds: true,
      fixedClock: new Date('2026-07-18T16:00:00.000Z'),
    })

  if (!composition) {
    seedInventarioBasico(comp.db)
    comp.auth.grant('user-1', '*')
    comp.auth.grant('supervisor-1', '*')
    comp.auth.grant('user-2', '*')
  }

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(requestObservabilityMiddleware(comp.logger, comp.metrics))

  /** Liveness: proceso vivo */
  app.get('/live', (_req, res) => {
    res.status(200).json({ status: 'alive', module: 'inventario' })
  })

  /** Readiness: listo para recibir tráfico */
  app.get('/ready', (_req, res) => {
    const ready = !!comp.db && !!comp.transferenciaService
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      module: 'inventario',
      checks: {
        databaseAdapter: !!comp.db,
        applicationServices: !!comp.transferenciaService,
      },
    })
  })

  /** Health agregado */
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      module: 'inventario',
      persistence: 'in-memory',
      uptimeSec: Math.floor(process.uptime()),
    })
  })

  app.get('/metrics', (_req, res) => {
    res.status(200).json(comp.metrics.snapshot())
  })

  app.get('/api/inventario/openapi.json', (_req, res) => {
    res.status(200).json(inventarioOpenApiDocument)
  })

  app.get('/api/inventario/docs', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(`<!doctype html>
<html>
  <head>
    <title>LibroSys Inventario API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/api/inventario/openapi.json', dom_id: '#swagger-ui' });
    </script>
  </body>
</html>`)
  })

  app.use('/api/inventario', createInventarioRouter(comp))

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    req.observability?.logger.error('unhandled_error', {
      event: 'unhandled_error',
      error: err instanceof Error ? err.message : String(err),
    })
    req.observability?.metrics.increment('infra_errors', { source: 'express' })
    sendHttpError(
      res,
      500,
      'UNEXPECTED',
      err instanceof Error ? err.message : 'Error inesperado',
    )
  })

  return { app, composition: comp }
}
