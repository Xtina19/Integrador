import type { EstadoNotaCredito, MonedaCodigo } from '../../domain/enums'
import type { NotaCreditoProps } from '../../domain/entities/NotaCredito'
import type { NotaCreditoRecord } from '../persistence/models/VentaPersistenceModels'

export const NotaCreditoMapper = {
  toRecord(props: NotaCreditoProps): NotaCreditoRecord {
    return {
      id: props.id,
      ventaOrigenId: props.ventaOrigenId,
      clienteId: props.clienteId,
      fecha: props.fecha,
      usuarioId: props.usuarioId,
      monto: props.monto,
      moneda: props.moneda,
      motivo: props.motivo,
      estado: props.estado,
      montoAplicado: props.montoAplicado,
      aplicaciones: props.aplicaciones.map((a) => ({ ...a })),
    }
  },

  toDomainProps(record: NotaCreditoRecord): NotaCreditoProps {
    return {
      id: record.id,
      ventaOrigenId: record.ventaOrigenId,
      clienteId: record.clienteId,
      fecha: record.fecha,
      usuarioId: record.usuarioId,
      monto: record.monto,
      moneda: record.moneda as MonedaCodigo,
      motivo: record.motivo,
      estado: record.estado as EstadoNotaCredito,
      montoAplicado: record.montoAplicado,
      aplicaciones: record.aplicaciones.map((a) => ({ ...a })),
    }
  },
}
