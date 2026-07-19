import type { Venta } from '../../domain/aggregates/Venta'
import type { ListVentasCriterios, VentaRepository } from '../../domain/ports/VentaRepository'
import { VentaFactory } from '../factories/VentaFactory'
import type { InMemoryVentasStore } from './InMemoryVentasStore'

export class InMemoryVentaRepository implements VentaRepository {
  constructor(private readonly store: InMemoryVentasStore) {}

  async getById(id: string): Promise<Venta | null> {
    const record = this.store.ventas.get(id)
    return record ? VentaFactory.fromRecord(structuredClone(record)) : null
  }

  async getByNumeroFactura(numero: string): Promise<Venta | null> {
    const id = this.store.ventasByNumero.get(numero)
    if (!id) return null
    return this.getById(id)
  }

  async save(venta: Venta): Promise<void> {
    const record = VentaFactory.toRecord(venta)
    const prev = this.store.ventas.get(record.id)
    if (prev && prev.numeroFactura !== record.numeroFactura) {
      this.store.ventasByNumero.delete(prev.numeroFactura)
    }
    this.store.ventas.set(record.id, structuredClone(record))
    this.store.ventasByNumero.set(record.numeroFactura, record.id)
  }

  async list(criterios: ListVentasCriterios): Promise<Venta[]> {
    let rows = [...this.store.ventas.values()]
    if (criterios.sucursalId) {
      rows = rows.filter((r) => r.sucursalId === criterios.sucursalId)
    }
    if (criterios.estado) {
      rows = rows.filter((r) => r.estado === criterios.estado)
    }
    if (criterios.clienteId) {
      rows = rows.filter((r) => r.clienteId === criterios.clienteId)
    }
    if (criterios.numeroFactura) {
      rows = rows.filter((r) => r.numeroFactura.includes(criterios.numeroFactura!))
    }
    if (criterios.desde) {
      rows = rows.filter((r) => r.fechaEmision >= criterios.desde!)
    }
    if (criterios.hasta) {
      rows = rows.filter((r) => r.fechaEmision <= criterios.hasta!)
    }
    rows.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision))
    const offset = criterios.offset ?? 0
    const limit = criterios.limit ?? rows.length
    return rows.slice(offset, offset + limit).map((r) => VentaFactory.fromRecord(structuredClone(r)))
  }

  async nextIdentity(): Promise<string> {
    return this.store.nextId('venta')
  }

  async nextNumeroFactura(sucursalId: string): Promise<string> {
    return this.store.nextNumeroFactura(sucursalId)
  }

  async nextNumeroNotaCredito(): Promise<string> {
    return this.store.nextNumeroNotaCredito()
  }
}
