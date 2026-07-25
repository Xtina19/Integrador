import type { VentaProps } from '../../domain/aggregates/Venta'
import type { HistorialVentaProps } from '../../domain/entities/HistorialVenta'

export type VentaDto = VentaProps

export interface VentaResumenDto {
  id: string
  numeroFactura: string
  estado: string
  tipoVenta: string
  clienteId?: string
  sucursalId: string
  total: number
  moneda: string
  fechaEmision: string
  tieneCambios: boolean
  tieneDevoluciones: boolean
  tieneNotasCredito: boolean
}

export type HistorialVentaDto = HistorialVentaProps

export function toVentaResumen(props: VentaProps): VentaResumenDto {
  return {
    id: props.id,
    numeroFactura: props.numeroFactura,
    estado: props.estado,
    tipoVenta: props.tipoVenta,
    clienteId: props.clienteId,
    sucursalId: props.sucursalId,
    total: props.total,
    moneda: props.moneda,
    fechaEmision: props.fechaEmision,
    tieneCambios: props.tieneCambios,
    tieneDevoluciones: props.tieneDevoluciones,
    tieneNotasCredito: props.tieneNotasCredito,
  }
}
