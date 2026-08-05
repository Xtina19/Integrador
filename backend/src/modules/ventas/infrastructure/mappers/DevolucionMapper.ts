import type { AptitudReingreso, CompensacionDevolucion, MonedaCodigo } from '../../domain/enums'
import type { DevolucionProps } from '../../domain/entities/Devolucion'
import type { DevolucionRecord } from '../persistence/models/VentaPersistenceModels'

export const DevolucionMapper = {
  toRecord(props: DevolucionProps): DevolucionRecord {
    return {
      id: props.id,
      fecha: props.fecha,
      usuarioId: props.usuarioId,
      lineas: props.lineas.map((l) => ({ ...l })),
      aptitudReingreso: props.aptitudReingreso,
      compensacion: props.compensacion,
      montoCompensacion: props.montoCompensacion,
      moneda: props.moneda,
    }
  },

  toDomainProps(record: DevolucionRecord): DevolucionProps {
    return {
      id: record.id,
      fecha: record.fecha,
      usuarioId: record.usuarioId,
      lineas: record.lineas.map((l) => ({ ...l })),
      aptitudReingreso: record.aptitudReingreso as AptitudReingreso,
      compensacion: record.compensacion as CompensacionDevolucion,
      montoCompensacion: record.montoCompensacion,
      moneda: record.moneda as MonedaCodigo,
    }
  },
}
