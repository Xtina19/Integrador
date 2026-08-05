import { IClock } from '../../application/ports/outbound'

export class SystemClockAdapter implements IClock {
  now(): Date {
    return new Date()
  }
}

export class FixedClockAdapter implements IClock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return this.fixed
  }
}
