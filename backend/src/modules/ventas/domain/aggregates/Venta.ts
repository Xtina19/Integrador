import type { EstadoVenta, MonedaCodigo, TipoVenta, ResolucionDiferenciaCambio } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { VentaLinea, type VentaLineaProps } from '../entities/VentaLinea'
import { Pago, type PagoProps } from '../entities/Pago'
import { Cambio, type CambioProps } from '../entities/Cambio'
import { Devolucion, type DevolucionProps } from '../entities/Devolucion'
import { NotaCredito, type NotaCreditoProps } from '../entities/NotaCredito'
import { HistorialVenta, type HistorialVentaProps } from '../entities/HistorialVenta'
import { NumeroFactura } from '../value-objects/NumeroFactura'
import { Dinero } from '../value-objects/Dinero'
import type { Descuento } from '../value-objects/Descuento'
import {
  CalculadoraCantidadNeta,
  CalculadoraDiferenciaCambio,
  CalculadoraSaldoAcreditable,
  CalculadoraTotalesVenta,
} from '../services/CalculadorasVenta'
import { PoliticaEmisionVenta, PoliticaPostventaCliente } from '../policies/PoliticasVenta'
import { MaquinaEstadosVenta } from '../guards/MaquinaEstadosVenta'
import { InvariantesVenta } from '../guards/InvariantesVenta'
import {
  newEventId,
  type VentasDomainEvent,
} from '../events/VentasDomainEvents'
import type { IntencionEfectoInventario } from '../value-objects/IntencionEfectoInventario'
import { EmisorIntencionInventario } from '../services/EmisorIntencionInventario'

export interface VentaProps {
  id: string
  numeroFactura: string
  estado: EstadoVenta
  tipoVenta: TipoVenta
  clienteId?: string
  sucursalId: string
  almacenId: string
  usuarioEmisionId: string
  moneda: MonedaCodigo
  fechaEmision: string
  subtotal: number
  totalDescuentos: number
  total: number
  version: number
  tieneCambios: boolean
  tieneDevoluciones: boolean
  tieneNotasCredito: boolean
  motivoAnulacion?: string
  lineas: VentaLineaProps[]
  pagos: PagoProps[]
  cambios: CambioProps[]
  devoluciones: DevolucionProps[]
  notasCredito: NotaCreditoProps[]
  historial: HistorialVentaProps[]
}

/**
 * Aggregate Root: Venta ≡ Factura (documento central del módulo Ventas).
 * No muta existencias: expone intenciones para el puerto Inventario.
 */
export class Venta {
  private _events: VentasDomainEvent[] = []
  private _pendingInventory: IntencionEfectoInventario | undefined

  private constructor(
    readonly id: string,
    readonly numeroFactura: NumeroFactura,
    private _estado: EstadoVenta,
    readonly tipoVenta: TipoVenta,
    readonly clienteId: string | undefined,
    readonly sucursalId: string,
    readonly almacenId: string,
    readonly usuarioEmisionId: string,
    readonly moneda: MonedaCodigo,
    readonly fechaEmision: Date,
    readonly subtotal: Dinero,
    readonly totalDescuentos: Dinero,
    readonly total: Dinero,
    private _version: number,
    private _tieneCambios: boolean,
    private _tieneDevoluciones: boolean,
    private _tieneNotasCredito: boolean,
    private _motivoAnulacion: string | undefined,
    private _lineas: VentaLinea[],
    private _pagos: Pago[],
    private _cambios: Cambio[],
    private _devoluciones: Devolucion[],
    private _notasCredito: NotaCredito[],
    private _historial: HistorialVenta[],
  ) {}

  static emitir(input: {
    id: string
    numeroFactura: string
    tipoVenta: TipoVenta
    clienteId?: string
    sucursalId: string
    almacenId: string
    usuarioEmisionId: string
    moneda: MonedaCodigo
    lineas: Array<{
      id: string
      productoId: string
      descripcionSnapshot: string
      cantidad: number
      precioUnitario: number
      descuento?: Descuento
    }>
    pagos: Array<{
      id: string
      formaPago: PagoProps['formaPago']
      monto: number
      notaCreditoId?: string
      montoEntregadoEfectivo?: number
    }>
    historialId: string
    idempotencyKeyInventario: string
    fecha?: Date
  }): Venta {
    PoliticaEmisionVenta.assertTipoCliente(input.tipoVenta, input.clienteId)
    if (!input.sucursalId.trim() || !input.almacenId.trim()) {
      throw new VentasDomainError('INVALID_STATE', 'Sucursal y almacén son obligatorios.')
    }
    if (!input.usuarioEmisionId.trim()) {
      throw new VentasDomainError('INVALID_STATE', 'El usuario de emisión es obligatorio.')
    }

    const lineas = input.lineas.map((l) =>
      VentaLinea.crear({ ...l, moneda: input.moneda }),
    )
    const totales = CalculadoraTotalesVenta.sumarLineas(lineas, input.moneda)
    const pagos = input.pagos.map((p) =>
      Pago.crear({ ...p, moneda: input.moneda }),
    )
    InvariantesVenta.assertEmision({
      lineas,
      pagos,
      total: totales.total,
      tipoVenta: input.tipoVenta,
      clienteId: input.clienteId,
    })

    const fecha = input.fecha ?? new Date()
    const venta = new Venta(
      input.id,
      NumeroFactura.of(input.numeroFactura),
      'emitida',
      input.tipoVenta,
      input.tipoVenta === 'cliente_registrado' ? input.clienteId : undefined,
      input.sucursalId,
      input.almacenId,
      input.usuarioEmisionId,
      input.moneda,
      fecha,
      totales.subtotal,
      totales.totalDescuentos,
      totales.total,
      1,
      false,
      false,
      false,
      undefined,
      lineas,
      pagos,
      [],
      [],
      [],
      [
        HistorialVenta.crear({
          id: input.historialId,
          tipoEvento: 'emision',
          usuarioId: input.usuarioEmisionId,
          fecha,
          detalle: `Factura ${input.numeroFactura} emitida`,
        }),
      ],
    )

    venta._pendingInventory = EmisorIntencionInventario.salidaVenta({
      ventaId: input.id,
      usuarioId: input.usuarioEmisionId,
      idempotencyKey: input.idempotencyKeyInventario,
      almacenId: input.almacenId,
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad.value,
      })),
    })

    venta.record({
      eventId: newEventId(),
      name: 'FacturaEmitida',
      occurredAt: fecha,
      aggregateType: 'Venta',
      aggregateId: input.id,
      payload: {
        numeroFactura: input.numeroFactura,
        sucursalId: input.sucursalId,
        total: totales.total.monto,
        moneda: input.moneda,
        tipoVenta: input.tipoVenta,
      },
    })
    venta.record({
      eventId: newEventId(),
      name: 'PagoRegistradoEnVenta',
      occurredAt: fecha,
      aggregateType: 'Venta',
      aggregateId: input.id,
      payload: {
        pagoIds: pagos.map((p) => p.id),
        totalPagado: totales.total.monto,
      },
    })
    if (pagos.length > 1) {
      venta.record({
        eventId: newEventId(),
        name: 'PagoMixtoCompletado',
        occurredAt: fecha,
        aggregateType: 'Venta',
        aggregateId: input.id,
        payload: { cantidadFormas: pagos.length, total: totales.total.monto },
      })
    }
    if (totales.totalDescuentos.monto > 0) {
      venta.record({
        eventId: newEventId(),
        name: 'DescuentoAplicadoEnVenta',
        occurredAt: fecha,
        aggregateType: 'Venta',
        aggregateId: input.id,
        payload: { totalDescuentos: totales.totalDescuentos.monto },
      })
    }
    venta.record({
      eventId: newEventId(),
      name: 'EfectoInventarioVentaSolicitado',
      occurredAt: fecha,
      aggregateType: 'Venta',
      aggregateId: input.id,
      payload: {
        tipoEfecto: 'salida_venta',
        idempotencyKey: input.idempotencyKeyInventario,
      },
    })

    return venta
  }

  static rehidratar(props: VentaProps): Venta {
    return new Venta(
      props.id,
      NumeroFactura.of(props.numeroFactura),
      props.estado,
      props.tipoVenta,
      props.clienteId,
      props.sucursalId,
      props.almacenId,
      props.usuarioEmisionId,
      props.moneda,
      new Date(props.fechaEmision),
      Dinero.of(props.subtotal, props.moneda, { permitirDecimales: !Number.isInteger(props.subtotal) }),
      Dinero.of(props.totalDescuentos, props.moneda, {
        permitirDecimales: !Number.isInteger(props.totalDescuentos),
      }),
      Dinero.of(props.total, props.moneda, { permitirDecimales: !Number.isInteger(props.total) }),
      props.version,
      props.tieneCambios,
      props.tieneDevoluciones,
      props.tieneNotasCredito,
      props.motivoAnulacion,
      props.lineas.map(VentaLinea.rehidratar),
      props.pagos.map(Pago.rehidratar),
      props.cambios.map(Cambio.rehidratar),
      props.devoluciones.map(Devolucion.rehidratar),
      props.notasCredito.map(NotaCredito.rehidratar),
      props.historial.map(HistorialVenta.rehidratar),
    )
  }

  get estado(): EstadoVenta {
    return this._estado
  }
  get version(): number {
    return this._version
  }
  get tieneCambios(): boolean {
    return this._tieneCambios
  }
  get tieneDevoluciones(): boolean {
    return this._tieneDevoluciones
  }
  get tieneNotasCredito(): boolean {
    return this._tieneNotasCredito
  }
  get motivoAnulacion(): string | undefined {
    return this._motivoAnulacion
  }
  get lineas(): readonly VentaLinea[] {
    return this._lineas
  }
  get pagos(): readonly Pago[] {
    return this._pagos
  }
  get cambios(): readonly Cambio[] {
    return this._cambios
  }
  get devoluciones(): readonly Devolucion[] {
    return this._devoluciones
  }
  get notasCredito(): readonly NotaCredito[] {
    return this._notasCredito
  }
  get historial(): readonly HistorialVenta[] {
    return this._historial
  }

  pullEvents(): VentasDomainEvent[] {
    const events = this._events
    this._events = []
    return events
  }

  pullPendingInventoryEffect(): IntencionEfectoInventario | undefined {
    const effect = this._pendingInventory
    this._pendingInventory = undefined
    return effect
  }

  cantidadNetaProducto(productoId: string): number {
    const vendido = this._lineas
      .filter((l) => l.productoId === productoId)
      .reduce((acc, l) => acc + l.cantidad.value, 0)
    let devueltoCambio = 0
    for (const c of this._cambios) {
      for (const l of c.lineasDevueltas) {
        if (l.productoId === productoId) devueltoCambio += l.cantidad.value
      }
    }
    let devoluciones = 0
    for (const d of this._devoluciones) {
      for (const l of d.lineas) {
        if (l.productoId === productoId) devoluciones += l.cantidad.value
      }
    }
    return CalculadoraCantidadNeta.netoPorProducto(vendido, devueltoCambio, devoluciones)
  }

  saldoAcreditable(): number {
    const emitidoNc = this._notasCredito
      .filter((n) => n.estado !== 'anulada')
      .reduce((acc, n) => acc + n.monto.monto, 0)
    return CalculadoraSaldoAcreditable.calcular(this.total.monto, emitidoNc)
  }

  /**
   * CU-VEN-11 — Cambio sobre la misma factura (nunca crea venta/factura nueva).
   * La diferencia monetaria se calcula en dominio; no se acepta monto manual.
   */
  registrarCambio(input: {
    cambioId: string
    historialId: string
    historialPagoId?: string
    pagoId?: string
    usuarioId: string
    lineasDevueltas: Array<{
      productoId: string
      cantidad: number
      precioUnitario: number
      descripcionSnapshot?: string
    }>
    lineasNuevas: Array<{
      productoId: string
      cantidad: number
      precioUnitario: number
      descripcionSnapshot?: string
    }>
    /** Obligatorio si valorNuevo < valorDevuelto. NC = preparación (Fase 3 emite el documento). */
    compensacionCliente?: 'devolucion_dinero' | 'nota_credito'
    /** Obligatorio si valorNuevo > valorDevuelto; monto debe igualar la diferencia. */
    pagoDiferencia?: {
      formaPago: PagoProps['formaPago']
      monto: number
      montoEntregadoEfectivo?: number
    }
    idempotencyKeyInventario: string
  }): void {
    MaquinaEstadosVenta.assertTransicionPermitida(this._estado, 'registrar_cambio')
    PoliticaPostventaCliente.assertPuedePostventa(this.tipoVenta, this._estado)
    for (const l of input.lineasDevueltas) {
      InvariantesVenta.assertCantidadNetaSuficiente(
        this.cantidadNetaProducto(l.productoId),
        l.cantidad,
        l.productoId,
      )
    }

    const valorDevuelto = CalculadoraDiferenciaCambio.valorDevuelto(input.lineasDevueltas)
    const valorNuevo = CalculadoraDiferenciaCambio.valorNuevo(input.lineasNuevas)
    const firmada = CalculadoraDiferenciaCambio.diferencia(valorNuevo, valorDevuelto)

    let resolucion: ResolucionDiferenciaCambio
    if (firmada === 0) {
      resolucion = 'sin_diferencia'
    } else if (firmada > 0) {
      resolucion = 'cobro'
      if (!input.pagoDiferencia) {
        throw new VentasDomainError(
          'INVALID_PAYMENT',
          'La diferencia a favor de la librería requiere registrar el pago de la diferencia.',
        )
      }
      if (input.pagoDiferencia.monto !== firmada) {
        throw new VentasDomainError(
          'INVALID_PAYMENT',
          `El pago de diferencia debe ser exactamente ${firmada} ${this.moneda} (calculado).`,
        )
      }
      if (!input.pagoId) {
        throw new VentasDomainError('INVALID_STATE', 'Falta identificador del pago de diferencia.')
      }
    } else {
      if (!input.compensacionCliente) {
        throw new VentasDomainError(
          'INVALID_STATE',
          'La diferencia a favor del cliente requiere devolución de dinero o preparación de NC.',
        )
      }
      resolucion = input.compensacionCliente
    }

    const cambio = Cambio.crear({
      id: input.cambioId,
      usuarioId: input.usuarioId,
      lineasDevueltas: input.lineasDevueltas.map((l) => ({ ...l, moneda: this.moneda })),
      lineasNuevas: input.lineasNuevas.map((l) => ({ ...l, moneda: this.moneda })),
      resolucion,
    })
    this._cambios.push(cambio)
    this._tieneCambios = true

    if (firmada > 0 && input.pagoDiferencia && input.pagoId) {
      const pago = Pago.crear({
        id: input.pagoId,
        formaPago: input.pagoDiferencia.formaPago,
        monto: input.pagoDiferencia.monto,
        moneda: this.moneda,
        montoEntregadoEfectivo: input.pagoDiferencia.montoEntregadoEfectivo,
      })
      this._pagos.push(pago)
      if (input.historialPagoId) {
        this._historial.push(
          HistorialVenta.crear({
            id: input.historialPagoId,
            tipoEvento: 'pago',
            usuarioId: input.usuarioId,
            detalle: `Pago diferencia cambio · ${firmada} ${this.moneda} · ${input.pagoDiferencia.formaPago} · sucursal ${this.sucursalId}`,
          }),
        )
      }
    }

    const devueltosTxt = input.lineasDevueltas
      .map(
        (l) =>
          `${l.descripcionSnapshot ?? l.productoId}×${l.cantidad} (${l.precioUnitario * l.cantidad} ${this.moneda})`,
      )
      .join('; ')
    const sinSalida = input.lineasNuevas.length === 0
    const nuevosTxt = sinSalida
      ? '—'
      : input.lineasNuevas
          .map(
            (l) =>
              `${l.descripcionSnapshot ?? l.productoId}×${l.cantidad} (${l.precioUnitario * l.cantidad} ${this.moneda})`,
          )
          .join('; ')

    let etiquetaEvento: string
    if (sinSalida) {
      etiquetaEvento = 'Cambio sin producto de salida'
    } else if (resolucion === 'nota_credito') {
      etiquetaEvento = 'Cambio con Nota de Crédito'
    } else if (firmada !== 0) {
      etiquetaEvento = 'Cambio con diferencia'
    } else {
      etiquetaEvento = 'Cambio'
    }

    const compensacionTxt =
      firmada > 0
        ? `monto adicional ${firmada} ${this.moneda}`
        : firmada < 0
          ? `monto a favor cliente ${Math.abs(firmada)} ${this.moneda} (${resolucion})`
          : 'sin diferencia monetaria'

    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'cambio',
        usuarioId: input.usuarioId,
        detalle: `${etiquetaEvento} · sucursal ${this.sucursalId} · devuelto: [${devueltosTxt}] = ${valorDevuelto} ${this.moneda} · entregado: [${nuevosTxt}] = ${valorNuevo} ${this.moneda} · ${compensacionTxt}`,
      }),
    )
    this._pendingInventory = EmisorIntencionInventario.efectoCambio({
      ventaId: this.id,
      cambioId: input.cambioId,
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKeyInventario,
      almacenId: this.almacenId,
      entradas: input.lineasDevueltas,
      salidas: input.lineasNuevas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      })),
    })
    this.record({
      eventId: newEventId(),
      name: 'CambioVentaRegistrado',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { cambioId: input.cambioId },
    })
    this.record({
      eventId: newEventId(),
      name: 'EfectoInventarioVentaSolicitado',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: {
        tipoEfecto: 'efecto_cambio',
        idempotencyKey: input.idempotencyKeyInventario,
      },
    })
  }

  emitirNotaCredito(input: {
    notaCreditoId: string
    historialId: string
    usuarioId: string
    monto: number
    motivo: string
  }): NotaCredito {
    MaquinaEstadosVenta.assertTransicionPermitida(this._estado, 'emitir_nota_credito')
    PoliticaPostventaCliente.assertPuedePostventa(this.tipoVenta, this._estado)
    const saldo = this.saldoAcreditable()
    InvariantesVenta.assertNotaCredito({
      ventaOrigenId: this.id,
      aggregateId: this.id,
      monto: input.monto,
      saldoAcreditable: saldo,
      clienteId: this.clienteId,
    })
    const nc = NotaCredito.crear({
      id: input.notaCreditoId,
      ventaOrigenId: this.id,
      clienteId: this.clienteId!,
      usuarioId: input.usuarioId,
      monto: input.monto,
      moneda: this.moneda,
      motivo: input.motivo,
    })
    this._notasCredito.push(nc)
    this._tieneNotasCredito = true
    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'nota_credito',
        usuarioId: input.usuarioId,
        detalle: `NC ${input.notaCreditoId} por ${input.monto}`,
      }),
    )
    this.record({
      eventId: newEventId(),
      name: 'NotaCreditoEmitida',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { notaCreditoId: input.notaCreditoId, monto: input.monto },
    })
    return nc
  }

  anular(input: {
    historialId: string
    usuarioId: string
    motivo: string
    idempotencyKeyInventario: string
  }): void {
    MaquinaEstadosVenta.assertTransicionPermitida(this._estado, 'anular')
    if (!input.motivo.trim()) {
      throw new VentasDomainError('INVALID_STATE', 'La anulación requiere motivo.')
    }
    this._estado = 'anulada'
    this._motivoAnulacion = input.motivo.trim()
    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'anulacion',
        usuarioId: input.usuarioId,
        detalle: input.motivo,
      }),
    )
    this._pendingInventory = EmisorIntencionInventario.reversionAnulacion({
      ventaId: this.id,
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKeyInventario,
      almacenId: this.almacenId,
      lineas: this._lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad.value,
      })),
    })
    this.record({
      eventId: newEventId(),
      name: 'FacturaAnulada',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { motivo: this._motivoAnulacion },
    })
    this.record({
      eventId: newEventId(),
      name: 'EfectoInventarioVentaSolicitado',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: {
        tipoEfecto: 'reversion_anulacion',
        idempotencyKey: input.idempotencyKeyInventario,
      },
    })
  }

  registrarReimpresion(input: { historialId: string; usuarioId: string }): void {
    MaquinaEstadosVenta.assertTransicionPermitida(this._estado, 'reimprimir')
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'reimpresion',
        usuarioId: input.usuarioId,
      }),
    )
    this._version += 1
    this.record({
      eventId: newEventId(),
      name: 'FacturaReimpresa',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { usuarioId: input.usuarioId },
    })
  }

  /**
   * Aplica una NC de esta venta a otra factura destino.
   * Única vía pública para mutar `NotaCredito` (INV: hijas solo vía AR).
   * No solicita efectos de inventario.
   */
  aplicarNotaCredito(input: {
    notaCreditoId: string
    ventaDestinoId: string
    monto: number
    historialId: string
    usuarioId: string
  }): void {
    if (this._estado === 'anulada') {
      throw new VentasDomainError('INVALID_STATE', 'No se puede aplicar NC desde una factura anulada.')
    }
    const nc = this._notasCredito.find((n) => n.id === input.notaCreditoId)
    if (!nc) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'Nota de crédito no encontrada en la factura.')
    }
    nc.aplicarDesdeAgregado(input.ventaDestinoId, input.monto)
    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'aplicacion_nc',
        usuarioId: input.usuarioId,
        detalle: `NC ${input.notaCreditoId} aplicada a ${input.ventaDestinoId} · ${input.monto} ${this.moneda}`,
      }),
    )
    this.record({
      eventId: newEventId(),
      name: 'NotaCreditoAplicada',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: {
        notaCreditoId: input.notaCreditoId,
        ventaDestinoId: input.ventaDestinoId,
        monto: input.monto,
      },
    })
  }

  /** Revierte aplicaciones de una NC (deja Disponible). No toca inventario. */
  revertirAplicacionesNotaCredito(input: {
    notaCreditoId: string
    historialId: string
    usuarioId: string
  }): void {
    const nc = this._notasCredito.find((n) => n.id === input.notaCreditoId)
    if (!nc) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'Nota de crédito no encontrada en la factura.')
    }
    nc.revertirAplicacionesDesdeAgregado()
    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'aplicacion_nc',
        usuarioId: input.usuarioId,
        detalle: `Reversión de aplicaciones de NC ${input.notaCreditoId}`,
      }),
    )
  }

  /** Anula NC sin aplicaciones. No toca inventario. */
  anularNotaCredito(input: {
    notaCreditoId: string
    historialId: string
    usuarioId: string
    motivo?: string
  }): void {
    const nc = this._notasCredito.find((n) => n.id === input.notaCreditoId)
    if (!nc) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'Nota de crédito no encontrada en la factura.')
    }
    nc.anularDesdeAgregado()
    this._version += 1
    this._historial.push(
      HistorialVenta.crear({
        id: input.historialId,
        tipoEvento: 'anulacion',
        usuarioId: input.usuarioId,
        detalle: `Anulación NC ${input.notaCreditoId}${input.motivo ? ` · ${input.motivo}` : ''}`,
      }),
    )
  }

  markInventoryConfirmed(tipoEfecto: string): void {
    this.record({
      eventId: newEventId(),
      name: 'EfectoInventarioVentaConfirmado',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { tipoEfecto },
    })
  }

  markInventoryFailed(tipoEfecto: string, message: string): void {
    this.record({
      eventId: newEventId(),
      name: 'EfectoInventarioVentaFallido',
      occurredAt: new Date(),
      aggregateType: 'Venta',
      aggregateId: this.id,
      payload: { tipoEfecto, message },
    })
  }

  toProps(): VentaProps {
    return {
      id: this.id,
      numeroFactura: this.numeroFactura.value,
      estado: this._estado,
      tipoVenta: this.tipoVenta,
      clienteId: this.clienteId,
      sucursalId: this.sucursalId,
      almacenId: this.almacenId,
      usuarioEmisionId: this.usuarioEmisionId,
      moneda: this.moneda,
      fechaEmision: this.fechaEmision.toISOString(),
      subtotal: this.subtotal.monto,
      totalDescuentos: this.totalDescuentos.monto,
      total: this.total.monto,
      version: this._version,
      tieneCambios: this._tieneCambios,
      tieneDevoluciones: this._tieneDevoluciones,
      tieneNotasCredito: this._tieneNotasCredito,
      motivoAnulacion: this._motivoAnulacion,
      lineas: this._lineas.map((l) => l.toProps()),
      pagos: this._pagos.map((p) => p.toProps()),
      cambios: this._cambios.map((c) => c.toProps()),
      devoluciones: this._devoluciones.map((d) => d.toProps()),
      notasCredito: this._notasCredito.map((n) => n.toProps()),
      historial: this._historial.map((h) => h.toProps()),
    }
  }

  private record(event: VentasDomainEvent): void {
    this._events.push(event)
  }
}
