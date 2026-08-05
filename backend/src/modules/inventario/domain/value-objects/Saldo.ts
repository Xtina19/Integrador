import { InventoryDomainError } from '../errors/InventoryDomainError'
import { Cantidad } from './Cantidad'

/** Saldo de existencia; nunca negativo. */
export class Saldo {
  private constructor(readonly value: number) {}

  static of(value: number): Saldo {
    if (!Number.isInteger(value) || value < 0) {
      throw new InventoryDomainError(
        'INVALID_SALDO',
        'El saldo debe ser un entero mayor o igual a 0.',
        { value },
      )
    }
    return new Saldo(value)
  }

  add(cantidad: Cantidad): Saldo {
    return Saldo.of(this.value + cantidad.value)
  }

  subtract(cantidad: Cantidad): Saldo {
    const next = this.value - cantidad.value
    if (next < 0) {
      throw new InventoryDomainError(
        'INSUFFICIENT_STOCK',
        'Stock insuficiente para la operación.',
        { saldoActual: this.value, cantidad: cantidad.value },
      )
    }
    return Saldo.of(next)
  }

  equals(other: Saldo): boolean {
    return this.value === other.value
  }
}
