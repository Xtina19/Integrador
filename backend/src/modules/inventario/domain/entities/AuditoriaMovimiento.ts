export type TipoAccionAuditoria =
  | 'movimiento'
  | 'aplicacion'
  | 'aprobacion'
  | 'rechazo'
  | 'cancelacion'
  | 'reversion'
  | 'error'

export type ResultadoAuditoria = 'OK' | 'RECHAZADO' | 'ERROR'

/** Registro append-only de control del efecto. */
export class AuditoriaMovimiento {
  private constructor(
    readonly id: string,
    readonly tipoAccion: TipoAccionAuditoria,
    readonly usuarioId: string,
    readonly fecha: Date,
    readonly resultado: ResultadoAuditoria,
    readonly movimientoId?: string,
    readonly documentoTipo?: string,
    readonly documentoId?: string,
    readonly productoId?: string,
    readonly almacenId?: string,
    readonly valorAntes?: Readonly<Record<string, unknown>>,
    readonly valorDespues?: Readonly<Record<string, unknown>>,
    readonly detalle?: string,
    readonly idempotencyKey?: string,
  ) {}

  static deMovimiento(props: {
    id: string
    usuarioId: string
    fecha: Date
    movimientoId: string
    documentoTipo: string
    documentoId: string
    productoId: string
    almacenId: string
    valorAntes: Readonly<Record<string, unknown>>
    valorDespues: Readonly<Record<string, unknown>>
    idempotencyKey: string
    detalle?: string
  }): AuditoriaMovimiento {
    return new AuditoriaMovimiento(
      props.id,
      'movimiento',
      props.usuarioId,
      props.fecha,
      'OK',
      props.movimientoId,
      props.documentoTipo,
      props.documentoId,
      props.productoId,
      props.almacenId,
      props.valorAntes,
      props.valorDespues,
      props.detalle,
      props.idempotencyKey,
    )
  }
}
