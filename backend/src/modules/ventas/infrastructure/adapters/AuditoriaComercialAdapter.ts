import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'

/**
 * Auditoría comercial ligera en infraestructura (complementa HistorialVenta del AR).
 * No es el ledger de Inventario.
 */
export class InMemoryAuditoriaComercialAdapter {
  constructor(private readonly store: InMemoryVentasStore) {}

  registrar(tipo: string, payload: unknown): void {
    this.store.auditoriaComercial.push({
      id: this.store.nextId('aud'),
      at: new Date().toISOString(),
      tipo,
      payload: structuredClone(payload),
    })
  }

  listar(): ReadonlyArray<{ id: string; at: string; tipo: string; payload: unknown }> {
    return this.store.auditoriaComercial
  }
}
