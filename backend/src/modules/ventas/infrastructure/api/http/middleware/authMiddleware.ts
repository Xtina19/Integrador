import type { Request, Response, NextFunction } from 'express'
import type { VentasComposition } from '../../../composition/createVentasComposition'
import { sendHttpError } from '../errorHandler'

export type VentasRol = 'cajero' | 'supervisor' | 'administrador'

export type VentasHttpOperation =
  | 'emitir'
  | 'consultar'
  | 'reimprimir'
  | 'cambio'
  | 'nota_credito'
  | 'anular'
  | 'buscar_cliente'

const OPERATION_ROLES: Record<VentasHttpOperation, readonly VentasRol[]> = {
  emitir: ['cajero', 'supervisor', 'administrador'],
  consultar: ['cajero', 'supervisor', 'administrador'],
  reimprimir: ['cajero', 'supervisor', 'administrador'],
  cambio: ['cajero', 'supervisor', 'administrador'],
  nota_credito: ['cajero', 'supervisor', 'administrador'],
  anular: ['supervisor', 'administrador'],
  buscar_cliente: ['cajero', 'supervisor', 'administrador'],
}

export interface VentasAuthContext {
  userId: string
  rol: VentasRol
  topePorcentajeDescuento: number
}

type RequestWithVentasAuth = Request & { ventasAuth?: VentasAuthContext }

export function getVentasAuth(req: Request): VentasAuthContext {
  const auth = (req as RequestWithVentasAuth).ventasAuth
  if (!auth) {
    throw new Error('Contexto de autorización Ventas ausente.')
  }
  return auth
}

/**
 * Middleware de autorización vía `UsuarioPermisosPort` (composition.permisos).
 * Header obligatorio: `x-user-id`.
 */
export function createVentasAuthMiddleware(composition: VentasComposition) {
  return function requireVentasOperation(operation: VentasHttpOperation) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = String(req.header('x-user-id') ?? '').trim()
        if (!userId) {
          sendHttpError(res, 401, 'UNAUTHORIZED', 'Header x-user-id es obligatorio.')
          return
        }

        const ctx = await composition.permisos.getContexto(userId)
        if (!ctx) {
          sendHttpError(res, 403, 'FORBIDDEN', `Usuario no autorizado: ${userId}`)
          return
        }

        const allowed = OPERATION_ROLES[operation]
        if (!allowed.includes(ctx.rol)) {
          sendHttpError(
            res,
            403,
            'FORBIDDEN',
            `El rol ${ctx.rol} no puede ejecutar la operación ${operation}.`,
          )
          return
        }

        ;(req as RequestWithVentasAuth).ventasAuth = {
          userId,
          rol: ctx.rol,
          topePorcentajeDescuento: ctx.topePorcentajeDescuento,
        }
        next()
      } catch (err) {
        next(err)
      }
    }
  }
}
