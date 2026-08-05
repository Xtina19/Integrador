import type { MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'

/** Redondeo bancario a 2 decimales (estándar monetario ERP: DECIMAL(18,2)). */
export function roundMoney(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100
}

/**
 * Dinero del documento.
 * Estándar global: importes con hasta 2 decimales (centavos).
 */
export class Dinero {
  private constructor(
    readonly monto: number,
    readonly moneda: MonedaCodigo,
  ) {}

  static of(monto: number, moneda: MonedaCodigo, _opts?: { permitirDecimales?: boolean }): Dinero {
    if (!Number.isFinite(monto)) {
      throw new VentasDomainError('INVALID_MONEY', 'El monto no es un número válido.', { monto, moneda })
    }
    if (monto < 0) {
      throw new VentasDomainError('INVALID_MONEY', 'El monto no puede ser negativo.', { monto, moneda })
    }
    const scaled = roundMoney(monto)
    // Rechaza más de 2 decimales de precisión efectiva (ruido float)
    if (Math.abs(monto - scaled) > 0.001) {
      throw new VentasDomainError(
        'INVALID_MONEY',
        'El monto no puede tener más de 2 decimales.',
        { monto, moneda },
      )
    }
    return new Dinero(scaled, moneda)
  }

  static cero(moneda: MonedaCodigo): Dinero {
    return Dinero.of(0, moneda)
  }

  add(other: Dinero): Dinero {
    this.assertSameCurrency(other)
    return Dinero.of(this.monto + other.monto, this.moneda)
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
    return Dinero.of(result, this.moneda)
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
