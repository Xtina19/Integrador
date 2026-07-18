import { InventoryDomainError } from '../errors/InventoryDomainError'

export type EstadoDescarte =
  | 'borrador'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'
  | 'aplicado'
  | 'cancelado'
  | 'revertido'

export interface LineaDescarteProps {
  id: string
  productoId: string
  cantidad: number
  motivoCodigo: string
  observacion?: string
}

export interface DescarteProps {
  id: string
  codigo: string
  almacenId: string
  estado: EstadoDescarte
  solicitanteId: string
  aprobadorId?: string
  version: number
  lineas: LineaDescarteProps[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
}

export class Descarte {
  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly almacenId: string,
    private _estado: EstadoDescarte,
    readonly solicitanteId: string,
    private _aprobadorId: string | undefined,
    private _version: number,
    private _lineas: LineaDescarteProps[],
    readonly observacion: string | undefined,
    readonly documentoOrigenTipo: string | undefined,
    readonly documentoOrigenId: string | undefined,
  ) {}

  static crear(props: {
    id: string
    codigo: string
    almacenId: string
    solicitanteId: string
    lineas: LineaDescarteProps[]
    observacion?: string
    documentoOrigenTipo?: string
    documentoOrigenId?: string
    solicitar?: boolean
  }): Descarte {
    if (props.lineas.length === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'El descarte requiere al menos una línea.',
      )
    }
    for (const linea of props.lineas) {
      if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
        throw new InventoryDomainError(
          'INVALID_QUANTITY',
          'Cada línea de descarte requiere cantidad > 0.',
        )
      }
      if (!linea.motivoCodigo?.trim()) {
        throw new InventoryDomainError(
          'INVALID_MOVEMENT_TYPE',
          'Cada línea de descarte requiere motivo tipificado.',
        )
      }
    }
    return new Descarte(
      props.id,
      props.codigo,
      props.almacenId,
      props.solicitar === false ? 'borrador' : 'solicitado',
      props.solicitanteId,
      undefined,
      1,
      props.lineas.map((l) => ({ ...l })),
      props.observacion,
      props.documentoOrigenTipo,
      props.documentoOrigenId,
    )
  }

  static rehidratar(props: DescarteProps): Descarte {
    return new Descarte(
      props.id,
      props.codigo,
      props.almacenId,
      props.estado,
      props.solicitanteId,
      props.aprobadorId,
      props.version,
      props.lineas.map((l) => ({ ...l })),
      props.observacion,
      props.documentoOrigenTipo,
      props.documentoOrigenId,
    )
  }

  get estado(): EstadoDescarte {
    return this._estado
  }

  get version(): number {
    return this._version
  }

  get aprobadorId(): string | undefined {
    return this._aprobadorId
  }

  get lineas(): readonly LineaDescarteProps[] {
    return this._lineas
  }

  assertVersion(expected: number): void {
    if (this._version !== expected) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'Conflicto de concurrencia en el descarte.',
        { expected, actual: this._version },
      )
    }
  }

  solicitar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede solicitar un descarte en borrador.',
        { estado: this._estado },
      )
    }
    this._estado = 'solicitado'
    this._version += 1
  }

  rechazar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'solicitado') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede rechazar un descarte solicitado.',
        { estado: this._estado },
      )
    }
    this._estado = 'rechazado'
    this._version += 1
  }

  cancelar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador' && this._estado !== 'solicitado') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede cancelar un descarte en borrador o solicitado.',
        { estado: this._estado },
      )
    }
    this._estado = 'cancelado'
    this._version += 1
  }

  marcarRevertido(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'aplicado') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede revertir un descarte aplicado.',
        { estado: this._estado },
      )
    }
    this._estado = 'revertido'
    this._version += 1
  }

  aprobar(aprobadorId: string, expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'solicitado') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede aprobar un descarte solicitado.',
        { estado: this._estado },
      )
    }
    if (aprobadorId === this.solicitanteId) {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'El aprobador debe ser distinto del solicitante.',
      )
    }
    this._aprobadorId = aprobadorId
    this._estado = 'aprobado'
    this._version += 1
  }

  marcarAplicado(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'aprobado') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede aplicar un descarte aprobado.',
        { estado: this._estado },
      )
    }
    this._estado = 'aplicado'
    this._version += 1
  }

  toProps(): DescarteProps {
    return {
      id: this.id,
      codigo: this.codigo,
      almacenId: this.almacenId,
      estado: this._estado,
      solicitanteId: this.solicitanteId,
      aprobadorId: this._aprobadorId,
      version: this._version,
      lineas: this._lineas.map((l) => ({ ...l })),
      observacion: this.observacion,
      documentoOrigenTipo: this.documentoOrigenTipo,
      documentoOrigenId: this.documentoOrigenId,
    }
  }
}
