import type { FormaPago, MonedaCodigo } from '../../domain/enums'
import type { PagoProps } from '../../domain/entities/Pago'
import type { PagoRecord } from '../persistence/models/VentaPersistenceModels'

export const PagoMapper = {
  toRecord(props: PagoProps): PagoRecord {
    return {
      id: props.id,
      formaPago: props.formaPago,
      monto: props.monto,
      moneda: props.moneda,
      notaCreditoId: props.notaCreditoId,
      vuelto: props.vuelto,
    }
  },

  toDomainProps(record: PagoRecord): PagoProps {
    return {
      id: record.id,
      formaPago: record.formaPago as FormaPago,
      monto: record.monto,
      moneda: record.moneda as MonedaCodigo,
      notaCreditoId: record.notaCreditoId,
      vuelto: record.vuelto,
    }
  },
}
