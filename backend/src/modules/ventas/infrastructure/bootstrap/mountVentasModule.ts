/**
 * Monta el módulo Ventas (DDD) sobre el Express legacy.
 * Base path: `/api/v1/ventas`
 */
import type { Express, Request, Response, NextFunction } from 'express'
import type { InventarioComposition } from '../../../inventario/infrastructure/composition/createInventarioComposition'
import type {
  ClienteConsultaPort,
  ProductoConsultaPort,
  UsuarioPermisosPort,
} from '../../application/ports/outbound'
import type { SqlExecutor } from '../persistence/sql/SqlExecutor'
import { createVentasComposition } from '../composition/createVentasComposition'
import { createVentasRouter } from '../api/http/routes/ventasRoutes'
import { sendHttpError } from '../api/http/errorHandler'
import { ventasOpenApiDocument } from '../api/openapi/ventasOpenApi'

let mounted = false

export interface MountVentasOptions {
  seedJoselito?: boolean
  productos?: ProductoConsultaPort
  clientes?: ClienteConsultaPort
  permisos?: UsuarioPermisosPort
  sql?: SqlExecutor
  sqlDialect?: 'mysql' | 'mssql'
}

export function mountVentasModule(
  legacyApp: Express,
  inventario?: InventarioComposition,
  options?: MountVentasOptions,
): void {
  if (mounted) return

  if (!inventario) {
    throw new Error(
      '[Ventas] requiere la composición de Inventario (Inventory Engine). Monte Inventario primero.',
    )
  }

  const composition = createVentasComposition({
    sequentialIds: false,
    seedJoselito: options?.seedJoselito === true,
    inventario,
    productos: options?.productos,
    clientes: options?.clientes,
    permisos: options?.permisos,
    sql: options?.sql,
    sqlDialect: options?.sqlDialect,
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

  legacyApp.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return
    const anyErr = err as { type?: string; status?: number; statusCode?: number; code?: string; message?: string }
    if (
      anyErr?.type === 'entity.too.large' ||
      anyErr?.status === 413 ||
      anyErr?.statusCode === 413 ||
      anyErr?.code === 'LIMIT_FILE_SIZE' ||
      /entity too large/i.test(String(anyErr?.message || ''))
    ) {
      return sendHttpError(
        res,
        413,
        'PAYLOAD_TOO_LARGE',
        'El PDF o imagen es demasiado grande. Use un archivo de hasta 25 MB.',
      )
    }
    if (typeof next === 'function') return next(err)
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
