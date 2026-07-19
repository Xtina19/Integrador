import type { ProductoConsultaPort } from '../../application/ports/outbound'
import type { MonedaCodigo } from '../../domain/enums'
import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'

export class InMemoryProductoConsultaAdapter implements ProductoConsultaPort {
  constructor(private readonly store: InMemoryVentasStore) {}

  async getVendible(productoId: string) {
    const p = this.store.productos.get(productoId)
    if (!p) return null
    return {
      id: p.id,
      titulo: p.titulo,
      precio: p.precio,
      moneda: p.moneda as MonedaCodigo,
      activo: p.activo,
    }
  }
}
