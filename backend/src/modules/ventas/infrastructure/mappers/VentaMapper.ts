import type { EstadoVenta, MonedaCodigo, TipoVenta } from '../../domain/enums'
import type { VentaProps } from '../../domain/aggregates/Venta'
import type { VentaRecord } from '../persistence/models/VentaPersistenceModels'
import { VentaLineaMapper } from './VentaLineaMapper'
import { PagoMapper } from './PagoMapper'
import { CambioMapper } from './CambioMapper'
import { DevolucionMapper } from './DevolucionMapper'
import { NotaCreditoMapper } from './NotaCreditoMapper'
import { HistorialVentaMapper } from './HistorialVentaMapper'

/**
 * Convierte Aggregate props ↔ registro de persistencia.
 * No modifica el Aggregate Root; solo traduce formas.
 */
export const VentaMapper = {
  toRecord(props: VentaProps): VentaRecord {
    return {
      id: props.id,
      numeroFactura: props.numeroFactura,
      estado: props.estado,
      tipoVenta: props.tipoVenta,
      clienteId: props.clienteId,
      sucursalId: props.sucursalId,
      almacenId: props.almacenId,
      usuarioEmisionId: props.usuarioEmisionId,
      moneda: props.moneda,
      fechaEmision: props.fechaEmision,
      subtotal: props.subtotal,
      totalDescuentos: props.totalDescuentos,
      total: props.total,
      version: props.version,
      tieneCambios: props.tieneCambios,
      tieneDevoluciones: props.tieneDevoluciones,
      tieneNotasCredito: props.tieneNotasCredito,
      motivoAnulacion: props.motivoAnulacion,
      lineas: props.lineas.map(VentaLineaMapper.toRecord),
      pagos: props.pagos.map(PagoMapper.toRecord),
      cambios: props.cambios.map(CambioMapper.toRecord),
      devoluciones: props.devoluciones.map(DevolucionMapper.toRecord),
      notasCredito: props.notasCredito.map(NotaCreditoMapper.toRecord),
      historial: props.historial.map(HistorialVentaMapper.toRecord),
    }
  },

  toDomainProps(record: VentaRecord): VentaProps {
    return {
      id: record.id,
      numeroFactura: record.numeroFactura,
      estado: record.estado as EstadoVenta,
      tipoVenta: record.tipoVenta as TipoVenta,
      clienteId: record.clienteId,
      sucursalId: record.sucursalId,
      almacenId: record.almacenId,
      usuarioEmisionId: record.usuarioEmisionId,
      moneda: record.moneda as MonedaCodigo,
      fechaEmision: record.fechaEmision,
      subtotal: record.subtotal,
      totalDescuentos: record.totalDescuentos,
      total: record.total,
      version: record.version,
      tieneCambios: record.tieneCambios,
      tieneDevoluciones: record.tieneDevoluciones,
      tieneNotasCredito: record.tieneNotasCredito,
      motivoAnulacion: record.motivoAnulacion,
      lineas: record.lineas.map(VentaLineaMapper.toDomainProps),
      pagos: record.pagos.map(PagoMapper.toDomainProps),
      cambios: record.cambios.map(CambioMapper.toDomainProps),
      devoluciones: record.devoluciones.map(DevolucionMapper.toDomainProps),
      notasCredito: record.notasCredito.map(NotaCreditoMapper.toDomainProps),
      historial: record.historial.map(HistorialVentaMapper.toDomainProps),
    }
  },
}
