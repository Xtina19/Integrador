import type { ResultadoHistorial, TipoEventoHistorialVenta } from '../../domain/enums'
import type { HistorialVentaProps } from '../../domain/entities/HistorialVenta'
import type { HistorialVentaRecord } from '../persistence/models/VentaPersistenceModels'

export const HistorialVentaMapper = {
  toRecord(props: HistorialVentaProps): HistorialVentaRecord {
    return {
      id: props.id,
      tipoEvento: props.tipoEvento,
      usuarioId: props.usuarioId,
      fecha: props.fecha,
      resultado: props.resultado,
      detalle: props.detalle,
    }
  },

  toDomainProps(record: HistorialVentaRecord): HistorialVentaProps {
    return {
      id: record.id,
      tipoEvento: record.tipoEvento as TipoEventoHistorialVenta,
      usuarioId: record.usuarioId,
      fecha: record.fecha,
      resultado: record.resultado as ResultadoHistorial,
      detalle: record.detalle,
    }
  },
}
