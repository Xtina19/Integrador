import { Cantidad } from '../value-objects/Cantidad'
import { DocumentoOrigenRef } from '../value-objects/DocumentoOrigenRef'
import { IdempotencyKey } from '../value-objects/IdempotencyKey'
import { Saldo } from '../value-objects/Saldo'
import { TipoMovimiento } from '../value-objects/TipoMovimiento'

export interface MovimientoInventarioProps {
  id: string
  tipoMovimiento: TipoMovimiento
  productoId: string
  almacenId: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documento: DocumentoOrigenRef
  usuarioId: string
  fechaMovimiento: Date
  motivoCodigo?: string
  observacion?: string
  idempotencyKey: string
  movimientoCompensaId?: string
}

/** Hecho atómico e inmutable de cambio de stock. */
export class MovimientoInventario {
  readonly id: string
  readonly tipoMovimiento: TipoMovimiento
  readonly productoId: string
  readonly almacenId: string
  readonly cantidad: Cantidad
  readonly saldoAnterior: Saldo
  readonly saldoPosterior: Saldo
  readonly documento: DocumentoOrigenRef
  readonly usuarioId: string
  readonly fechaMovimiento: Date
  readonly motivoCodigo?: string
  readonly observacion?: string
  readonly idempotencyKey: IdempotencyKey
  readonly movimientoCompensaId?: string

  private constructor(props: {
    id: string
    tipoMovimiento: TipoMovimiento
    productoId: string
    almacenId: string
    cantidad: Cantidad
    saldoAnterior: Saldo
    saldoPosterior: Saldo
    documento: DocumentoOrigenRef
    usuarioId: string
    fechaMovimiento: Date
    motivoCodigo?: string
    observacion?: string
    idempotencyKey: IdempotencyKey
    movimientoCompensaId?: string
  }) {
    this.id = props.id
    this.tipoMovimiento = props.tipoMovimiento
    this.productoId = props.productoId
    this.almacenId = props.almacenId
    this.cantidad = props.cantidad
    this.saldoAnterior = props.saldoAnterior
    this.saldoPosterior = props.saldoPosterior
    this.documento = props.documento
    this.usuarioId = props.usuarioId
    this.fechaMovimiento = props.fechaMovimiento
    this.motivoCodigo = props.motivoCodigo
    this.observacion = props.observacion
    this.idempotencyKey = props.idempotencyKey
    this.movimientoCompensaId = props.movimientoCompensaId
  }

  static registrar(props: {
    id: string
    tipoMovimiento: TipoMovimiento
    productoId: string
    almacenId: string
    cantidad: Cantidad
    saldoAnterior: Saldo
    saldoPosterior: Saldo
    documento: DocumentoOrigenRef
    usuarioId: string
    fechaMovimiento: Date
    idempotencyKey: IdempotencyKey
    motivoCodigo?: string
    observacion?: string
    movimientoCompensaId?: string
  }): MovimientoInventario {
    return new MovimientoInventario(props)
  }

  toProps(): MovimientoInventarioProps {
    return {
      id: this.id,
      tipoMovimiento: this.tipoMovimiento,
      productoId: this.productoId,
      almacenId: this.almacenId,
      cantidad: this.cantidad.value,
      saldoAnterior: this.saldoAnterior.value,
      saldoPosterior: this.saldoPosterior.value,
      documento: this.documento,
      usuarioId: this.usuarioId,
      fechaMovimiento: this.fechaMovimiento,
      motivoCodigo: this.motivoCodigo,
      observacion: this.observacion,
      idempotencyKey: this.idempotencyKey.value,
      movimientoCompensaId: this.movimientoCompensaId,
    }
  }
}
