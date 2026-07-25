import type { MonedaCodigo, ResolucionDiferenciaCambio } from '../../domain/enums'
import type { CambioProps } from '../../domain/entities/Cambio'
import type { CambioRecord } from '../persistence/models/VentaPersistenceModels'

export const CambioMapper = {
  toRecord(props: CambioProps): CambioRecord {
    return {
      id: props.id,
      fecha: props.fecha,
      usuarioId: props.usuarioId,
      lineasDevueltas: props.lineasDevueltas.map((l) => ({ ...l })),
      lineasNuevas: props.lineasNuevas.map((l) => ({ ...l })),
      valorDevuelto: props.valorDevuelto,
      valorNuevo: props.valorNuevo,
      diferenciaMonto: props.diferenciaMonto,
      moneda: props.moneda,
      resolucion: props.resolucion,
    }
  },

  toDomainProps(record: CambioRecord): CambioProps {
    return {
      id: record.id,
      fecha: record.fecha,
      usuarioId: record.usuarioId,
      lineasDevueltas: record.lineasDevueltas.map((l) => ({ ...l })),
      lineasNuevas: record.lineasNuevas.map((l) => ({ ...l })),
      valorDevuelto: record.valorDevuelto ?? 0,
      valorNuevo: record.valorNuevo ?? 0,
      diferenciaMonto: record.diferenciaMonto,
      moneda: record.moneda as MonedaCodigo,
      resolucion: record.resolucion as ResolucionDiferenciaCambio,
    }
  },
}
