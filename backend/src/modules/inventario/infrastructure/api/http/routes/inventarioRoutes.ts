import { Request, Response, NextFunction, Router } from 'express'
import { InventarioComposition } from '../../../composition/createInventarioComposition'
import { AuthContext } from '../../../adapters/AuthorizationAdapter'
import { sendApplicationResult, sendHttpError } from '../errorHandler'
import { ValidationError } from '../validators/inputValidators'
import * as V from '../validators/inputValidators'
import { traceCommand } from '../../../observability/requestContext'
import { classifyApplicationResult } from '../../../observability/classifyResult'
import { ApplicationResult, ok } from '../../../../application/results/ApplicationResult'

function getAuth(req: Request): AuthContext {
  const userId = String(req.header('x-user-id') ?? '')
  const rolesHeader = String(req.header('x-user-roles') ?? '')
  const roles = rolesHeader
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  return { userId, roles }
}

async function ensurePermission(
  composition: InventarioComposition,
  req: Request,
  res: Response,
  permission: string,
): Promise<AuthContext | null> {
  const auth = getAuth(req)
  if (!auth.userId) {
    sendHttpError(res, 401, 'UNAUTHORIZED', 'Header x-user-id es obligatorio.')
    return null
  }
  const decision = await composition.auth.authorize(auth, permission)
  if (!decision.allowed) {
    sendHttpError(res, 403, 'FORBIDDEN', decision.reason ?? 'Forbidden')
    return null
  }
  return auth
}

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res).catch((error) => {
      if (error instanceof ValidationError) {
        req.observability?.logger.warn('validation_error', {
          event: 'validation_error',
          error: error.message,
        })
        sendHttpError(res, 400, 'VALIDATION', error.message)
        return
      }
      req.observability?.logger.error('unhandled_route_error', {
        event: 'unhandled_route_error',
        error: error instanceof Error ? error.message : String(error),
      })
      req.observability?.metrics.increment('infra_errors', { source: 'route' })
      next(error)
    })
  }
}

async function trackedCommand<T>(
  req: Request,
  commandName: string,
  execute: () => Promise<ApplicationResult<T>>,
): Promise<ApplicationResult<T>> {
  return traceCommand(req, commandName, execute, classifyApplicationResult)
}

export function createInventarioRouter(composition: InventarioComposition): Router {
  const router = Router()

  router.post(
    '/transferencias',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:crear')
      if (!auth) return
      const dto = V.validateCrearTransferencia(req.body)
      const result = await trackedCommand(req, 'CrearTransferencia', () =>
        composition.transferenciaService.crearTransferencia({
          ...dto,
          solicitanteId: auth.userId,
        }),
      )
      sendApplicationResult(res, result, 201)
    }),
  )

  router.get(
    '/transferencias',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'ListarTransferencias', () =>
        composition.transferenciaService.listarTransferencias(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/transferencias/:id',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'GetTransferencia', () =>
        composition.transferenciaService.getTransferencia(String(req.params.id)),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/transferencias/:id/solicitar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:solicitar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'SolicitarTransferencia', () =>
        composition.transferenciaService.solicitarTransferencia({
          transferenciaId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/transferencias/:id/cancelar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:cancelar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'CancelarTransferencia', () =>
        composition.transferenciaService.cancelarTransferencia({
          transferenciaId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/transferencias/:id/despachar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:despachar')
      if (!auth) return
      const dto = V.validateDespachar(req.body)
      const result = await trackedCommand(req, 'DespacharTransferencia', () =>
        composition.transferenciaService.despacharTransferencia({
          transferenciaId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/transferencias/:id/recibir',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'transferencias:recibir')
      if (!auth) return
      const dto = V.validateRecibir(req.body)
      const result = await trackedCommand(req, 'RecibirTransferencia', () =>
        composition.transferenciaService.recibirTransferencia({
          transferenciaId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
          recepciones: dto.recepciones,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/descartes',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:crear')
      if (!auth) return
      const body = req.body as Record<string, unknown>
      // Caso de uso completo Crear Descarte (formulario ERP → borrador)
      if (body && typeof body.motivoCodigo === 'string' && Array.isArray(body.lineas) && body.sucursalId) {
        const dto = V.validateCrearDescarteCompleto(req.body)
        const result = await trackedCommand(req, 'CrearDescarte', () =>
          composition.createDescarteHandler.execute({
            ...dto,
            responsableId:
              typeof body.responsableId === 'string' && body.responsableId
                ? body.responsableId
                : auth.userId,
            createdBy: auth.userId,
          }),
        )
        sendApplicationResult(res, result, 201)
        return
      }
      // Contrato legacy (sigue usando DescarteApplicationService sin modificarlo)
      const dto = V.validateCrearDescarte(req.body)
      const result = await trackedCommand(req, 'CrearDescarte', () =>
        composition.descarteService.crearDescarte({
          ...dto,
          solicitanteId: auth.userId,
        }),
      )
      sendApplicationResult(res, result, 201)
    }),
  )

  router.get(
    '/descartes',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:crear')
      if (!auth) return
      const items = await composition.descarteCreateStore.listItems()
      sendApplicationResult(res, ok(items))
    }),
  )

  router.post(
    '/descartes/:id/aprobar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:aprobar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'AprobarDescarte', () =>
        composition.descarteService.aprobarDescarte({
          descarteId: String(req.params.id),
          aprobadorId: auth.userId,
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/descartes/:id/aplicar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:aplicar')
      if (!auth) return
      const dto = V.validateAplicar(req.body)
      const result = await trackedCommand(req, 'AplicarDescarte', () =>
        composition.descarteService.aplicarDescarte({
          descarteId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
          permitirAlmacenBloqueadoPorConteoId: dto.permitirAlmacenBloqueadoPorConteoId,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/descartes/:id',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:crear')
      if (!auth) return
      const id = String(req.params.id)
      const [aggregate, meta] = await Promise.all([
        composition.descarteCreateStore.getAggregate(id),
        composition.descarteCreateStore.getMetadata(id),
      ])
      if (!aggregate) {
        sendHttpError(res, 404, 'NOT_FOUND', 'Descarte no encontrado.')
        return
      }
      sendApplicationResult(res, ok({ ...aggregate.toProps(), meta }))
    }),
  )

  router.post(
    '/descartes/:id/evidencias',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:crear')
      if (!auth) return
      const id = String(req.params.id)
      const body = req.body as Record<string, unknown>
      const tipo = String(body.tipo ?? '').trim()
      if (!tipo) {
        sendHttpError(res, 400, 'VALIDATION', 'tipo de evidencia es obligatorio.')
        return
      }
      const store = composition.descarteCreateStore
      if (!store.addEvidencia) {
        sendHttpError(res, 501, 'NOT_IMPLEMENTED', 'Adjuntar evidencia no disponible.')
        return
      }
      const meta = await store.addEvidencia(id, {
        id: `ev-${Date.now()}`,
        tipo: tipo as 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario',
        nombreArchivo: body.nombreArchivo ? String(body.nombreArchivo) : undefined,
        urlReferencia: body.urlReferencia ? String(body.urlReferencia) : undefined,
        comentario: body.comentario ? String(body.comentario) : undefined,
      })
      if (!meta) {
        sendHttpError(res, 404, 'NOT_FOUND', 'Descarte no encontrado.')
        return
      }
      sendApplicationResult(res, ok({ id, evidenciaCount: meta.evidencias.length, meta }))
    }),
  )

  router.post(
    '/descartes/:id/solicitar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:solicitar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'SolicitarDescarte', () =>
        composition.descarteService.solicitarDescarte({
          descarteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/descartes/:id/rechazar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:rechazar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'RechazarDescarte', () =>
        composition.descarteService.rechazarDescarte({
          descarteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/descartes/:id/cancelar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:cancelar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'CancelarDescarte', () =>
        composition.descarteService.cancelarDescarte({
          descarteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/descartes/:id/revertir',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'descartes:revertir')
      if (!auth) return
      const dto = V.validateAplicar(req.body)
      const result = await trackedCommand(req, 'RevertirDescarte', () =>
        composition.descarteService.revertirDescarte({
          descarteId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:crear')
      if (!auth) return
      const body = req.body as Record<string, unknown>
      // Caso de uso completo Crear Conteo (formulario ERP)
      if (body && typeof body.nombre === 'string' && Array.isArray(body.productos)) {
        const dto = V.validateCrearConteoCompleto(req.body)
        const result = await trackedCommand(req, 'CrearConteo', () =>
          composition.createConteoHandler.execute({
            ...dto,
            responsableId:
              typeof body.responsableId === 'string' && body.responsableId
                ? body.responsableId
                : auth.userId,
            createdBy: auth.userId,
          }),
        )
        sendApplicationResult(res, result, 201)
        return
      }
      // Contrato legacy mínimo
      const dto = V.validateCrearConteo(req.body)
      const result = await trackedCommand(req, 'CrearConteo', () =>
        composition.conteoService.crearConteo({
          ...dto,
          responsableId: auth.userId,
        }),
      )
      sendApplicationResult(res, result, 201)
    }),
  )

  router.get(
    '/conteos',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'ListarConteos', () =>
        composition.conteoService.listarConteos(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/abrir',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:abrir')
      if (!auth) return
      const dto = V.validateAbrirConteo(req.body)
      const result = await trackedCommand(req, 'AbrirConteo', () =>
        composition.conteoService.abrirConteo({
          conteoId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
          productoIds: dto.productoIds,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/lineas/:lineaId',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:registrar')
      if (!auth) return
      const dto = V.validateRegistrarLinea(req.body)
      const result = await trackedCommand(req, 'RegistrarLineaConteo', () =>
        composition.conteoService.registrarLineaConteo({
          conteoId: String(req.params.id),
          lineaId: String(req.params.lineaId),
          cantidadContada: dto.cantidadContada,
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/revision',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:revisar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'EnviarConteoARevision', () =>
        composition.conteoService.enviarConteoARevision({
          conteoId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/lineas/:lineaId/clasificar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:clasificar')
      if (!auth) return
      const dto = V.validateClasificar(req.body)
      const result = await trackedCommand(req, 'ClasificarLineaConteo', () =>
        composition.conteoService.clasificarLineaConteo({
          conteoId: String(req.params.id),
          lineaId: String(req.params.lineaId),
          expectedVersion: dto.expectedVersion,
          clasificacion: dto.clasificacion,
          regularizacion: dto.regularizacion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/cerrar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:cerrar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'CerrarConteo', () =>
        composition.conteoService.cerrarConteo({
          conteoId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/conteos/:id',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'GetConteo', () =>
        composition.conteoService.getConteo(String(req.params.id)),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/reconteo',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:registrar')
      if (!auth) return
      const dto = V.validateIniciarReconteo(req.body)
      const result = await trackedCommand(req, 'IniciarReconteoConteo', () =>
        composition.conteoService.iniciarReconteo({
          conteoId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
          lineaIds: dto.lineaIds,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/conteos/:id/cancelar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'conteos:abrir')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'CancelarConteo', () =>
        composition.conteoService.cancelarConteo({
          conteoId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:crear')
      if (!auth) return
      const dto = V.validateCrearAjuste(req.body)
      const result = await trackedCommand(req, 'CrearAjuste', () =>
        composition.ajusteService.crearAjuste({
          ...dto,
          solicitanteId: auth.userId,
        }),
      )
      sendApplicationResult(res, result, 201)
    }),
  )

  router.get(
    '/ajustes',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'ListarAjustes', () =>
        composition.ajusteService.listarAjustes(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/ajustes/:id',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:crear')
      if (!auth) return
      const result = await trackedCommand(req, 'GetAjuste', () =>
        composition.ajusteService.getAjuste(String(req.params.id)),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/solicitar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:solicitar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'SolicitarAjuste', () =>
        composition.ajusteService.solicitarAjuste({
          ajusteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/rechazar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:rechazar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'RechazarAjuste', () =>
        composition.ajusteService.rechazarAjuste({
          ajusteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/cancelar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:cancelar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'CancelarAjuste', () =>
        composition.ajusteService.cancelarAjuste({
          ajusteId: String(req.params.id),
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/revertir',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:revertir')
      if (!auth) return
      const dto = V.validateAplicar(req.body)
      const result = await trackedCommand(req, 'RevertirAjuste', () =>
        composition.ajusteService.revertirAjuste({
          ajusteId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/aprobar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:aprobar')
      if (!auth) return
      const dto = V.validateAprobar(req.body)
      const result = await trackedCommand(req, 'AprobarAjuste', () =>
        composition.ajusteService.aprobarAjuste({
          ajusteId: String(req.params.id),
          aprobadorId: auth.userId,
          expectedVersion: dto.expectedVersion,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/ajustes/:id/aplicar',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'ajustes:aplicar')
      if (!auth) return
      const dto = V.validateAplicar(req.body)
      const result = await trackedCommand(req, 'AplicarAjuste', () =>
        composition.ajusteService.aplicarAjuste({
          ajusteId: String(req.params.id),
          actorId: auth.userId,
          expectedVersion: dto.expectedVersion,
          idempotencyKey: dto.idempotencyKey,
          permitirAlmacenBloqueadoPorConteoId: dto.permitirAlmacenBloqueadoPorConteoId,
        }),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/productos',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'productos:leer')
      if (!auth) return
      const result = await trackedCommand(req, 'ListarProductosVista', () =>
        composition.queryService.listProductosVista(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/movimientos',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'movimientos:leer')
      if (!auth) return
      const result = await trackedCommand(req, 'ListarMovimientos', () =>
        composition.queryService.listMovimientos(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/movimientos/:id',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'movimientos:leer')
      if (!auth) return
      const result = await trackedCommand(req, 'GetMovimiento', () =>
        composition.queryService.getMovimiento(String(req.params.id)),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/kardex',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'kardex:leer')
      if (!auth) return
      const productoId =
        typeof req.query.productoId === 'string' ? req.query.productoId : undefined
      const result = await trackedCommand(req, 'ListarKardex', () =>
        composition.queryService.listKardex(productoId),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/auditoria',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'auditoria:leer')
      if (!auth) return
      const q = req.query as Record<string, unknown>
      const filters = {
        usuarioId: typeof q.usuarioId === 'string' ? q.usuarioId : undefined,
        documento: typeof q.documento === 'string' ? q.documento : undefined,
        accion: typeof q.accion === 'string' ? q.accion : undefined,
        resultado: typeof q.resultado === 'string' ? q.resultado : undefined,
        from: typeof q.from === 'string' ? q.from : undefined,
        to: typeof q.to === 'string' ? q.to : undefined,
      }
      const result = await trackedCommand(req, 'ListarAuditorias', () =>
        composition.queryService.listAuditorias(filters),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/auditoria/export',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'auditoria:leer')
      if (!auth) return
      const q = req.query as Record<string, unknown>
      const filters = {
        usuarioId: typeof q.usuarioId === 'string' ? q.usuarioId : undefined,
        documento: typeof q.documento === 'string' ? q.documento : undefined,
        accion: typeof q.accion === 'string' ? q.accion : undefined,
        resultado: typeof q.resultado === 'string' ? q.resultado : undefined,
        from: typeof q.from === 'string' ? q.from : undefined,
        to: typeof q.to === 'string' ? q.to : undefined,
      }
      const format = typeof q.format === 'string' ? q.format : 'json'
      if (format === 'csv') {
        const result = await trackedCommand(req, 'ExportarAuditoriaCsv', () =>
          composition.queryService.exportAuditoriasCsv(filters),
        )
        if (!result.ok) {
          sendApplicationResult(res, result)
          return
        }
        res.status(200).type('text/csv').send(result.value)
        return
      }
      const result = await trackedCommand(req, 'ExportarAuditoriaJson', () =>
        composition.queryService.listAuditorias(filters),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.get(
    '/dashboard',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'dashboard:leer')
      if (!auth) return
      const result = await trackedCommand(req, 'DashboardKpis', () =>
        composition.queryService.dashboardKpis(),
      )
      sendApplicationResult(res, result)
    }),
  )

  router.post(
    '/outbox/process',
    asyncHandler(async (req, res) => {
      const auth = await ensurePermission(composition, req, res, 'outbox:process')
      if (!auth) return
      const result = await composition.outboxProcessor.processPending()
      res.status(200).json({ success: true, data: result })
    }),
  )

  return router
}
