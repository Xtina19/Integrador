import { IIdGenerator } from '../../application/ports/outbound'
import { randomUUID } from 'node:crypto'

export class UuidIdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID()
  }
}

export class SequentialIdGenerator implements IIdGenerator {
  private n = 0
  generate(): string {
    this.n += 1
    return `gen-${this.n}`
  }
}
