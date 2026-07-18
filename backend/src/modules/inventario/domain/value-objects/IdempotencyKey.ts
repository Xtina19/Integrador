import { InventoryDomainError } from '../errors/InventoryDomainError'

export class IdempotencyKey {
  private constructor(readonly value: string) {}

  static of(value: string): IdempotencyKey {
    const trimmed = value.trim()
    if (trimmed.length === 0 || trimmed.length > 80) {
      throw new InventoryDomainError(
        'MISSING_IDEMPOTENCY_KEY',
        'La clave de idempotencia es obligatoria y no puede superar 80 caracteres.',
        { length: trimmed.length },
      )
    }
    return new IdempotencyKey(trimmed)
  }

  equals(other: IdempotencyKey): boolean {
    return this.value === other.value
  }
}
