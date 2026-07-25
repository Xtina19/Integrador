import type { Request, Response } from 'express'
import type { VentasComposition } from '../../../composition/createVentasComposition'
import { sendApplicationResult, sendHttpError } from '../errorHandler'
import { getVentasAuth } from '../middleware/authMiddleware'
import * as V from '../validators/ventaHttpValidators'

/**
 * Controllers REST de Ventas.
 * Sin lógica de negocio: solo HTTP → handlers/application existentes.
 */
export class VentasController {
  constructor(private readonly composition: VentasComposition) {}

  async emitir(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateEmitirVentaBody(req.body)
    const result = await this.composition.handlers.emitirVenta.execute({
      ...body,
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result, 201)
  }

  /** CU pago único — delega en EmitirVentaHandler. */
  async registrarPago(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateEmitirConPagoUnicoBody(req.body)
    const result = await this.composition.handlers.emitirVenta.execute({
      ...body,
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result, 201)
  }

  /** CU pago mixto — delega en EmitirVentaHandler (≥2 pagos). */
  async registrarPagoMixto(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateEmitirPagoMixtoBody(req.body)
    const result = await this.composition.handlers.emitirVenta.execute({
      ...body,
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result, 201)
  }

  async listar(req: Request, res: Response): Promise<void> {
    const query = V.validateListVentasQuery(req.query as Record<string, unknown>)
    const result = await this.composition.handlers.listarVentas.execute(query)
    sendApplicationResult(res, result)
  }

  async detalle(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id ?? '')
    const result = await this.composition.handlers.obtenerVenta.execute({ ventaId: id })
    sendApplicationResult(res, result)
  }

  async detallePorNumero(req: Request, res: Response): Promise<void> {
    const numero = String(req.params.numero ?? '')
    const result = await this.composition.handlers.obtenerVenta.execute({
      numeroFactura: decodeURIComponent(numero),
    })
    sendApplicationResult(res, result)
  }

  async reimprimir(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const result = await this.composition.handlers.reimprimir.execute({
      ventaId: String(req.params.id ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async historial(req: Request, res: Response): Promise<void> {
    const result = await this.composition.handlers.obtenerHistorial.execute({
      ventaId: String(req.params.id ?? ''),
    })
    sendApplicationResult(res, result)
  }

  async registrarCambio(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateRegistrarCambioBody(req.body)
    const result = await this.composition.handlers.registrarCambio.execute({
      ...body,
      ventaId: String(req.params.id ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async emitirNotaCredito(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateEmitirNotaCreditoBody(req.body)
    const result = await this.composition.handlers.emitirNotaCredito.execute({
      ...body,
      ventaId: String(req.params.id ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async anularNotaCredito(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateAnularNotaCreditoBody(req.body)
    const result = await this.composition.handlers.anularNotaCredito.execute({
      ...body,
      ventaId: String(req.params.id ?? ''),
      notaCreditoId: String(req.params.ncId ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async revertirAplicacionesNotaCredito(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateRevertirAplicacionesNotaCreditoBody(req.body)
    const result = await this.composition.handlers.revertirAplicacionesNotaCredito.execute({
      ...body,
      ventaId: String(req.params.id ?? ''),
      notaCreditoId: String(req.params.ncId ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async listarNotasCreditoDisponibles(req: Request, res: Response): Promise<void> {
    const clienteId = String(req.query.clienteId ?? '').trim()
    const result = await this.composition.handlers.listarNotasCreditoDisponibles.execute({
      clienteId,
    })
    sendApplicationResult(res, result)
  }

  /** Listado administrativo de NC — solo lectura. */
  async listarNotasCredito(req: Request, res: Response): Promise<void> {
    const q = req.query
    const result = await this.composition.handlers.listarNotasCredito.execute({
      estado: q.estado ? String(q.estado) : undefined,
      clienteId: q.clienteId ? String(q.clienteId) : undefined,
      sucursalId: q.sucursalId ? String(q.sucursalId) : undefined,
      desde: q.desde ? String(q.desde) : undefined,
      hasta: q.hasta ? String(q.hasta) : undefined,
      texto: q.texto ? String(q.texto) : undefined,
      numeroFactura: q.numeroFactura ? String(q.numeroFactura) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    })
    sendApplicationResult(res, result)
  }

  /** Cancelar = anular (VEN-UC-14). */
  async cancelar(req: Request, res: Response): Promise<void> {
    const auth = getVentasAuth(req)
    const body = V.validateAnularVentaBody(req.body)
    const result = await this.composition.handlers.anularVenta.execute({
      ...body,
      ventaId: String(req.params.id ?? ''),
      usuarioId: auth.userId,
    })
    sendApplicationResult(res, result)
  }

  async buscarCliente(req: Request, res: Response): Promise<void> {
    const texto = String(req.query.texto ?? '').trim()
    const result = await this.composition.handlers.buscarCliente.execute({ texto })
    sendApplicationResult(res, result)
  }

  /** Movimientos del Inventory Engine ligados a la factura (y postventa). */
  async inventarioRelacionado(req: Request, res: Response): Promise<void> {
    const ventaId = String(req.params.id ?? '').trim()
    const ventaResult = await this.composition.handlers.obtenerVenta.execute({ ventaId })
    if (!ventaResult.ok) {
      sendApplicationResult(res, ventaResult)
      return
    }
    const venta = ventaResult.value
    const docIds = new Set<string>([
      venta.id,
      ...venta.cambios.map((c) => c.id),
      ...venta.devoluciones.map((d) => d.id),
    ])
    const inventario = this.composition.inventario
    if (!inventario) {
      sendHttpError(res, 503, 'UNAVAILABLE', 'Inventory Engine no disponible.')
      return
    }
    const movs = await inventario.queryService.listMovimientos()
    if (!movs.ok) {
      sendHttpError(res, 500, movs.code, movs.message)
      return
    }
    const rows = movs.value
      .filter((m) => docIds.has(m.documentoId))
      .map((m) => ({
        id: m.id,
        operacion: m.tipoMovimiento,
        sentido: m.saldoPosterior < m.saldoAnterior ? 'salida' : 'entrada',
        productoId: m.productoId,
        producto: m.productoTitulo ?? m.productoId,
        cantidad: m.cantidad,
        almacenId: m.almacenId,
        documentoTipo: m.documentoTipo,
        documentoId: m.documentoId,
        fecha: m.fechaMovimiento,
        usuarioId: m.usuarioId,
        saldoAnterior: m.saldoAnterior,
        saldoPosterior: m.saldoPosterior,
      }))
    res.status(200).json({ success: true, data: rows })
  }
}
