import { Venta } from '../../domain/aggregates/Venta'
import { descuentoMonto, descuentoPorcentaje } from '../../domain/value-objects/Descuento'
import { Dinero } from '../../domain/value-objects/Dinero'
import {
  PoliticaAnulacionVenta,
  PoliticaDescuento,
} from '../../domain/policies/PoliticasVenta'
import type {
  ClienteConsultaPort,
  IdGeneratorPort,
  InventarioConsultaPort,
  InventarioEfectosPort,
  ProductoConsultaPort,
  UsuarioPermisosPort,
  VentaRepository,
} from '../ports/outbound'
import type {
  AnularNotaCreditoCommand,
  AnularVentaCommand,
  EmitirNotaCreditoCommand,
  EmitirVentaCommand,
  RegistrarCambioCommand,
  ReimprimirVentaCommand,
  RevertirAplicacionesNotaCreditoCommand,
} from '../commands/VentaCommands'
import type {
  GetHistorialVentaQuery,
  GetVentaQuery,
  ListarNotasCreditoDisponiblesQuery,
  ListarNotasCreditoQuery,
  ListVentasQuery,
} from '../queries/VentaQueries'
import {
  toVentaResumen,
  type HistorialVentaDto,
  type VentaDto,
  type VentaResumenDto,
} from '../dto/VentaDtos'
import { fail, mapDomainError, ok, type ApplicationResult } from '../results/ApplicationResult'
import { validateEmitirVentaCommand, validateId } from '../validators/VentaValidators'

export interface NotaCreditoDisponibleDto {
  id: string
  ventaOrigenId: string
  numeroFacturaOrigen: string
  clienteId: string
  monto: number
  montoAplicado: number
  saldoPendiente: number
  moneda: string
  motivo: string
  estado: string
  fecha: string
}

/** Vista administrativa de NC (siempre con factura origen). */
export interface NotaCreditoAdminDto {
  id: string
  fecha: string
  clienteId: string
  clienteNombre?: string
  ventaOrigenId: string
  numeroFacturaOrigen: string
  estado: string
  monto: number
  montoAplicado: number
  saldoPendiente: number
  moneda: string
  motivo: string
  usuarioId: string
  sucursalId: string
  ventaVersion: number
  aplicaciones: Array<{ ventaDestinoId: string; montoAplicado: number; fecha: string }>
}

export interface VentaApplicationDeps {
  ventas: VentaRepository
  clientes: ClienteConsultaPort
  productos: ProductoConsultaPort
  inventarioConsulta: InventarioConsultaPort
  inventarioEfectos: InventarioEfectosPort
  permisos: UsuarioPermisosPort
  ids: IdGeneratorPort
}

/**
 * Casos de uso de aplicación (VEN-UC-2.0.0).
 * Sin HTTP ni persistencia concreta: solo orquesta dominio + puertos.
 */
export class VentaApplicationService {
  constructor(private readonly deps: VentaApplicationDeps) {}

  /** CU-VEN-01 / 02 / 03 / 09 / 10 — Nueva venta (emisión). */
  async emitirVenta(cmd: EmitirVentaCommand): Promise<ApplicationResult<VentaDto>> {
    const validated = validateEmitirVentaCommand(cmd)
    if (!validated.ok) return validated

    try {
      const permisos = await this.deps.permisos.getContexto(cmd.usuarioId)
      if (!permisos) {
        return fail('FORBIDDEN', 'Usuario sin contexto de permisos.')
      }

      if (cmd.tipoVenta === 'cliente_registrado') {
        if (cmd.clienteSnapshot && cmd.clienteId) {
          this.deps.clientes.ensureIdentity({
            id: cmd.clienteId,
            nombre: cmd.clienteSnapshot.nombre,
            activo: cmd.clienteSnapshot.activo,
          })
        }
        const cliente = await this.deps.clientes.getActivo(cmd.clienteId!)
        if (!cliente || !cliente.activo) {
          return fail('VALIDATION', 'Cliente registrado inexistente o inactivo.')
        }
      }

      const lineasResolvidas: Array<{
        id: string
        productoId: string
        descripcionSnapshot: string
        cantidad: number
        precioUnitario: number
        descuento?: ReturnType<typeof descuentoPorcentaje> | ReturnType<typeof descuentoMonto>
      }> = []

      for (const linea of cmd.lineas) {
        const producto = await this.deps.productos.getVendible(linea.productoId)
        if (!producto || !producto.activo) {
          return fail('VALIDATION', `Producto no vendible: ${linea.productoId}`)
        }
        const precio = linea.precioUnitario ?? producto.precio
        if (producto.moneda !== cmd.moneda) {
          return fail('VALIDATION', `Moneda del producto ${linea.productoId} no coincide con el documento.`)
        }

        const disp = await this.deps.inventarioConsulta.disponabilidad(linea.productoId, cmd.almacenId)
        if (disp.almacenBloqueadoPorConteo) {
          return fail('DOMAIN_RULE', 'El almacén está bloqueado por conteo físico.')
        }
        if (disp.saldo < linea.cantidad) {
          return fail('DOMAIN_RULE', `Stock insuficiente para ${producto.titulo}.`, {
            productoId: linea.productoId,
            solicitado: linea.cantidad,
            disponible: disp.saldo,
          })
        }

        if (linea.descuentoPorcentaje !== undefined) {
          PoliticaDescuento.assertPermitido({
            rol: permisos.rol,
            porcentajeSolicitado: linea.descuentoPorcentaje,
            topePorcentajeCajero: permisos.topePorcentajeDescuento,
            topePorcentajeSupervisor: Math.max(permisos.topePorcentajeDescuento, 30),
          })
        }

        let descuento
        if (linea.descuentoPorcentaje !== undefined) {
          descuento = descuentoPorcentaje(linea.descuentoPorcentaje)
        } else if (linea.descuentoMonto !== undefined) {
          descuento = descuentoMonto(Dinero.of(linea.descuentoMonto, cmd.moneda))
        }

        lineasResolvidas.push({
          id: this.deps.ids.generate(),
          productoId: linea.productoId,
          descripcionSnapshot: producto.titulo,
          cantidad: linea.cantidad,
          precioUnitario: precio,
          descuento,
        })
      }

      const ventaId = await this.deps.ventas.nextIdentity()
      const numeroFactura = await this.deps.ventas.nextNumeroFactura(cmd.sucursalId)

      const venta = Venta.emitir({
        id: ventaId,
        numeroFactura,
        tipoVenta: cmd.tipoVenta,
        clienteId: cmd.clienteId,
        sucursalId: cmd.sucursalId,
        almacenId: cmd.almacenId,
        usuarioEmisionId: cmd.usuarioId,
        moneda: cmd.moneda,
        lineas: lineasResolvidas,
        pagos: cmd.pagos.map((p) => ({
          id: this.deps.ids.generate(),
          formaPago: p.formaPago,
          monto: p.monto,
          notaCreditoId: p.formaPago === 'nota_credito' ? p.notaCreditoId : undefined,
          montoEntregadoEfectivo: p.montoEntregadoEfectivo,
        })),
        historialId: this.deps.ids.generate(),
        idempotencyKeyInventario: cmd.idempotencyKey,
      })

      const intencion = venta.pullPendingInventoryEffect()
      if (!intencion) {
        return fail('UNEXPECTED', 'No se generó intención de inventario para la venta.')
      }

      const inv = await this.deps.inventarioEfectos.aplicar(intencion)
      if (!inv.ok) {
        venta.markInventoryFailed('salida_venta', inv.message)
        return fail('INVENTORY_FAILURE', inv.message, { ventaId })
      }
      venta.markInventoryConfirmed('salida_venta')

      await this.deps.ventas.save(venta)

      const ncPagos = cmd.pagos.filter((p) => p.formaPago === 'nota_credito')
      for (const pago of ncPagos) {
        const ncId = pago.notaCreditoId?.trim()
        if (!ncId) {
          return fail('VALIDATION', 'Pago con nota de crédito requiere notaCreditoId.')
        }
        const applied = await this.aplicarNcEnOrigen({
          notaCreditoId: ncId,
          ventaDestinoId: venta.id,
          monto: pago.monto,
          usuarioId: cmd.usuarioId,
          clienteId: cmd.clienteId,
        })
        if (!applied.ok) return applied
      }

      venta.pullEvents()
      return ok(venta.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-04 */
  async listarVentas(query: ListVentasQuery): Promise<ApplicationResult<VentaResumenDto[]>> {
    try {
      const list = await this.deps.ventas.list(query)
      return ok(list.map((v) => toVentaResumen(v.toProps())))
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-05 */
  async obtenerVenta(query: GetVentaQuery): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = query.ventaId
        ? await this.deps.ventas.getById(query.ventaId)
        : query.numeroFactura
          ? await this.deps.ventas.getByNumeroFactura(query.numeroFactura)
          : null
      if (!venta) {
        return fail('NOT_FOUND', 'Factura no encontrada.')
      }
      return ok(venta.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-07 */
  async obtenerHistorial(
    query: GetHistorialVentaQuery,
  ): Promise<ApplicationResult<HistorialVentaDto[]>> {
    const id = validateId(query.ventaId, 'ventaId')
    if (!id.ok) return id
    const venta = await this.deps.ventas.getById(id.value)
    if (!venta) return fail('NOT_FOUND', 'Factura no encontrada.')
    return ok(venta.historial.map((h) => h.toProps()))
  }

  /** CU-VEN-06 */
  async reimprimir(cmd: ReimprimirVentaCommand): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = await this.deps.ventas.getById(cmd.ventaId)
      if (!venta) return fail('NOT_FOUND', 'Factura no encontrada.')
      venta.registrarReimpresion({
        historialId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
      })
      await this.deps.ventas.save(venta)
      venta.pullEvents()
      return ok(venta.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-11 — diferencia calculada; pago de diferencia en la misma factura. */
  async registrarCambio(cmd: RegistrarCambioCommand): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = await this.requireVenta(cmd.ventaId, cmd.expectedVersion)
      if (!venta.ok) return venta

      const v = venta.value
      const lineasDevueltas = []
      for (const l of cmd.lineasDevueltas) {
        const origen = v.lineas.find((x) => x.productoId === l.productoId)
        if (!origen) {
          return fail('VALIDATION', `El producto ${l.productoId} no pertenece a esta factura.`)
        }
        lineasDevueltas.push({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: origen.precioUnitario.monto,
          descripcionSnapshot: origen.descripcionSnapshot,
        })
      }

      const lineasNuevas = []
      for (const l of cmd.lineasNuevas) {
        const producto = await this.deps.productos.getVendible(l.productoId)
        if (!producto?.activo) {
          return fail('VALIDATION', `Producto no vendible: ${l.productoId}`)
        }
        const disp = await this.deps.inventarioConsulta.disponabilidad(
          l.productoId,
          v.almacenId,
        )
        if (disp.almacenBloqueadoPorConteo) {
          return fail('DOMAIN_RULE', 'Almacén bloqueado por conteo.')
        }
        if (disp.saldo < l.cantidad) {
          return fail('DOMAIN_RULE', `Stock insuficiente para ${producto.titulo}.`)
        }
        lineasNuevas.push({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario ?? producto.precio,
          descripcionSnapshot: producto.titulo,
        })
      }

      v.registrarCambio({
        cambioId: this.deps.ids.generate(),
        historialId: this.deps.ids.generate(),
        historialPagoId: this.deps.ids.generate(),
        pagoId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
        lineasDevueltas,
        lineasNuevas,
        compensacionCliente: cmd.compensacionCliente,
        pagoDiferencia: cmd.pagoDiferencia,
        idempotencyKeyInventario: cmd.idempotencyKey,
      })

      const invResult = await this.applyInventory(v)
      if (!invResult.ok) return invResult

      if (cmd.compensacionCliente === 'nota_credito') {
        const valorDevuelto = cmd.lineasDevueltas.reduce((acc, l) => {
          const origen = v.lineas.find((x) => x.productoId === l.productoId)
          return acc + l.cantidad * (origen?.precioUnitario.monto ?? 0)
        }, 0)
        const valorNuevo = lineasNuevas.reduce(
          (acc, l) => acc + l.cantidad * l.precioUnitario,
          0,
        )
        const aFavorCliente = valorDevuelto - valorNuevo
        if (aFavorCliente > 0) {
          const numeroNc = await this.deps.ventas.nextNumeroNotaCredito()
          v.emitirNotaCredito({
            notaCreditoId: numeroNc,
            historialId: this.deps.ids.generate(),
            usuarioId: cmd.usuarioId,
            monto: aFavorCliente,
            motivo: `Compensación por cambio · ${numeroNc}`,
          })
        }
      }

      await this.deps.ventas.save(v)
      v.pullEvents()
      return ok(v.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-13 — sin efecto de inventario */
  async emitirNotaCredito(cmd: EmitirNotaCreditoCommand): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = await this.requireVenta(cmd.ventaId, cmd.expectedVersion)
      if (!venta.ok) return venta

      const v = venta.value
      const numeroNc = await this.deps.ventas.nextNumeroNotaCredito()
      v.emitirNotaCredito({
        notaCreditoId: numeroNc,
        historialId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
        monto: cmd.monto,
        motivo: cmd.motivo,
      })
      await this.deps.ventas.save(v)
      v.pullEvents()
      return ok(v.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async anularNotaCredito(cmd: AnularNotaCreditoCommand): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = await this.requireVenta(cmd.ventaId, cmd.expectedVersion)
      if (!venta.ok) return venta
      const v = venta.value
      v.anularNotaCredito({
        notaCreditoId: cmd.notaCreditoId,
        historialId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
        motivo: cmd.motivo,
      })
      await this.deps.ventas.save(v)
      v.pullEvents()
      return ok(v.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async revertirAplicacionesNotaCredito(
    cmd: RevertirAplicacionesNotaCreditoCommand,
  ): Promise<ApplicationResult<VentaDto>> {
    try {
      const venta = await this.requireVenta(cmd.ventaId, cmd.expectedVersion)
      if (!venta.ok) return venta
      const v = venta.value
      v.revertirAplicacionesNotaCredito({
        notaCreditoId: cmd.notaCreditoId,
        historialId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
      })
      await this.deps.ventas.save(v)
      v.pullEvents()
      return ok(v.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async listarNotasCreditoDisponibles(
    query: ListarNotasCreditoDisponiblesQuery,
  ): Promise<ApplicationResult<NotaCreditoDisponibleDto[]>> {
    if (!query.clienteId?.trim()) {
      return fail('VALIDATION', 'clienteId es obligatorio.')
    }
    try {
      const ventas = await this.deps.ventas.list({
        clienteId: query.clienteId.trim(),
        estado: 'emitida',
        limit: 500,
      })
      const out: NotaCreditoDisponibleDto[] = []
      for (const v of ventas) {
        for (const nc of v.notasCredito) {
          if (nc.estado === 'anulada' || nc.estado === 'aplicada') continue
          if (nc.saldoPendiente <= 0) continue
          out.push({
            id: nc.id,
            ventaOrigenId: v.id,
            numeroFacturaOrigen: v.numeroFactura.value,
            clienteId: nc.clienteId,
            monto: nc.monto.monto,
            montoAplicado: nc.montoAplicado,
            saldoPendiente: nc.saldoPendiente,
            moneda: nc.monto.moneda,
            motivo: nc.motivo,
            estado: nc.estado,
            fecha: nc.fecha.toISOString(),
          })
        }
      }
      return ok(out)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /**
   * Listado administrativo de todas las NC.
   * Solo consulta — la emisión sigue siendo exclusiva del expediente de factura.
   */
  async listarNotasCredito(
    query: ListarNotasCreditoQuery,
  ): Promise<ApplicationResult<NotaCreditoAdminDto[]>> {
    try {
      const ventas = await this.deps.ventas.list({
        sucursalId: query.sucursalId,
        clienteId: query.clienteId,
        numeroFactura: query.numeroFactura,
        limit: 2000,
      })
      const texto = query.texto?.trim().toLowerCase()
      const desde = query.desde?.trim()
      const hasta = query.hasta?.trim()
      const estadoFiltro = query.estado?.trim()
      const clienteNombreCache = new Map<string, string | undefined>()

      const out: NotaCreditoAdminDto[] = []
      for (const v of ventas) {
        for (const nc of v.notasCredito) {
          if (estadoFiltro && nc.estado !== estadoFiltro) continue
          const fechaIso = nc.fecha.toISOString()
          if (desde && fechaIso < desde) continue
          if (hasta && fechaIso > hasta) continue

          if (!clienteNombreCache.has(nc.clienteId)) {
            const cliente = await this.deps.clientes.getActivo(nc.clienteId)
            clienteNombreCache.set(nc.clienteId, cliente?.nombre)
          }
          const clienteNombre = clienteNombreCache.get(nc.clienteId)

          if (texto) {
            const hay =
              nc.id.toLowerCase().includes(texto) ||
              v.numeroFactura.value.toLowerCase().includes(texto) ||
              nc.clienteId.toLowerCase().includes(texto) ||
              (clienteNombre?.toLowerCase().includes(texto) ?? false)
            if (!hay) continue
          }

          out.push({
            id: nc.id,
            fecha: fechaIso,
            clienteId: nc.clienteId,
            clienteNombre,
            ventaOrigenId: v.id,
            numeroFacturaOrigen: v.numeroFactura.value,
            estado: nc.estado,
            monto: nc.monto.monto,
            montoAplicado: nc.montoAplicado,
            saldoPendiente: Math.max(0, nc.monto.monto - nc.montoAplicado),
            moneda: nc.monto.moneda,
            motivo: nc.motivo,
            usuarioId: nc.usuarioId,
            sucursalId: v.sucursalId,
            ventaVersion: v.version,
            aplicaciones: nc.aplicaciones.map((a) => ({
              ventaDestinoId: a.ventaDestinoId,
              montoAplicado: a.montoAplicado,
              fecha: a.fecha,
            })),
          })
        }
      }

      out.sort((a, b) => b.fecha.localeCompare(a.fecha))
      const offset = query.offset ?? 0
      const limit = query.limit ?? out.length
      return ok(out.slice(offset, offset + limit))
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-14 */
  async anularVenta(cmd: AnularVentaCommand): Promise<ApplicationResult<VentaDto>> {
    try {
      const permisos = await this.deps.permisos.getContexto(cmd.usuarioId)
      if (!permisos) return fail('FORBIDDEN', 'Usuario sin contexto de permisos.')

      const venta = await this.requireVenta(cmd.ventaId, cmd.expectedVersion)
      if (!venta.ok) return venta

      const v = venta.value
      PoliticaAnulacionVenta.assertPuedeAnular({
        estado: v.estado,
        rol: permisos.rol,
        tienePostventa: v.tieneCambios || v.tieneDevoluciones || v.tieneNotasCredito,
      })

      v.anular({
        historialId: this.deps.ids.generate(),
        usuarioId: cmd.usuarioId,
        motivo: cmd.motivo,
        idempotencyKeyInventario: cmd.idempotencyKey,
      })

      const invResult = await this.applyInventory(v)
      if (!invResult.ok) return invResult

      await this.deps.ventas.save(v)
      v.pullEvents()
      return ok(v.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }

  /** CU-VEN-08 */
  async buscarCliente(
    query: import('../queries/VentaQueries').BuscarClienteQuery,
  ): Promise<ApplicationResult<Array<{ id: string; nombre: string; activo: boolean }>>> {
    if (!query.texto?.trim()) {
      return fail('VALIDATION', 'texto de búsqueda es obligatorio.')
    }
    try {
      const results = await this.deps.clientes.buscar(query.texto.trim())
      return ok(results)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  private async requireVenta(
    ventaId: string,
    expectedVersion?: number,
  ): Promise<ApplicationResult<Venta>> {
    const id = validateId(ventaId, 'ventaId')
    if (!id.ok) return id
    const venta = await this.deps.ventas.getById(id.value)
    if (!venta) return fail('NOT_FOUND', 'Factura no encontrada.')
    if (expectedVersion !== undefined && venta.version !== expectedVersion) {
      return fail('CONFLICT', 'Conflicto de versión de la factura.', {
        expected: expectedVersion,
        actual: venta.version,
      })
    }
    return ok(venta)
  }

  /** Aplica NC sobre la factura origen. Sin inventario. */
  private async aplicarNcEnOrigen(input: {
    notaCreditoId: string
    ventaDestinoId: string
    monto: number
    usuarioId: string
    clienteId?: string
  }): Promise<ApplicationResult<true>> {
    const ventas = await this.deps.ventas.list({
      clienteId: input.clienteId,
      estado: 'emitida',
      limit: 500,
    })
    const origen = ventas.find((v) => v.notasCredito.some((n) => n.id === input.notaCreditoId))
    if (!origen) {
      return fail('NOT_FOUND', `Nota de crédito ${input.notaCreditoId} no encontrada.`)
    }
    const nc = origen.notasCredito.find((n) => n.id === input.notaCreditoId)!
    if (input.clienteId && nc.clienteId !== input.clienteId) {
      return fail('VALIDATION', 'La NC no pertenece al cliente de la venta.')
    }
    origen.aplicarNotaCredito({
      notaCreditoId: input.notaCreditoId,
      ventaDestinoId: input.ventaDestinoId,
      monto: input.monto,
      historialId: this.deps.ids.generate(),
      usuarioId: input.usuarioId,
    })
    await this.deps.ventas.save(origen)
    origen.pullEvents()
    return ok(true)
  }

  private async applyInventory(venta: Venta): Promise<ApplicationResult<true>> {
    const intencion = venta.pullPendingInventoryEffect()
    if (!intencion) return ok(true)
    const inv = await this.deps.inventarioEfectos.aplicar(intencion)
    if (!inv.ok) {
      venta.markInventoryFailed(intencion.tipoEfecto, inv.message)
      return fail('INVENTORY_FAILURE', inv.message)
    }
    venta.markInventoryConfirmed(intencion.tipoEfecto)
    return ok(true)
  }
}
