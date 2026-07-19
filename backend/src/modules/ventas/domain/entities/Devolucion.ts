import type { AptitudReingreso, CompensacionDevolucion, MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { CantidadVenta } from '../value-objects/CantidadVenta'
import { Dinero } from '../value-objects/Dinero'

export interface LineaDevolucionProps {
  productoId: string
  cantidad: number
}

export interface DevolucionProps {
  id: string
  fecha: string
  usuarioId: string
  lineas: LineaDevolucionProps[]
  aptitudReingreso: AptitudReingreso
  compensacion: CompensacionDevolucion
  montoCompensacion: number
  moneda: MonedaCodigo
}

export class Devolucion {
  private constructor(
    readonly id: string,
    readonly fecha: Date,
    readonly usuarioId: string,
    readonly lineas: ReadonlyArray<{ productoId: string; cantidad: CantidadVenta }>,
    readonly aptitudReingreso: AptitudReingreso,
    readonly compensacion: CompensacionDevolucion,
    readonly montoCompensacion: Dinero,
  ) {}

  static crear(input: {
    id: string
    fecha?: Date
    usuarioId: string
    lineas: Array<{ productoId: string; cantidad: number }>
    aptitudReingreso: AptitudReingreso
    compensacion: CompensacionDevolucion
    montoCompensacion: number
    moneda: MonedaCodigo
  }): Devolucion {
    if (input.lineas.length === 0) {
      throw new VentasDomainError('INVALID_LINE', 'La devolución requiere al menos una línea.')
    }
    return new Devolucion(
      input.id,
      input.fecha ?? new Date(),
      input.usuarioId,
      input.lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
      })),
      input.aptitudReingreso,
      input.compensacion,
      Dinero.of(input.montoCompensacion, input.moneda),
    )
  }

  static rehidratar(props: DevolucionProps): Devolucion {
    return new Devolucion(
      props.id,
      new Date(props.fecha),
      props.usuarioId,
      props.lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: CantidadVenta.of(l.cantidad),
      })),
      props.aptitudReingreso,
      props.compensacion,
      Dinero.of(props.montoCompensacion, props.moneda),
    )
  }

  toProps(): DevolucionProps {
    return {
      id: this.id,
      fecha: this.fecha.toISOString(),
      usuarioId: this.usuarioId,
      lineas: this.lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad.value,
      })),
      aptitudReingreso: this.aptitudReingreso,
      compensacion: this.compensacion,
      montoCompensacion: this.montoCompensacion.monto,
      moneda: this.montoCompensacion.moneda,
    }
  }
}
