import { VentasDomainError } from '../errors/VentasDomainError'

/** Cantidad entera > 0 (unidades físicas de librería). */
export class CantidadVenta {
  private constructor(readonly value: number) {}

  static of(value: number): CantidadVenta {
    if (!Number.isInteger(value) || value <= 0) {
      throw new VentasDomainError(
        'INVALID_QUANTITY',
        'La cantidad debe ser un entero mayor que 0.',
        { value },
      )
    }
    return new CantidadVenta(value)
  }

  equals(other: CantidadVenta): boolean {
    return this.value === other.value
  }
}
