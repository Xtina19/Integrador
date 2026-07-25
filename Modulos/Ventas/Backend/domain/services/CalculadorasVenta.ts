import type { MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import type { VentaLinea } from '../entities/VentaLinea'
import type { Pago } from '../entities/Pago'
import { Dinero } from '../value-objects/Dinero'

export class CalculadoraTotalesVenta {
  static sumarLineas(lineas: readonly VentaLinea[], moneda: MonedaCodigo): {
    subtotal: Dinero
    totalDescuentos: Dinero
    total: Dinero
  } {
    if (lineas.length === 0) {
      throw new VentasDomainError('EMPTY_LINES', 'La venta requiere al menos una línea.')
    }
    let bruto = 0
    let neto = 0
    for (const linea of lineas) {
      if (linea.precioUnitario.moneda !== moneda || linea.importeNeto.moneda !== moneda) {
        throw new VentasDomainError('CURRENCY_MISMATCH', 'Todas las líneas deben usar la moneda del documento.')
      }
      bruto += linea.precioUnitario.monto * linea.cantidad.value
      neto += linea.importeNeto.monto
    }
    const totalDescuentos = Dinero.of(bruto - neto, moneda)
    const total = Dinero.of(neto, moneda)
    if (total.monto < 0) {
      throw new VentasDomainError('NEGATIVE_TOTAL', 'El total de la venta no puede ser negativo.')
    }
    return {
      subtotal: Dinero.of(bruto, moneda),
      totalDescuentos,
      total,
    }
  }
}

export class CalculadoraCoberturaPagos {
  static totalPagado(pagos: readonly Pago[], moneda: MonedaCodigo): Dinero {
    let sum = 0
    for (const pago of pagos) {
      if (pago.monto.moneda !== moneda) {
        throw new VentasDomainError('CURRENCY_MISMATCH', 'Los pagos deben coincidir con la moneda del documento.')
      }
      sum += pago.monto.monto
    }
    return Dinero.of(sum, moneda)
  }

  static assertCubreTotal(pagos: readonly Pago[], total: Dinero): void {
    if (pagos.length === 0) {
      throw new VentasDomainError('PAYMENT_INCOMPLETE', 'La venta requiere al menos un pago.')
    }
    const pagado = this.totalPagado(pagos, total.moneda)
    if (pagado.monto !== total.monto) {
      throw new VentasDomainError(
        'PAYMENT_INCOMPLETE',
        'La suma de pagos debe igualar el total de la factura.',
        { pagado: pagado.monto, total: total.monto },
      )
    }
  }
}

export class CalculadoraCantidadNeta {
  static netoPorProducto(
    vendido: number,
    cambiadoDevuelto: number,
    devoluciones: number,
  ): number {
    const neto = vendido - cambiadoDevuelto - devoluciones
    if (neto < 0) {
      throw new VentasDomainError(
        'INSUFFICIENT_NET_QUANTITY',
        'La cantidad neta no puede ser negativa.',
        { vendido, cambiadoDevuelto, devoluciones },
      )
    }
    return neto
  }
}

export class CalculadoraSaldoAcreditable {
  static calcular(totalVenta: number, notasCreditoEmitidas: number): number {
    const saldo = totalVenta - notasCreditoEmitidas
    return saldo < 0 ? 0 : saldo
  }
}

export class CalculadoraDiferenciaCambio {
  static valorDevuelto(
    lineas: ReadonlyArray<{ cantidad: number; precioUnitario: number }>,
  ): number {
    return lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
  }

  static valorNuevo(
    lineas: ReadonlyArray<{ cantidad: number; precioUnitario: number }>,
  ): number {
    return lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0)
  }

  /** positivo = a favor de la tienda; negativo = a favor del cliente */
  static diferencia(valorNuevo: number, valorDevuelto: number): number {
    return valorNuevo - valorDevuelto
  }
}
