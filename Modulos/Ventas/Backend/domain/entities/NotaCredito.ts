import type { EstadoNotaCredito, MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { Dinero } from '../value-objects/Dinero'

export interface AplicacionNotaCreditoProps {
  ventaDestinoId: string
  montoAplicado: number
  fecha: string
}

export interface NotaCreditoProps {
  id: string
  ventaOrigenId: string
  clienteId: string
  fecha: string
  usuarioId: string
  monto: number
  moneda: MonedaCodigo
  motivo: string
  estado: EstadoNotaCredito
  montoAplicado: number
  aplicaciones: AplicacionNotaCreditoProps[]
}

/** Nota de crédito siempre ligada a una factura origen. */
export class NotaCredito {
  private constructor(
    readonly id: string,
    readonly ventaOrigenId: string,
    readonly clienteId: string,
    readonly fecha: Date,
    readonly usuarioId: string,
    readonly monto: Dinero,
    readonly motivo: string,
    private _estado: EstadoNotaCredito,
    private _montoAplicado: number,
    private _aplicaciones: AplicacionNotaCreditoProps[],
  ) {}

  static crear(input: {
    id: string
    ventaOrigenId: string
    clienteId: string
    usuarioId: string
    monto: number
    moneda: MonedaCodigo
    motivo: string
    fecha?: Date
  }): NotaCredito {
    if (!input.clienteId.trim()) {
      throw new VentasDomainError('INVALID_CUSTOMER', 'La nota de crédito requiere cliente registrado.')
    }
    if (!input.motivo.trim()) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'La nota de crédito requiere motivo.')
    }
    const monto = Dinero.of(input.monto, input.moneda)
    if (monto.monto <= 0) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'El monto de la NC debe ser mayor que 0.')
    }
    return new NotaCredito(
      input.id,
      input.ventaOrigenId,
      input.clienteId,
      input.fecha ?? new Date(),
      input.usuarioId,
      monto,
      input.motivo.trim(),
      'emitida',
      0,
      [],
    )
  }

  static rehidratar(props: NotaCreditoProps): NotaCredito {
    return new NotaCredito(
      props.id,
      props.ventaOrigenId,
      props.clienteId,
      new Date(props.fecha),
      props.usuarioId,
      Dinero.of(props.monto, props.moneda),
      props.motivo,
      props.estado,
      props.montoAplicado,
      [...props.aplicaciones],
    )
  }

  get estado(): EstadoNotaCredito {
    return this._estado
  }

  get montoAplicado(): number {
    return this._montoAplicado
  }

  get saldoPendiente(): number {
    return this.monto.monto - this._montoAplicado
  }

  get aplicaciones(): readonly AplicacionNotaCreditoProps[] {
    return this._aplicaciones
  }

  /**
   * Mutación interna del agregado. No invocar desde aplicación/infraestructura.
   * Usar `Venta.aplicarNotaCredito`.
   */
  aplicarDesdeAgregado(ventaDestinoId: string, montoAplicado: number, fecha = new Date()): void {
    this.aplicar(ventaDestinoId, montoAplicado, fecha)
  }

  private aplicar(ventaDestinoId: string, montoAplicado: number, fecha = new Date()): void {
    if (this._estado === 'anulada') {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'No se puede aplicar una NC anulada.')
    }
    if (montoAplicado <= 0 || montoAplicado > this.saldoPendiente) {
      throw new VentasDomainError('CREDIT_EXCEEDED', 'Monto de aplicación inválido para la NC.', {
        montoAplicado,
        saldo: this.saldoPendiente,
      })
    }
    this._montoAplicado += montoAplicado
    this._aplicaciones.push({
      ventaDestinoId,
      montoAplicado,
      fecha: fecha.toISOString(),
    })
    this._estado =
      this._montoAplicado >= this.monto.monto ? 'aplicada' : 'parcialmente_aplicada'
  }

  /**
   * Revierte todas las aplicaciones (deja la NC nuevamente disponible).
   * Requerido antes de anular una NC parcial o totalmente utilizada.
   */
  revertirAplicacionesDesdeAgregado(): void {
    if (this._estado === 'anulada') {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'Una NC anulada no admite reversión de aplicaciones.')
    }
    if (this._aplicaciones.length === 0) {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'La NC no tiene aplicaciones que revertir.')
    }
    this._aplicaciones = []
    this._montoAplicado = 0
    this._estado = 'emitida'
  }

  /** Anula la NC. Solo si no tiene aplicaciones (saldo = monto completo). */
  anularDesdeAgregado(): void {
    if (this._estado === 'anulada') {
      throw new VentasDomainError('INVALID_CREDIT_NOTE', 'La NC ya está anulada.')
    }
    if (this._montoAplicado > 0 || this._aplicaciones.length > 0) {
      throw new VentasDomainError(
        'INVALID_CREDIT_NOTE',
        'No se puede anular una NC con aplicaciones. Revierta todas las aplicaciones primero.',
      )
    }
    this._estado = 'anulada'
  }

  toProps(): NotaCreditoProps {
    return {
      id: this.id,
      ventaOrigenId: this.ventaOrigenId,
      clienteId: this.clienteId,
      fecha: this.fecha.toISOString(),
      usuarioId: this.usuarioId,
      monto: this.monto.monto,
      moneda: this.monto.moneda,
      motivo: this.motivo,
      estado: this._estado,
      montoAplicado: this._montoAplicado,
      aplicaciones: [...this._aplicaciones],
    }
  }
}
