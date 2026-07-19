import type { Descuento } from '../../domain/value-objects/Descuento'
import { Dinero } from '../../domain/value-objects/Dinero'
import type { MonedaCodigo } from '../../domain/enums'
import type { VentaLineaProps } from '../../domain/entities/VentaLinea'
import type { DescuentoRecord, VentaLineaRecord } from '../persistence/models/VentaPersistenceModels'

function descuentoToRecord(d: Descuento | undefined): DescuentoRecord | undefined {
  if (!d) return undefined
  if (d.tipo === 'monto') {
    return { tipo: 'monto', monto: d.valor.monto, moneda: d.valor.moneda }
  }
  return { tipo: 'porcentaje', valor: d.valor }
}

function descuentoFromRecord(d: DescuentoRecord | undefined): Descuento | undefined {
  if (!d) return undefined
  if (d.tipo === 'monto') {
    return {
      tipo: 'monto',
      valor: Dinero.of(d.monto, d.moneda as MonedaCodigo, {
        permitirDecimales: !Number.isInteger(d.monto),
      }),
    }
  }
  return { tipo: 'porcentaje', valor: d.valor }
}

export const VentaLineaMapper = {
  toRecord(props: VentaLineaProps): VentaLineaRecord {
    return {
      id: props.id,
      productoId: props.productoId,
      descripcionSnapshot: props.descripcionSnapshot,
      cantidad: props.cantidad,
      precioUnitario: props.precioUnitario,
      moneda: props.moneda,
      descuento: descuentoToRecord(props.descuento),
      importeNeto: props.importeNeto,
    }
  },

  toDomainProps(record: VentaLineaRecord): VentaLineaProps {
    return {
      id: record.id,
      productoId: record.productoId,
      descripcionSnapshot: record.descripcionSnapshot,
      cantidad: record.cantidad,
      precioUnitario: record.precioUnitario,
      moneda: record.moneda as MonedaCodigo,
      descuento: descuentoFromRecord(record.descuento),
      importeNeto: record.importeNeto,
    }
  },
}
