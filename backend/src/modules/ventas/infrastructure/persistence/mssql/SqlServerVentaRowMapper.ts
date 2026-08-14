import type {
  HistorialVentaRecord,
  PagoRecord,
  VentaLineaRecord,
  VentaRecord,
} from '../models/VentaPersistenceModels'
import { mysqlDateToIso } from '../mysql/MysqlVentaRowMapper'

/** Cabecera FacturaVenta + codigo_iso (Moneda). */
export interface FacturaVentaCabeceraRow {
  id_factura: number
  codigo_dominio: string
  numero_factura: string
  estado: string
  tipo_venta: string
  id_persona: number | null
  id_sucursal: number
  id_almacen: number
  id_usuario_emision: number
  codigo_iso: string
  fecha_emision: Date | string
  subtotal: number | string
  total_descuentos: number | string
  total: number | string
  version: number
  tiene_cambios: boolean | number
  tiene_devoluciones: boolean | number
  tiene_notas_credito: boolean | number
  motivo_anulacion: string | null
}

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0)
}

function bool(v: number | boolean | null | undefined): boolean {
  return v === true || v === 1
}

function descuentoFromRow(
  tipo: string | null,
  valor: number | string | null,
  moneda: string,
): VentaLineaRecord['descuento'] {
  if (!tipo || valor == null) return undefined
  if (tipo === 'porcentaje') return { tipo: 'porcentaje', valor: num(valor) }
  return { tipo: 'monto', monto: num(valor), moneda }
}

export function descuentoToCols(d: VentaLineaRecord['descuento']): {
  descuento_tipo: string | null
  descuento_valor: number | null
} {
  if (!d) return { descuento_tipo: null, descuento_valor: null }
  if (d.tipo === 'porcentaje') return { descuento_tipo: 'porcentaje', descuento_valor: d.valor }
  return { descuento_tipo: 'monto', descuento_valor: d.monto }
}

export const SqlServerVentaRowMapper = {
  cabeceraToPartial(row: FacturaVentaCabeceraRow): Omit<
    VentaRecord,
    'lineas' | 'pagos' | 'cambios' | 'devoluciones' | 'notasCredito' | 'historial'
  > {
    return {
      id: row.codigo_dominio,
      numeroFactura: row.numero_factura,
      estado: row.estado,
      tipoVenta: row.tipo_venta,
      clienteId: row.id_persona != null ? String(row.id_persona) : undefined,
      sucursalId: String(row.id_sucursal),
      almacenId: String(row.id_almacen),
      usuarioEmisionId: String(row.id_usuario_emision),
      moneda: row.codigo_iso,
      fechaEmision: mysqlDateToIso(row.fecha_emision),
      subtotal: num(row.subtotal),
      totalDescuentos: num(row.total_descuentos),
      total: num(row.total),
      version: Number(row.version),
      tieneCambios: bool(row.tiene_cambios),
      tieneDevoluciones: bool(row.tiene_devoluciones),
      tieneNotasCredito: bool(row.tiene_notas_credito),
      motivoAnulacion: row.motivo_anulacion ?? undefined,
    }
  },

  lineaFromRow(
    row: {
      codigo_dominio: string
      id_producto: number
      descripcion_snapshot: string
      cantidad: number
      precio_unitario: number | string
      descuento_tipo: string | null
      descuento_valor: number | string | null
      importe_neto: number | string
    },
    moneda: string,
  ): VentaLineaRecord {
    return {
      id: row.codigo_dominio,
      productoId: String(row.id_producto),
      descripcionSnapshot: row.descripcion_snapshot,
      cantidad: Number(row.cantidad),
      precioUnitario: num(row.precio_unitario),
      moneda,
      descuento: descuentoFromRow(row.descuento_tipo, row.descuento_valor, moneda),
      importeNeto: num(row.importe_neto),
    }
  },

  pagoFromRow(row: {
    codigo_dominio: string
    forma_pago: string
    monto: number | string
    codigo_iso: string
    nc_codigo: string | null
    vuelto: number | string | null
  }): PagoRecord {
    return {
      id: row.codigo_dominio,
      formaPago: row.forma_pago,
      monto: num(row.monto),
      moneda: row.codigo_iso,
      notaCreditoId: row.nc_codigo ?? undefined,
      vuelto: row.vuelto == null ? undefined : num(row.vuelto),
    }
  },

  historialFromRow(row: {
    codigo_dominio: string
    tipo_evento: string
    id_usuario: number
    fecha: Date | string
    resultado: string
    detalle: string | null
  }): HistorialVentaRecord {
    return {
      id: row.codigo_dominio,
      tipoEvento: row.tipo_evento,
      usuarioId: String(row.id_usuario),
      fecha: mysqlDateToIso(row.fecha),
      resultado: row.resultado,
      detalle: row.detalle ?? undefined,
    }
  },

  assemble(input: {
    cabecera: FacturaVentaCabeceraRow
    lineas: VentaLineaRecord[]
    pagos: PagoRecord[]
    cambios: VentaRecord['cambios']
    devoluciones: VentaRecord['devoluciones']
    notasCredito: VentaRecord['notasCredito']
    historial: HistorialVentaRecord[]
  }): VentaRecord {
    return {
      ...this.cabeceraToPartial(input.cabecera),
      lineas: input.lineas,
      pagos: input.pagos,
      cambios: input.cambios,
      devoluciones: input.devoluciones,
      notasCredito: input.notasCredito,
      historial: input.historial,
    }
  },
}

export function toSqlDatetime(isoOrDate: string): Date {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return new Date(isoOrDate.replace(' ', 'T'))
  return d
}
