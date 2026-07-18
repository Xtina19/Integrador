import { InventoryDomainError } from '../errors/InventoryDomainError'

/** Cantidad entera no negativa del dominio de inventario. */
export class Cantidad {
  private constructor(readonly value: number) {}

  static of(value: number): Cantidad {
    if (!Number.isInteger(value) || value < 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'La cantidad debe ser un entero mayor o igual a 0.',
        { value },
      )
    }
    return new Cantidad(value)
  }

  static positive(value: number): Cantidad {
    const cantidad = Cantidad.of(value)
    if (cantidad.value === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'La cantidad del movimiento debe ser mayor que 0.',
        { value },
      )
    }
    return cantidad
  }

  equals(other: Cantidad): boolean {
    return this.value === other.value
  }
}
