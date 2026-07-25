import type { UsuarioPermisosPort } from '../../application/ports/outbound'
import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'

export class InMemoryUsuarioPermisosAdapter implements UsuarioPermisosPort {
  constructor(private readonly store: InMemoryVentasStore) {}

  async getContexto(usuarioId: string) {
    const u = this.store.usuarios.get(usuarioId)
    if (!u) return null
    return {
      rol: u.rol,
      topePorcentajeDescuento: u.topePorcentajeDescuento,
    }
  }
}
