import { InventoryDomainError } from '../errors/InventoryDomainError'

export type EstadoConteo =
  | 'borrador'
  | 'abierto'
  | 'en_conteo'
  | 'en_revision'
  | 'cerrado'
  | 'cancelado'

export type TipoConteo = 'general' | 'parcial' | 'ciclico' | 'extraordinario'

export type ClasificacionDiferencia =
  | 'cuadra'
  | 'sobrante'
  | 'faltante'
  | 'dano'
  | 'investigacion'

export type EstadoLineaConteo =
  | 'pendiente'
  | 'contada'
  | 'en_reconteo'
  | 'revisada'
  | 'regularizada'

export interface SnapshotConteoProps {
  id: string
  productoId: string
  cantidadTeorica: number
  costoReferencia?: number
}

export interface LineaConteoProps {
  id: string
  productoId: string
  snapshotId: string
  cantidadContada?: number
  cantidadReconteo?: number
  cantidadAceptada?: number
  diferencia?: number
  clasificacion?: ClasificacionDiferencia
  estadoLinea: EstadoLineaConteo
  regularizacionTipo?: 'ajuste' | 'descarte'
  regularizacionId?: string
  observacion?: string
}

export interface ConteoFisicoProps {
  id: string
  codigo: string
  almacenId: string
  tipoConteo: TipoConteo
  descripcionAlcance: string
  estado: EstadoConteo
  responsableId: string
  bloqueoActivo: boolean
  version: number
  snapshots: SnapshotConteoProps[]
  lineas: LineaConteoProps[]
}

export class ConteoFisico {
  private constructor(
    readonly id: string,
    readonly codigo: string,
    readonly almacenId: string,
    readonly tipoConteo: TipoConteo,
    readonly descripcionAlcance: string,
    private _estado: EstadoConteo,
    readonly responsableId: string,
    private _bloqueoActivo: boolean,
    private _version: number,
    private _snapshots: SnapshotConteoProps[],
    private _lineas: LineaConteoProps[],
  ) {}

  static crear(props: {
    id: string
    codigo: string
    almacenId: string
    tipoConteo: TipoConteo
    descripcionAlcance: string
    responsableId: string
  }): ConteoFisico {
    if (!props.descripcionAlcance.trim()) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'El conteo requiere describir el alcance.',
      )
    }
    return new ConteoFisico(
      props.id,
      props.codigo,
      props.almacenId,
      props.tipoConteo,
      props.descripcionAlcance.trim(),
      'borrador',
      props.responsableId,
      false,
      1,
      [],
      [],
    )
  }

  static rehidratar(props: ConteoFisicoProps): ConteoFisico {
    return new ConteoFisico(
      props.id,
      props.codigo,
      props.almacenId,
      props.tipoConteo,
      props.descripcionAlcance,
      props.estado,
      props.responsableId,
      props.bloqueoActivo,
      props.version,
      props.snapshots.map((s) => ({ ...s })),
      props.lineas.map((l) => ({ ...l })),
    )
  }

  get estado(): EstadoConteo {
    return this._estado
  }

  get version(): number {
    return this._version
  }

  get bloqueoActivo(): boolean {
    return this._bloqueoActivo
  }

  get snapshots(): readonly SnapshotConteoProps[] {
    return this._snapshots
  }

  get lineas(): readonly LineaConteoProps[] {
    return this._lineas
  }

  assertVersion(expected: number): void {
    if (this._version !== expected) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'Conflicto de concurrencia en el conteo.',
        { expected, actual: this._version },
      )
    }
  }

  abrir(
    expectedVersion: number,
    snapshots: SnapshotConteoProps[],
    lineaIds: string[],
  ): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede abrir un conteo en borrador.',
        { estado: this._estado },
      )
    }
    if (snapshots.length === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'El snapshot del conteo no puede estar vacío.',
      )
    }
    this._snapshots = snapshots.map((s) => ({ ...s }))
    this._lineas = snapshots.map((s, index) => ({
      id: lineaIds[index] ?? `${s.id}-linea`,
      productoId: s.productoId,
      snapshotId: s.id,
      estadoLinea: 'pendiente' as const,
    }))
    this._estado = 'abierto'
    this._bloqueoActivo = true
    this._version += 1
  }

  registrarLinea(
    expectedVersion: number,
    lineaId: string,
    cantidadContada: number,
  ): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'abierto' && this._estado !== 'en_conteo') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se registran cantidades en conteo abierto o en captura.',
        { estado: this._estado },
      )
    }
    if (!Number.isInteger(cantidadContada) || cantidadContada < 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'La cantidad contada debe ser un entero >= 0.',
      )
    }
    const linea = this._lineas.find((l) => l.id === lineaId)
    if (!linea) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'Línea de conteo no encontrada.',
        { lineaId },
      )
    }
    const snapshot = this._snapshots.find((s) => s.id === linea.snapshotId)
    if (!snapshot) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'Snapshot de línea no encontrado.',
      )
    }
    linea.cantidadContada = cantidadContada
    linea.cantidadAceptada = cantidadContada
    linea.diferencia = cantidadContada - snapshot.cantidadTeorica
    linea.estadoLinea = 'contada'
    this._estado = 'en_conteo'
    this._version += 1
  }

  iniciarReconteo(expectedVersion: number, lineaIds?: string[]): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'en_conteo') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede iniciar reconteo desde un conteo en captura.',
        { estado: this._estado },
      )
    }
    const objetivo = lineaIds?.length
      ? new Set(lineaIds)
      : new Set(
          this._lineas
            .filter((l) => (l.diferencia ?? 0) !== 0)
            .map((l) => l.id),
        )
    if (lineaIds?.length) {
      for (const lineaId of lineaIds) {
        if (!this._lineas.some((l) => l.id === lineaId)) {
          throw new InventoryDomainError(
            'INVALID_DOCUMENT_REF',
            'Línea de conteo no encontrada.',
            { lineaId },
          )
        }
      }
    }
    if (objetivo.size === 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'No hay líneas con diferencia para reconteo.',
      )
    }
    this._lineas = this._lineas.map((l) =>
      objetivo.has(l.id) ? { ...l, estadoLinea: 'en_reconteo' as const } : l,
    )
    this._version += 1
  }

  cancelar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'borrador' && this._estado !== 'abierto') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se puede cancelar un conteo en borrador o abierto (sin movimientos de stock).',
        { estado: this._estado },
      )
    }
    this._estado = 'cancelado'
    this._bloqueoActivo = false
    this._version += 1
  }

  enviarARevision(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'en_conteo' && this._estado !== 'abierto') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'El conteo no está listo para revisión.',
        { estado: this._estado },
      )
    }
    const pendientes = this._lineas.filter((l) => l.estadoLinea === 'pendiente')
    if (pendientes.length > 0) {
      throw new InventoryDomainError(
        'INVALID_QUANTITY',
        'Todas las líneas del alcance deben estar contadas antes de la revisión.',
        { pendientes: pendientes.length },
      )
    }
    this._estado = 'en_revision'
    this._version += 1
  }

  clasificarLinea(
    expectedVersion: number,
    lineaId: string,
    clasificacion: ClasificacionDiferencia,
    regularizacion?: { tipo: 'ajuste' | 'descarte'; id: string },
  ): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'en_revision') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se clasifica en revisión.',
        { estado: this._estado },
      )
    }
    const linea = this._lineas.find((l) => l.id === lineaId)
    if (!linea) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'Línea de conteo no encontrada.',
        { lineaId },
      )
    }
    const diferencia = linea.diferencia ?? 0
    if (diferencia === 0 && clasificacion !== 'cuadra') {
      throw new InventoryDomainError(
        'INVALID_ADJUSTMENT',
        'Una línea sin diferencia solo puede clasificarse como cuadra.',
      )
    }
    if (diferencia !== 0 && clasificacion === 'cuadra') {
      throw new InventoryDomainError(
        'INVALID_ADJUSTMENT',
        'Una línea con diferencia no puede clasificarse como cuadra.',
      )
    }
    if (
      (clasificacion === 'sobrante' ||
        clasificacion === 'faltante' ||
        clasificacion === 'dano') &&
      !regularizacion
    ) {
      // Permitir clasificar sin documento aún; cierre exigirá regularización aplicada.
    }
    linea.clasificacion = clasificacion
    linea.estadoLinea = 'revisada'
    if (regularizacion) {
      linea.regularizacionTipo = regularizacion.tipo
      linea.regularizacionId = regularizacion.id
      if (clasificacion !== 'investigacion') {
        linea.estadoLinea = 'regularizada'
      }
    }
    this._version += 1
  }

  marcarLineaRegularizada(
    expectedVersion: number,
    lineaId: string,
    regularizacion: { tipo: 'ajuste' | 'descarte'; id: string },
  ): void {
    this.assertVersion(expectedVersion)
    const linea = this._lineas.find((l) => l.id === lineaId)
    if (!linea) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'Línea de conteo no encontrada.',
        { lineaId },
      )
    }
    linea.regularizacionTipo = regularizacion.tipo
    linea.regularizacionId = regularizacion.id
    linea.estadoLinea = 'regularizada'
    this._version += 1
  }

  cerrar(expectedVersion: number): void {
    this.assertVersion(expectedVersion)
    if (this._estado !== 'en_revision') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Solo se cierra un conteo en revisión.',
        { estado: this._estado },
      )
    }
    for (const linea of this._lineas) {
      const diferencia = linea.diferencia ?? 0
      if (diferencia === 0) {
        if (linea.clasificacion !== 'cuadra') {
          throw new InventoryDomainError(
            'INVALID_ADJUSTMENT',
            'Hay líneas sin clasificación de cuadre.',
            { lineaId: linea.id },
          )
        }
        continue
      }
      if (linea.clasificacion === 'investigacion' || !linea.clasificacion) {
        throw new InventoryDomainError(
          'INVALID_ADJUSTMENT',
          'Cierre estricto: no puede haber diferencias en investigación.',
          { lineaId: linea.id },
        )
      }
      if (linea.estadoLinea !== 'regularizada' || !linea.regularizacionId) {
        throw new InventoryDomainError(
          'INVALID_ADJUSTMENT',
          'Cierre estricto: toda diferencia debe estar regularizada.',
          { lineaId: linea.id },
        )
      }
    }
    this._estado = 'cerrado'
    this._bloqueoActivo = false
    this._version += 1
  }

  toProps(): ConteoFisicoProps {
    return {
      id: this.id,
      codigo: this.codigo,
      almacenId: this.almacenId,
      tipoConteo: this.tipoConteo,
      descripcionAlcance: this.descripcionAlcance,
      estado: this._estado,
      responsableId: this.responsableId,
      bloqueoActivo: this._bloqueoActivo,
      version: this._version,
      snapshots: this._snapshots.map((s) => ({ ...s })),
      lineas: this._lineas.map((l) => ({ ...l })),
    }
  }
}
