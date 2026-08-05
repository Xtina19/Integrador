import type { ClienteConsultaPort } from '../../application/ports/outbound'
import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'

/**
 * ACL de identidad de clientes para Ventas.
 * No es un segundo maestro: solo id/nombre/activo para validar emisión y NC.
 * La fuente de verdad editable es Administración (ClientesCatalogContext).
 */
export class InMemoryClienteConsultaAdapter implements ClienteConsultaPort {
  constructor(private readonly store: InMemoryVentasStore) {}

  async getActivo(clienteId: string) {
    const c = this.store.clientes.get(clienteId)
    if (!c) return null
    return { id: c.id, nombre: c.nombre, activo: c.activo }
  }

  async buscar(texto: string) {
    const q = texto.toLowerCase()
    return [...this.store.clientes.values()]
      .filter((c) => c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .map((c) => ({ id: c.id, nombre: c.nombre, activo: c.activo }))
  }

  ensureIdentity(cliente: { id: string; nombre: string; activo: boolean }): void {
    this.store.clientes.set(cliente.id, {
      id: cliente.id,
      nombre: cliente.nombre,
      activo: cliente.activo,
    })
  }
}
