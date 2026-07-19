import type { Venta } from '../aggregates/Venta'

/**
 * Contrato de repositorio del BC Ventas (VEN-DOM-2.0.0 §8).
 * Sin implementación en esta fase — vive en dominio para desacoplar de infraestructura.
 */
export interface VentaRepository {
  getById(id: string): Promise<Venta | null>
  getByNumeroFactura(numero: string): Promise<Venta | null>
  save(venta: Venta): Promise<void>
  list(criterios: ListVentasCriterios): Promise<Venta[]>
  nextIdentity(): Promise<string>
  nextNumeroFactura(sucursalId: string): Promise<string>
  /** Código secuencial global NC-000001… */
  nextNumeroNotaCredito(): Promise<string>
}

export interface ListVentasCriterios {
  sucursalId?: string
  estado?: 'emitida' | 'anulada'
  clienteId?: string
  desde?: string
  hasta?: string
  numeroFactura?: string
  limit?: number
  offset?: number
}
