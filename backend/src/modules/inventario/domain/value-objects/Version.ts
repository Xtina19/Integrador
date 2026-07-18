import { InventoryDomainError } from '../errors/InventoryDomainError'

export class Version {
  private constructor(readonly value: number) {}

  static of(value: number): Version {
    if (!Number.isInteger(value) || value < 1) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'La versión de concurrencia debe ser un entero >= 1.',
        { value },
      )
    }
    return new Version(value)
  }

  next(): Version {
    return new Version(this.value + 1)
  }

  equals(other: Version): boolean {
    return this.value === other.value
  }
}
