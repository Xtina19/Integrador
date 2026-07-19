import { VentasDomainError } from '../errors/VentasDomainError'

export class NumeroFactura {
  private constructor(readonly value: string) {}

  static of(value: string): NumeroFactura {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new VentasDomainError('INVALID_LINE', 'El número de factura es obligatorio.')
    }
    return new NumeroFactura(trimmed)
  }
}
