import type { ResolucionDiferenciaCambio, MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { CantidadVenta } from '../value-objects/CantidadVenta'
import { Dinero } from '../value-objects/Dinero'
import { CalculadoraDiferenciaCambio } from '../services/CalculadorasVenta'

export interface LineaCambioProps {
  productoId: string
  cantidad: number
  precioUnitario?: number
  descripcionSnapshot?: string
}

export interface CambioProps {
  id: string
  fecha: string
  usuarioId: string
  lineasDevueltas: LineaCambioProps[]
  lineasNuevas: LineaCambioProps[]
  /** Valor de mercancía devuelta (DOP enteros). */
  valorDevuelto: number
  /** Valor de mercancía entregada (DOP enteros). */
  valorNuevo: number
  /**
   * Magnitud de la diferencia (|valorNuevo − valorDevuelto|).
   * El sentido lo define `resolucion` (cobro vs devolución/NC).
   */
  diferenciaMonto: number
  moneda: MonedaCodigo
  resolucion: ResolucionDiferenciaCambio
}

/** Cambio de productos sobre la misma factura (no es módulo independiente). */
export class Cambio {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly usuarioId: string,
    readonly lineasDevueltas: ReadonlyArray<{
      productoId: string
      cantidad: CantidadVenta
      precioUnitario: Dinero
      descripcionSnapshot: string
    }>,
    readonly lineasNuevas: ReadonlyArray<{
      productoId: string
      cantidad: CantidadVenta
      precioUnitario: Dinero
      descripcionSnapshot: string
    }>,
    readonly valorDevuelto: Dinero,
    readonly valorNuevo: Dinero,
    readonly diferencia: Dinero,
    readonly resolucion: ResolucionDiferenciaCambio,
  ) {}

  static crear(input: {
    id: string
    fecha?: Date
    usuarioId: string
    lineasDevueltas: Array<{
      productoId: string
      cantidad: number
      precioUnitario: number
      moneda: MonedaCodigo
      descripcionSnapshot?: string
    }>
    lineasNuevas: Array<{
      productoId: string
      cantidad: number
      precioUnitario: number
      moneda: MonedaCodigo
      descripcionSnapshot?: string
    }>
    resolucion: ResolucionDiferenciaCambio
  }): Cambio {
    if (!input.usuarioId.trim()) {
      throw new VentasDomainError('INVALID_STATE', 'El cambio requiere usuario.')
    }
    if (input.lineasDevueltas.length === 0) {
      throw new VentasDomainError(
        'INVALID_LINE',
        'El cambio requiere al menos un producto devuelto.',
      )
    }
    // lineasNuevas puede ir vacío: devolución física sin producto de salida (caso 4).

    const moneda = input.lineasDevueltas[0]!.moneda
    const valorDevuelto = CalculadoraDiferenciaCambio.valorDevuelto(
      input.lineasDevueltas.map((l) => ({
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
      })),
    )
    const valorNuevo = CalculadoraDiferenciaCambio.valorNuevo(
      input.lineasNuevas.map((l) => ({
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
      })),
    )
    const firmada = CalculadoraDiferenciaCambio.diferencia(valorNuevo, valorDevuelto)
    const magnitud = Math.abs(firmada)

    if (firmada === 0 && input.resolucion !== 'sin_diferencia') {
      throw new VentasDomainError(
        'INVALID_STATE',
        'Sin diferencia monetaria la resolución debe ser sin_diferencia.',
      )
    }
    if (firmada > 0 && input.resolucion !== 'cobro') {
      throw new VentasDomainError(
        'INVALID_STATE',
        'Diferencia a favor de la librería requiere resolución cobro.',
      )
    }
    if (firmada < 0 && input.resolucion !== 'devolucion_dinero' && input.resolucion !== 'nota_credito') {
      throw new VentasDomainError(
        'INVALID_STATE',
        'Diferencia a favor del cliente requiere devolución de dinero o nota de crédito.',
      )
    }

    return new Cambio(
      input.id,
      input.fecha ?? new Date(),
      input.usuarioId,
      input.lineasDevueltas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
        precioUnitario: Dinero.of(l.precioUnitario, l.moneda),
        descripcionSnapshot: l.descripcionSnapshot?.trim() || l.productoId,
      })),
      input.lineasNuevas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
        precioUnitario: Dinero.of(l.precioUnitario, l.moneda),
        descripcionSnapshot: l.descripcionSnapshot?.trim() || l.productoId,
      })),
      Dinero.of(valorDevuelto, moneda),
      Dinero.of(valorNuevo, moneda),
      Dinero.of(magnitud, moneda),
      input.resolucion,
    )
  }

  static rehidratar(props: CambioProps): Cambio {
    const moneda = props.moneda
    const computedDevuelto = CalculadoraDiferenciaCambio.valorDevuelto(
      props.lineasDevueltas.map((l) => ({
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario ?? 0,
      })),
    )
    const computedNuevo = CalculadoraDiferenciaCambio.valorNuevo(
      props.lineasNuevas.map((l) => ({
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario ?? 0,
      })),
    )
    const valorDevuelto =
      props.valorDevuelto !== undefined && props.valorDevuelto > 0
        ? props.valorDevuelto
        : computedDevuelto
    const valorNuevo =
      props.valorNuevo !== undefined && props.valorNuevo > 0
        ? props.valorNuevo
        : computedNuevo
    return new Cambio(
      props.id,
      new Date(props.fecha),
      props.usuarioId,
      props.lineasDevueltas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
        precioUnitario: Dinero.of(l.precioUnitario ?? 0, moneda),
        descripcionSnapshot: l.descripcionSnapshot ?? l.productoId,
      })),
      props.lineasNuevas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
        precioUnitario: Dinero.of(l.precioUnitario ?? 0, moneda),
        descripcionSnapshot: l.descripcionSnapshot ?? l.productoId,
      })),
      Dinero.of(valorDevuelto, moneda),
      Dinero.of(valorNuevo, moneda),
      Dinero.of(props.diferenciaMonto, moneda),
      props.resolucion,
    )
  }

  /** Diferencia firmada: positivo = cobro; negativo = a favor del cliente. */
  get diferenciaFirmada(): number {
    return this.valorNuevo.monto - this.valorDevuelto.monto
  }

  toProps(): CambioProps {
    return {
      id: this.id,
      fecha: this.fecha.toISOString(),
      usuarioId: this.usuarioId,
      lineasDevueltas: this.lineasDevueltas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad.value,
        precioUnitario: l.precioUnitario.monto,
        descripcionSnapshot: l.descripcionSnapshot,
      })),
      lineasNuevas: this.lineasNuevas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad.value,
        precioUnitario: l.precioUnitario.monto,
        descripcionSnapshot: l.descripcionSnapshot,
      })),
      valorDevuelto: this.valorDevuelto.monto,
      valorNuevo: this.valorNuevo.monto,
      diferenciaMonto: this.diferencia.monto,
      moneda: this.diferencia.moneda,
      resolucion: this.resolucion,
    }
  }
}
