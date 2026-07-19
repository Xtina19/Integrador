import type { MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'

/**
 * Dinero del documento.
 * Operación diaria DOP: montos enteros (VEN-DATA). Centavos solo con justificación (p. ej. conversión).
 */
export class Dinero {
  private constructor(
    readonly monto: number,
    readonly moneda: MonedaCodigo,
  ) {}

  static of(monto: number, moneda: MonedaCodigo, opts?: { permitirDecimales?: boolean }): Dinero {
    if (!Number.isFinite(monto)) {
      throw new VentasDomainError('INVALID_MONEY', 'El monto no es un número válido.', { monto, moneda })
    }
    if (monto < 0) {
      throw new VentasDomainError('INVALID_MONEY', 'El monto no puede ser negativo.', { monto, moneda })
    }
    const permitirDecimales = opts?.permitirDecimales === true
    if (moneda === 'DOP' && !permitirDecimales && !Number.isInteger(monto)) {
      throw new VentasDomainError(
        'INVALID_MONEY',
        'En DOP de operación diaria el monto debe ser entero (sin centavos).',
        { monto, moneda },
      )
    }
    return new Dinero(monto, moneda)
  }

  static cero(moneda: MonedaCodigo): Dinero {
    return Dinero.of(0, moneda)
  }

  add(other: Dinero): Dinero {
    this.assertSameCurrency(other)
    return Dinero.of(this.monto + other.monto, this.moneda, { permitirDecimales: !Number.isInteger(this.monto) || !Number.isInteger(other.monto) })
  }

  subtract(other: Dinero): Dinero {
    this.assertSameCurrency(other)
    const result = this.monto - other.monto
    if (result < 0) {
      throw new VentasDomainError('INVALID_MONEY', 'La resta produciría un monto negativo.', {
        left: this.monto,
        right: other.monto,
      })
    }
    return Dinero.of(result, this.moneda, {
      permitirDecimales: !Number.isInteger(this.monto) || !Number.isInteger(other.monto),
    })
  }

  equals(other: Dinero): boolean {
    return this.moneda === other.moneda && this.monto === other.monto
  }

  private assertSameCurrency(other: Dinero): void {
    if (this.moneda !== other.moneda) {
      throw new VentasDomainError('CURRENCY_MISMATCH', 'No se pueden operar montos de monedas distintas.', {
        left: this.moneda,
        right: other.moneda,
      })
    }
  }
}
