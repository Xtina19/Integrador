import type { EstadoVenta } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'

/**
 * Máquina de estados formal de la factura (VEN-DOM-2.0.0 §15).
 * Pseudoestado `ticket_pos` vive en aplicación; no es estado del AR.
 */
export type TransicionVenta =
  | 'registrar_cambio'
  | 'emitir_nota_credito'
  | 'reimprimir'
  | 'anular'

const TRANSICIONES: Record<EstadoVenta, readonly TransicionVenta[]> = {
  emitida: [
    'registrar_cambio',
    'emitir_nota_credito',
    'reimprimir',
    'anular',
  ],
  anulada: ['reimprimir'],
}

export class MaquinaEstadosVenta {
  static assertTransicionPermitida(estado: EstadoVenta, transicion: TransicionVenta): void {
    const permitidas = TRANSICIONES[estado]
    if (!permitidas.includes(transicion)) {
      throw new VentasDomainError(
        'FORBIDDEN_TRANSITION',
        `Transición "${transicion}" no permitida desde estado "${estado}".`,
        { estado, transicion, permitidas: [...permitidas] },
      )
    }
  }

  static esTerminal(estado: EstadoVenta): boolean {
    return estado === 'anulada'
  }

  static permitePostventa(estado: EstadoVenta): boolean {
    return estado === 'emitida'
  }
}
