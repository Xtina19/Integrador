import type { FormaPago, MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { Dinero } from '../value-objects/Dinero'

export interface PagoProps {
  id: string
  formaPago: FormaPago
  monto: number
  moneda: MonedaCodigo
  /** ID de la NC aplicada. Obligatorio si formaPago === nota_credito. */
  notaCreditoId?: string
  vuelto?: number
}

/** Pago asociado a la venta (simple o parte de mixto). */
export class Pago {
  private constructor(
    readonly id: string,
    readonly formaPago: FormaPago,
    readonly monto: Dinero,
    readonly notaCreditoId: string | undefined,
    readonly vuelto: Dinero | undefined,
  ) {}

  static crear(input: {
    id: string
    formaPago: FormaPago
    monto: number
    moneda: MonedaCodigo
    notaCreditoId?: string
    montoEntregadoEfectivo?: number
  }): Pago {
    const monto = Dinero.of(input.monto, input.moneda)
    if (monto.monto <= 0) {
      throw new VentasDomainError('INVALID_PAYMENT', 'El monto del pago debe ser mayor que 0.')
    }

    let notaCreditoId: string | undefined
    if (input.formaPago === 'nota_credito') {
      const ncId = input.notaCreditoId?.trim()
      if (!ncId) {
        throw new VentasDomainError(
          'INVALID_PAYMENT',
          'Pago con nota de crédito requiere notaCreditoId.',
        )
      }
      notaCreditoId = ncId
    }

    let vuelto: Dinero | undefined
    if (input.formaPago === 'efectivo' && input.montoEntregadoEfectivo !== undefined) {
      const entregado = Dinero.of(input.montoEntregadoEfectivo, input.moneda)
      if (entregado.monto < monto.monto) {
        throw new VentasDomainError('INVALID_PAYMENT', 'El efectivo entregado es insuficiente.')
      }
      vuelto = Dinero.of(entregado.monto - monto.monto, input.moneda)
    }
    return new Pago(input.id, input.formaPago, monto, notaCreditoId, vuelto)
  }

  static rehidratar(props: PagoProps): Pago {
    return new Pago(
      props.id,
      props.formaPago,
      Dinero.of(props.monto, props.moneda, { permitirDecimales: !Number.isInteger(props.monto) }),
      props.notaCreditoId,
      props.vuelto !== undefined
        ? Dinero.of(props.vuelto, props.moneda, { permitirDecimales: !Number.isInteger(props.vuelto) })
        : undefined,
    )
  }

  toProps(): PagoProps {
    return {
      id: this.id,
      formaPago: this.formaPago,
      monto: this.monto.monto,
      moneda: this.monto.moneda,
      notaCreditoId: this.notaCreditoId,
      vuelto: this.vuelto?.monto,
    }
  }
}
