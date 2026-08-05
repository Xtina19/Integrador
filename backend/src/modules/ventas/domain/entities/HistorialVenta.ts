import type { ResultadoHistorial, TipoEventoHistorialVenta } from '../enums'

export interface HistorialVentaProps {
  id: string
  tipoEvento: TipoEventoHistorialVenta
  usuarioId: string
  fecha: string
  resultado: ResultadoHistorial
  detalle?: string
}

/** Evento de historial comercial dentro del agregado Venta. */
export class HistorialVenta {
  private constructor(
    readonly id: string,
    readonly tipoEvento: TipoEventoHistorialVenta,
    readonly usuarioId: string,
    readonly fecha: Date,
    readonly resultado: ResultadoHistorial,
    readonly detalle: string | undefined,
  ) {}

  static crear(input: {
    id: string
    tipoEvento: TipoEventoHistorialVenta
    usuarioId: string
    resultado?: ResultadoHistorial
    detalle?: string
    fecha?: Date
  }): HistorialVenta {
    return new HistorialVenta(
      input.id,
      input.tipoEvento,
      input.usuarioId,
      input.fecha ?? new Date(),
      input.resultado ?? 'OK',
      input.detalle,
    )
  }

  static rehidratar(props: HistorialVentaProps): HistorialVenta {
    return new HistorialVenta(
      props.id,
      props.tipoEvento,
      props.usuarioId,
      new Date(props.fecha),
      props.resultado,
      props.detalle,
    )
  }

  toProps(): HistorialVentaProps {
    return {
      id: this.id,
      tipoEvento: this.tipoEvento,
      usuarioId: this.usuarioId,
      fecha: this.fecha.toISOString(),
      resultado: this.resultado,
      detalle: this.detalle,
    }
  }
}
