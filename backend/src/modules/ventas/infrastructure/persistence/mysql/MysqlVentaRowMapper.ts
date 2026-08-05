import type {
  CambioRecord,
  DevolucionRecord,
  HistorialVentaRecord,
  NotaCreditoRecord,
  PagoRecord,
  VentaLineaRecord,
  VentaRecord,
} from '../models/VentaPersistenceModels'

/** Filas crudas MySQL (snake_case) — sin dominio. */
export interface VentaCabeceraRow {
  id: number
  dominio_id: string
  numero_factura: string
  estado: string
  tipo_venta: string
  cliente_dominio_id: string | null
  sucursal_dominio_id: string
  almacen_dominio_id: string
  usuario_emision_dominio_id: string
  moneda_codigo: string
  fecha_emision: Date | string
  subtotal: number | string
  total_descuentos: number | string
  total: number | string
  version: number
  tiene_cambios: number | boolean
  tiene_devoluciones: number | boolean
  tiene_notas_credito: number | boolean
  motivo_anulacion: string | null
}

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0)
}

function bool(v: number | boolean | null | undefined): boolean {
  return v === true || v === 1
}

export function mysqlDateToIso(v: Date | string): string {
  if (v instanceof Date) return v.toISOString()
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString()
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

function descuentoToCols(d: VentaLineaRecord['descuento']): {
  descuento_tipo: string | null
  descuento_valor: number | null
} {
  if (!d) return { descuento_tipo: null, descuento_valor: null }
  if (d.tipo === 'porcentaje') return { descuento_tipo: 'porcentaje', descuento_valor: d.valor }
  return { descuento_tipo: 'monto', descuento_valor: d.monto }
}

/**
 * Mapper filas MySQL ↔ VentaRecord (capa de persistencia).
 * No toca el Aggregate Root; VentaFactory rehidrata desde VentaRecord.
 */
export const MysqlVentaRowMapper = {
  cabeceraToPartial(row: VentaCabeceraRow): Omit<
    VentaRecord,
    'lineas' | 'pagos' | 'cambios' | 'devoluciones' | 'notasCredito' | 'historial'
  > {
    return {
      id: row.dominio_id,
      numeroFactura: row.numero_factura,
      estado: row.estado,
      tipoVenta: row.tipo_venta,
      clienteId: row.cliente_dominio_id ?? undefined,
      sucursalId: row.sucursal_dominio_id,
      almacenId: row.almacen_dominio_id,
      usuarioEmisionId: row.usuario_emision_dominio_id,
      moneda: row.moneda_codigo,
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

  lineaFromRow(row: {
    dominio_id: string
    producto_dominio_id: string | null
    descripcion_snapshot: string
    cantidad: number
    precio_unitario: number | string
    descuento_tipo: string | null
    descuento_valor: number | string | null
    importe_neto: number | string
    moneda_codigo?: string
  }, monedaFallback: string): VentaLineaRecord {
    return {
      id: row.dominio_id,
      productoId: row.producto_dominio_id ?? '',
      descripcionSnapshot: row.descripcion_snapshot,
      cantidad: Number(row.cantidad),
      precioUnitario: num(row.precio_unitario),
      moneda: row.moneda_codigo ?? monedaFallback,
      descuento: descuentoFromRow(row.descuento_tipo, row.descuento_valor, monedaFallback),
      importeNeto: num(row.importe_neto),
    }
  },

  pagoFromRow(row: {
    dominio_id: string
    forma_pago: string
    monto: number | string
    moneda_codigo: string
    nota_credito_id?: string | null
    vuelto: number | string | null
  }): PagoRecord {
    return {
      id: row.dominio_id,
      formaPago: row.forma_pago,
      monto: num(row.monto),
      moneda: row.moneda_codigo,
      notaCreditoId: row.nota_credito_id ?? undefined,
      vuelto: row.vuelto == null ? undefined : num(row.vuelto),
    }
  },

  historialFromRow(row: {
    dominio_id: string
    tipo_evento: string
    usuario_dominio_id: string
    fecha: Date | string
    resultado: string
    detalle: string | null
  }): HistorialVentaRecord {
    return {
      id: row.dominio_id,
      tipoEvento: row.tipo_evento,
      usuarioId: row.usuario_dominio_id,
      fecha: mysqlDateToIso(row.fecha),
      resultado: row.resultado,
      detalle: row.detalle ?? undefined,
    }
  },

  assemble(input: {
    cabecera: VentaCabeceraRow
    lineas: VentaLineaRecord[]
    pagos: PagoRecord[]
    cambios: CambioRecord[]
    devoluciones: DevolucionRecord[]
    notasCredito: NotaCreditoRecord[]
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

  descuentoToCols,
}
