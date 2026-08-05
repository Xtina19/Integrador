import { InventoryDomainError } from '../errors/InventoryDomainError'

export type EstadoTransferencia =
  | 'borrador'
  | 'solicitada'
  | 'en_transito'
  | 'recibida_parcial'
  | 'recibida'
  | 'cancelada'

export interface LineaTransferenciaProps {
  id: string
  productoId: string
  cantidadSolicitada: number
  cantidadDespachada: number
  cantidadRecibida: number
  cantidadFaltante: number
  cantidadDanada: number
}

export interface TransferenciaProps {
  id: string
  codigo: string
  almacenOrigenId: string
  almacenDestinoId: string
  estado: EstadoTransferencia
  solicitanteId: string
  version: number
  lineas: LineaTransferenciaProps[]
  observacion?: string
}

export class Transferencia {
  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly almacenOrigenId: string,
    readonly almacenDestinoId: string,
    private _estado: EstadoTransferencia,
    readonly solicitanteId: string,
    private _version: number,
    private _lineas: LineaTransferenciaProps[],
    readonly observacion?: string,
  ) {}

  static crear(props: {
    id: string
    codigo: string
    almacenOrigenId: string
    almacenDestinoId: string
    solicitanteId: string
    lineas: Array<{ id: string; productoId: string; cantidadSolicitada: number }>
    observacion?: string
    /** Default true: la transferencia nace en `solicitada`. Si false, nace en `borrador`. */
    solicitar?: boolean
  }): Transferencia {
    if (props.almacenOrigenId === props.almacenDestinoId) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'El almacén origen y destino deben ser distintos.',
      )
    }
    if (props.lineas.length === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'La transferencia requiere al menos una línea.',
      )
    }
    for (const linea of props.lineas) {
      if (!Number.isInteger(linea.cantidadSolicitada) || linea.cantidadSolicitada <= 0) {
        throw new InventoryDomainError(
          'INVALID_QUANTITY',
          'Cada línea debe solicitar una cantidad entera > 0.',
        )
      }
    }
    return new Transferencia(
      props.id,
      props.codigo,
      props.almacenOrigenId,
      props.almacenDestinoId,
      props.solicitar === false ? 'borrador' : 'solicitada',
      props.solicitanteId,
      1,
      props.lineas.map((l) => ({
        id: l.id,
        productoId: l.productoId,
        cantidadSolicitada: l.cantidadSolicitada,
        cantidadDespachada: 0,
        cantidadRecibida: 0,
        cantidadFaltante: 0,
        cantidadDanada: 0,
      })),
      props.observacion,
    )
  }

  static rehidratar(props: TransferenciaProps): Transferencia {
    return new Transferencia(
      props.id,
      props.codigo,
      props.almacenOrigenId,
      props.almacenDestinoId,
      props.estado,
      props.solicitanteId,
      props.version,
      props.lineas.map((l) => ({ ...l })),
      props.observacion,
    )
  }

  get estado(): EstadoTransferencia {
    return this._estado
  }

  get version(): number {
    return this._version
  }

  get lineas(): readonly LineaTransferenciaProps[] {
    return this._lineas
  }

  assertVersion(expected: number): void {
    if (this._version !== expected) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'Conflicto de concurrencia en la transferencia.',
        { expected, actual: this._version },
      )
    }
  }

  solicitar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede solicitar una transferencia en borrador.',
        { estado: this._estado },
      )
    }
    this._estado = 'solicitada'
    this._version += 1
  }

  cancelar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador' && this._estado !== 'solicitada') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede cancelar una transferencia en borrador o solicitada.',
        { estado: this._estado },
      )
    }
    this._estado = 'cancelada'
    this._version += 1
  }

  despachar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'solicitada') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede despachar una transferencia en estado solicitada.',
        { estado: this._estado },
      )
    }
    this._lineas = this._lineas.map((l) => ({
      ...l,
      cantidadDespachada: l.cantidadSolicitada,
    }))
    this._estado = 'en_transito'
    this._version += 1
  }

  recibir(
    expectedVersion: number,
    recepciones: Array<{ lineaId: string; cantidadRecibida: number; cantidadFaltante?: number; cantidadDanada?: number }>,
  ): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'en_transito' && this._estado !== 'recibida_parcial') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede recibir una transferencia en tránsito o parcialmente recibida.',
        { estado: this._estado },
      )
    }

    for (const rec of recepciones) {
      const linea = this._lineas.find((l) => l.id === rec.lineaId)
      if (!linea) {
        throw new InventoryDomainError(
          'INVALID_DOCUMENT_REF',
          'Línea de transferencia no encontrada.',
          { lineaId: rec.lineaId },
        )
      }
      const recibida = rec.cantidadRecibida
      const faltante = rec.cantidadFaltante ?? 0
      const danada = rec.cantidadDanada ?? 0
      if (![recibida, faltante, danada].every((n) => Number.isInteger(n) && n >= 0)) {
        throw new InventoryDomainError(
          'INVALID_QUANTITY',
          'Cantidades de recepción inválidas.',
        )
      }
      const pendiente = linea.cantidadDespachada - linea.cantidadRecibida - linea.cantidadFaltante - linea.cantidadDanada
      if (recibida + faltante + danada > pendiente) {
        throw new InventoryDomainError(
          'INVALID_QUANTITY',
          'La recepción supera lo pendiente de la línea.',
          { lineaId: linea.id, pendiente },
        )
      }
      linea.cantidadRecibida += recibida
      linea.cantidadFaltante += faltante
      linea.cantidadDanada += danada
    }

    const completa = this._lineas.every(
      (l) =>
        l.cantidadRecibida + l.cantidadFaltante + l.cantidadDanada ===
        l.cantidadDespachada,
    )
    this._estado = completa ? 'recibida' : 'recibida_parcial'
    this._version += 1
  }

  toProps(): TransferenciaProps {
    return {
      id: this.id,
      codigo: this.codigo,
      almacenOrigenId: this.almacenOrigenId,
      almacenDestinoId: this.almacenDestinoId,
      estado: this._estado,
      solicitanteId: this.solicitanteId,
      version: this._version,
      lineas: this._lineas.map((l) => ({ ...l })),
      observacion: this.observacion,
    }
  }
}
