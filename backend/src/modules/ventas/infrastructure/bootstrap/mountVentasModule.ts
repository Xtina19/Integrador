/**
 * Monta el módulo Ventas (DDD) sobre el Express legacy.
 * Base path: `/api/v1/ventas`
 */
import type { Express, Request, Response, NextFunction } from 'express'
import type { InventarioComposition } from '../../../inventario/infrastructure/composition/createInventarioComposition'
import { createVentasComposition } from '../composition/createVentasComposition'
import { createVentasRouter } from '../api/http/routes/ventasRoutes'
import { sendHttpError } from '../api/http/errorHandler'
import { ventasOpenApiDocument } from '../api/openapi/ventasOpenApi'

let mounted = false

export function mountVentasModule(
  legacyApp: Express,
  inventario?: InventarioComposition,
): void {
  if (mounted) return

  if (!inventario) {
    throw new Error(
      '[Ventas] requiere la composición de Inventario (Inventory Engine). Monte Inventario primero.',
    )
  }

  const composition = createVentasComposition({
    sequentialIds: false,
    seedJoselito: true,
    inventario,
  })

  legacyApp.get('/api/v1/ventas/openapi.json', (_req, res) => {
    res.status(200).json(ventasOpenApiDocument)
  })

  legacyApp.get('/api/v1/ventas/docs', (_req, res) => {
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

  legacyApp.use('/api/v1/ventas', createVentasRouter(composition))

  legacyApp.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return
    sendHttpError(
      res,
      500,
      'UNEXPECTED',
      err instanceof Error ? err.message : 'Error inesperado',
    )
  })

  mounted = true
  console.log('[Ventas] módulo montado en /api/v1/ventas (docs: /api/v1/ventas/docs) — Inventory Engine compartido')
}
