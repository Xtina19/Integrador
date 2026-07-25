import type { TipoVenta } from '../enums'
import type { VentaLinea } from '../entities/VentaLinea'
import type { Pago } from '../entities/Pago'
import { VentasDomainError } from '../errors/VentasDomainError'
import { Dinero } from '../value-objects/Dinero'
import { CalculadoraCoberturaPagos } from '../services/CalculadorasVenta'

/**
 * Invariantes del Aggregate Root (VEN-DOM-2.0.0 §11).
 * Se invocan desde `Venta`; no sustituyen a la máquina de estados.
 */
export class InvariantesVenta {
  /** INV-01, INV-02, INV-03, INV-04, INV-10, INV-14 */
  static assertEmision(input: {
    lineas: readonly VentaLinea[]
    pagos: readonly Pago[]
    total: Dinero
    tipoVenta: TipoVenta
    clienteId: string | undefined
  }): void {
    if (input.lineas.length === 0) {
      throw new VentasDomainError('EMPTY_LINES', 'INV-01: la venta emitida requiere al menos una línea.')
    }
    for (const linea of input.lineas) {
      if (linea.cantidad.value <= 0) {
        throw new VentasDomainError('INVALID_QUANTITY', 'INV-01: cada línea debe tener cantidad > 0.')
      }
      if (linea.importeNeto.monto < 0) {
        throw new VentasDomainError('INVALID_DISCOUNT', 'INV-14: el importe de línea no puede ser negativo.')
      }
    }
    if (input.total.monto < 0) {
      throw new VentasDomainError('NEGATIVE_TOTAL', 'INV-02: el total no puede ser negativo.')
    }
    CalculadoraCoberturaPagos.assertCubreTotal(input.pagos, input.total)
    if (input.tipoVenta === 'cliente_registrado' && !input.clienteId?.trim()) {
      throw new VentasDomainError(
        'INVALID_CUSTOMER',
        'INV-04: cliente_registrado requiere clienteId.',
      )
    }
  }

  /** INV-06 */
  static assertCantidadNetaSuficiente(neto: number, solicitada: number, productoId: string): void {
    if (solicitada > neto) {
      throw new VentasDomainError(
        'INSUFFICIENT_NET_QUANTITY',
        `INV-06: cantidad ${solicitada} supera neto ${neto} para ${productoId}.`,
        { productoId, neto, solicitada },
      )
    }
  }

  /** INV-07, INV-12 */
  static assertNotaCredito(input: {
    ventaOrigenId: string
    aggregateId: string
    monto: number
    saldoAcreditable: number
    clienteId: string | undefined
  }): void {
    if (input.ventaOrigenId !== input.aggregateId) {
      throw new VentasDomainError(
        'INVALID_CREDIT_NOTE',
        'INV-12: la NC debe pertenecer a la venta origen.',
      )
    }
    if (!input.clienteId?.trim()) {
      throw new VentasDomainError('INVALID_CUSTOMER', 'INV-12/RC: NC requiere cliente.')
    }
    if (input.monto > input.saldoAcreditable) {
      throw new VentasDomainError(
        'CREDIT_EXCEEDED',
        'INV-07: monto NC supera saldo acreditable.',
        { monto: input.monto, saldo: input.saldoAcreditable },
      )
    }
  }

  /** INV-08, INV-15 implícito vía máquina de estados */
  static assertNoPostventaSiAnulada(estado: string): void {
    if (estado === 'anulada') {
      throw new VentasDomainError(
        'FORBIDDEN_TRANSITION',
        'INV-08: factura anulada no admite postventa.',
      )
    }
  }
}
