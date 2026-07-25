import { InventoryDomainError } from '../errors/InventoryDomainError'

export type EstadoAjuste =
  | 'borrador'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'
  | 'aplicado'
  | 'cancelado'
  | 'revertido'

export type TipoAjuste =
  | 'positivo'
  | 'negativo'
  | 'digitacion'
  | 'conteo'
  | 'error_documental'

export interface LineaAjusteProps {
  id: string
  productoId: string
  cantidadObjetivo: number
  diferencia: number
  motivoCodigo?: string
  lineaConteoId?: string
  observacion?: string
}

export interface AjusteProps {
  id: string
  codigo: string
  almacenId: string
  tipoAjuste: TipoAjuste
  estado: EstadoAjuste
  solicitanteId: string
  aprobadorId?: string
  version: number
  lineas: LineaAjusteProps[]
  observacion?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
}

export class Ajuste {
  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly almacenId: string,
    readonly tipoAjuste: TipoAjuste,
    private _estado: EstadoAjuste,
    readonly solicitanteId: string,
    private _aprobadorId: string | undefined,
    private _version: number,
    private _lineas: LineaAjusteProps[],
    readonly observacion: string | undefined,
    readonly documentoOrigenTipo: string | undefined,
    readonly documentoOrigenId: string | undefined,
  ) {}

  static crear(props: {
    id: string
    codigo: string
    almacenId: string
    tipoAjuste: TipoAjuste
    solicitanteId: string
    lineas: LineaAjusteProps[]
    observacion?: string
    documentoOrigenTipo?: string
    documentoOrigenId?: string
    solicitar?: boolean
  }): Ajuste {
    if (props.lineas.length === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'El ajuste requiere al menos una línea.',
      )
    }
    for (const linea of props.lineas) {
      if (!Number.isInteger(linea.cantidadObjetivo) || linea.cantidadObjetivo < 0) {
        throw new InventoryDomainError(
          'INVALID_ADJUSTMENT',
          'La cantidad objetivo debe ser un entero >= 0.',
        )
      }
      if (!Number.isInteger(linea.diferencia) || linea.diferencia === 0) {
        throw new InventoryDomainError(
          'INVALID_ADJUSTMENT',
          'Cada línea de ajuste requiere diferencia distinta de cero.',
        )
      }
    }
    return new Ajuste(
      props.id,
      props.codigo,
      props.almacenId,
      props.tipoAjuste,
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

  static rehidratar(props: AjusteProps): Ajuste {
    return new Ajuste(
      props.id,
      props.codigo,
      props.almacenId,
      props.tipoAjuste,
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

  get estado(): EstadoAjuste {
    return this._estado
  }

  get version(): number {
    return this._version
  }

  get aprobadorId(): string | undefined {
    return this._aprobadorId
  }

  get lineas(): readonly LineaAjusteProps[] {
    return this._lineas
  }

  assertVersion(expected: number): void {
    if (this._version !== expected) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'Conflicto de concurrencia en el ajuste.',
        { expected, actual: this._version },
      )
    }
  }

  solicitar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede solicitar un ajuste en borrador.',
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
        'Solo se puede rechazar un ajuste solicitado.',
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
        'Solo se puede cancelar un ajuste en borrador o solicitado.',
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
        'Solo se puede revertir un ajuste aplicado.',
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
        'Solo se puede aprobar un ajuste solicitado.',
        { estado: this._estado },
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
        'Solo se puede aplicar un ajuste aprobado.',
        { estado: this._estado },
      )
    }
    this._estado = 'aplicado'
    this._version += 1
  }

  toProps(): AjusteProps {
    return {
      id: this.id,
      codigo: this.codigo,
      almacenId: this.almacenId,
      tipoAjuste: this.tipoAjuste,
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
