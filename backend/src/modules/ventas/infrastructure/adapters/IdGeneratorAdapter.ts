import { randomUUID } from 'node:crypto'
import type { IdGeneratorPort } from '../../application/ports/outbound'

export class UuidIdGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return randomUUID()
  }
}

export class SequentialIdGeneratorAdapter implements IdGeneratorPort {
  private n = 0
  generate(): string {
    this.n += 1
    return `gen-ven-${this.n}`
  }
}
