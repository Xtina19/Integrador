import type { MonedaCodigo } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'
import { Dinero } from './Dinero'

/** Descuento por monto o porcentaje; no deja totales negativos (validado por el AR). */
export type Descuento =
  | { tipo: 'monto'; valor: Dinero }
  | { tipo: 'porcentaje'; valor: number }

export function descuentoMonto(dinero: Dinero): Descuento {
  return { tipo: 'monto', valor: dinero }
}

export function descuentoPorcentaje(valor: number): Descuento {
  if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new VentasDomainError('INVALID_DISCOUNT', 'El porcentaje de descuento debe estar entre 0 y 100.', {
      valor,
    })
  }
  return { tipo: 'porcentaje', valor }
}

export function aplicarDescuentoABase(base: Dinero, descuento: Descuento | undefined): Dinero {
  if (!descuento) return base
  if (descuento.tipo === 'monto') {
    if (descuento.valor.moneda !== base.moneda) {
      throw new VentasDomainError('CURRENCY_MISMATCH', 'El descuento debe usar la moneda del documento.')
    }
    if (descuento.valor.monto > base.monto) {
      throw new VentasDomainError('INVALID_DISCOUNT', 'El descuento no puede superar el importe base.')
    }
    return base.subtract(descuento.valor)
  }
  const rebaja = Math.round((base.monto * descuento.valor) / 100)
  return Dinero.of(base.monto - rebaja, base.moneda as MonedaCodigo)
}
