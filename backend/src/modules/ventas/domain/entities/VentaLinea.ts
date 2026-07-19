import type { MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { aplicarDescuentoABase, type Descuento } from '../value-objects/Descuento'
import { Dinero } from '../value-objects/Dinero'
import { CantidadVenta } from '../value-objects/CantidadVenta'

export interface VentaLineaProps {
  id: string
  productoId: string
  descripcionSnapshot: string
  cantidad: number
  precioUnitario: number
  moneda: MonedaCodigo
  descuento?: Descuento
  importeNeto: number
}

/** Línea inmutable de lo vendido al emitir (snapshot). */
export class VentaLinea {
  private constructor(
    readonly id: string,
    readonly productoId: string,
    readonly descripcionSnapshot: string,
    readonly cantidad: CantidadVenta,
    readonly precioUnitario: Dinero,
    readonly descuento: Descuento | undefined,
    readonly importeNeto: Dinero,
  ) {}

  static crear(input: {
    id: string
    productoId: string
    descripcionSnapshot: string
    cantidad: number
    precioUnitario: number
    moneda: MonedaCodigo
    descuento?: Descuento
  }): VentaLinea {
    if (!input.productoId.trim()) {
      throw new VentasDomainError('INVALID_LINE', 'La línea requiere productoId.')
    }
    const cantidad = CantidadVenta.of(input.cantidad)
    const precio = Dinero.of(input.precioUnitario, input.moneda)
    const bruto = Dinero.of(precio.monto * cantidad.value, input.moneda)
    const neto = aplicarDescuentoABase(bruto, input.descuento)
    return new VentaLinea(
      input.id,
      input.productoId,
      input.descripcionSnapshot.trim() || input.productoId,
      cantidad,
      precio,
      input.descuento,
      neto,
    )
  }

  static rehidratar(props: VentaLineaProps): VentaLinea {
    return new VentaLinea(
      props.id,
      props.productoId,
      props.descripcionSnapshot,
      CantidadVenta.of(props.cantidad),
      Dinero.of(props.precioUnitario, props.moneda, { permitirDecimales: !Number.isInteger(props.precioUnitario) }),
      props.descuento,
      Dinero.of(props.importeNeto, props.moneda, { permitirDecimales: !Number.isInteger(props.importeNeto) }),
    )
  }

  toProps(): VentaLineaProps {
    return {
      id: this.id,
      productoId: this.productoId,
      descripcionSnapshot: this.descripcionSnapshot,
      cantidad: this.cantidad.value,
      precioUnitario: this.precioUnitario.monto,
      moneda: this.precioUnitario.moneda,
      descuento: this.descuento,
      importeNeto: this.importeNeto.monto,
    }
  }
}
