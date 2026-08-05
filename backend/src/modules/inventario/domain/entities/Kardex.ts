import { MovimientoInventario } from './MovimientoInventario'

/** Registro histórico 1:1 con el movimiento (inmutable). */
export class Kardex {
  private constructor(
    readonly id: string,
    readonly movimientoId: string,
    readonly productoId: string,
    readonly almacenId: string,
    readonly tipoMovimiento: string,
    readonly cantidad: number,
    readonly saldoAnterior: number,
    readonly saldoPosterior: number,
    readonly documentoTipo: string,
    readonly documentoId: string,
    readonly usuarioId: string,
    readonly fechaMovimiento: Date,
    readonly motivoCodigo?: string,
    readonly observacion?: string,
  ) {}

  static desdeMovimiento(
    id: string,
    movimiento: MovimientoInventario,
  ): Kardex {
    return new Kardex(
      id,
      movimiento.id,
      movimiento.productoId,
      movimiento.almacenId,
      movimiento.tipoMovimiento,
      movimiento.cantidad.value,
      movimiento.saldoAnterior.value,
      movimiento.saldoPosterior.value,
      movimiento.documento.tipo,
      movimiento.documento.id,
      movimiento.usuarioId,
      movimiento.fechaMovimiento,
      movimiento.motivoCodigo,
      movimiento.observacion,
    )
  }
}
