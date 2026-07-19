import type {
  IAlmacenRepository,
  IExistenciaRepository,
} from '../../../inventario/application/ports/outbound'
import type { InventarioConsultaPort } from '../../application/ports/outbound'

/**
 * Consulta de disponibilidad contra el Inventory Engine (existencias reales).
 * No muta stock ni lee el store de Ventas.
 */
export class EngineInventarioConsultaAdapter implements InventarioConsultaPort {
  constructor(
    private readonly existencias: IExistenciaRepository,
    private readonly almacenes: IAlmacenRepository,
  ) {}

  async disponabilidad(productoId: string, almacenId: string) {
    const [existencia, almacen] = await Promise.all([
      this.existencias.get(productoId, almacenId),
      this.almacenes.getById(almacenId),
    ])
    return {
      saldo: existencia?.saldo.value ?? 0,
      almacenBloqueadoPorConteo: almacen?.bloqueadoPorConteo === true,
    }
  }
}
