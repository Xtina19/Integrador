import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import {
  createInventarioComposition,
  seedInventarioJoselitoCompleto,
} from '../../../../inventario/infrastructure/composition/createInventarioComposition'
import {
  createVentasComposition,
  type VentasComposition,
} from '../../composition/createVentasComposition'
import { createVentasRouter } from './routes/ventasRoutes'
import { sendHttpError } from './errorHandler'
import { ventasOpenApiDocument } from '../openapi/ventasOpenApi'

/** App Express aislada para pruebas del módulo Ventas (sin legacy). */
export function createVentasHttpApp(composition?: VentasComposition): {
  app: Express
  composition: VentasComposition
} {
  let comp = composition
  if (!comp) {
    const inventario = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(inventario)
    comp = createVentasComposition({ sequentialIds: true, inventario })
  }

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/live', (_req, res) => {
    res.status(200).json({ status: 'alive', module: 'ventas' })
  })

  app.get('/ready', (_req, res) => {
    const ready = !!comp!.ventaService && !!comp!.handlers
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      module: 'ventas',
    })
  })

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      module: 'ventas',
      persistence: 'in-memory',
      uptimeSec: Math.floor(process.uptime()),
    })
  })

  app.get('/api/v1/ventas/openapi.json', (_req, res) => {
    res.status(200).json(ventasOpenApiDocument)
  })

  app.get('/api/v1/ventas/docs', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(`<!doctype html>
<html>
  <head>
    <title>LibroSys Ventas API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/v1/ventas/openapi.json',
        dom_id: '#swagger-ui'
      })
    </script>
  </body>
</html>`)
  })

  app.use('/api/v1/ventas', createVentasRouter(comp!))

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return
    sendHttpError(
      res,
      500,
      'UNEXPECTED',
      err instanceof Error ? err.message : 'Error inesperado',
    )
  })

  return { app, composition: comp! }
}
