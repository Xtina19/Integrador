import { Venta } from '../../domain/aggregates/Venta'
import type { VentaRecord } from '../persistence/models/VentaPersistenceModels'
import { VentaMapper } from '../mappers/VentaMapper'

/**
 * Factory de infraestructura: reconstruye el Aggregate desde persistencia
 * sin alterar su API de dominio (`Venta.rehidratar`).
 */
export class VentaFactory {
  static fromRecord(record: VentaRecord): Venta {
    return Venta.rehidratar(VentaMapper.toDomainProps(record))
  }

  static toRecord(venta: Venta): VentaRecord {
    return VentaMapper.toRecord(venta.toProps())
  }
}
