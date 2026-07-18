import {
  ClasificacionDiferencia,
  ConteoFisico,
  ConteoFisicoProps,
  TipoConteo,
} from '../../domain/aggregates/ConteoFisico'
import { CreateConteoCommand } from '../commands/CreateConteoCommand'
import {
  ConteoCreateMetadata,
  ConteoListItem,
} from '../models/ConteoCreateMetadata'
import {
  ApplicationResult,
  fail,
  mapDomainError,
  ok,
  withUnitOfWork,
} from '../results/ApplicationResult'
import {
  IAlmacenRepository,
  IClock,
  IConteoFisicoRepository,
  IExistenciaRepository,
  IIdGenerator,
  IOutbox,
  IUnitOfWork,
  publishApplicationEvent,
} from '../ports/outbound'

export interface ConteoApplicationDeps {
  uow: IUnitOfWork
  conteos: IConteoFisicoRepository
  existencias: IExistenciaRepository
  almacenes: IAlmacenRepository
  outbox: IOutbox
  clock: IClock
  ids: IIdGenerator
}

function buildDescripcionAlcance(cmd: CreateConteoCommand): string {
  return [
    `nombre=${cmd.nombre}`,
    `alcance=${cmd.alcanceTipo}`,
    cmd.alcanceValor ? `ref=${cmd.alcanceValor}` : null,
    `productos=${cmd.productos.length}`,
  ]
    .filter(Boolean)
    .join('; ')
}

export class ConteoApplicationService {
  constructor(private readonly deps: ConteoApplicationDeps) {}

  /**
   * Caso de uso completo: Crear Conteo Físico.
   * Persiste cabecera + alcance de productos. No llama al Engine. No mueve stock.
   */
  async crearConteoCompleto(
    cmd: CreateConteoCommand,
  ): Promise<
    ApplicationResult<{
      id: string
      codigo: string
      estado: string
      version: number
      nombre: string
      fase: string
      productosAlcance: number
    }>
  > {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        if (!cmd.nombre?.trim()) {
          return fail('VALIDATION', 'El nombre del conteo es obligatorio.')
        }
        if (!cmd.sucursalId?.trim()) {
          return fail('VALIDATION', 'La sucursal es obligatoria.')
        }
        if (!cmd.almacenId?.trim()) {
          return fail('VALIDATION', 'El almacén es obligatorio.')
        }
        if (!cmd.responsableId?.trim()) {
          return fail('VALIDATION', 'El responsable es obligatorio.')
        }
        if (!cmd.alcanceTipo) {
          return fail('VALIDATION', 'Debe indicar el tipo de alcance.')
        }
        if (
          (cmd.alcanceTipo === 'categoria' ||
            cmd.alcanceTipo === 'editorial' ||
            cmd.alcanceTipo === 'ubicacion') &&
          !cmd.alcanceValor?.trim()
        ) {
          return fail('VALIDATION', 'Debe seleccionar el valor del alcance.')
        }
        if (!cmd.productos?.length) {
          return fail('VALIDATION', 'El alcance debe incluir al menos un producto.')
        }
        if (
          !Number.isFinite(cmd.diferenciaMinimaReconteo) ||
          cmd.diferenciaMinimaReconteo < 0
        ) {
          return fail('VALIDATION', 'Diferencia mínima para reconteo inválida.')
        }

        const almacen = await this.deps.almacenes.getById(cmd.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }

        const conflictiva = await this.deps.conteos.existsSesionActivaConflictiva(
          cmd.almacenId,
        )
        if (conflictiva) {
          return fail(
            'CONFLICT',
            'Ya existe una sesión de conteo activa para el almacén. La política impide abrir otro conteo concurrente.',
          )
        }

        const codigo =
          cmd.codigo?.trim() ||
          `CF-${this.deps.clock.now().toISOString().slice(0, 10).replace(/-/g, '')}-${this.deps.ids.generate().slice(0, 6).toUpperCase()}`

        const conteo = ConteoFisico.crear({
          id: this.deps.ids.generate(),
          codigo,
          almacenId: cmd.almacenId,
          tipoConteo: cmd.tipoConteo,
          descripcionAlcance: buildDescripcionAlcance(cmd),
          responsableId: cmd.responsableId,
        })

        const now = this.deps.clock.now().toISOString()
        const meta: ConteoCreateMetadata = {
          conteoId: conteo.id,
          nombre: cmd.nombre.trim(),
          sucursalId: cmd.sucursalId.trim(),
          alcanceTipo: cmd.alcanceTipo,
          alcanceValor: cmd.alcanceValor?.trim(),
          fechaProgramada: cmd.fechaProgramada,
          horaProgramada: cmd.horaProgramada,
          responsableNombre: cmd.responsableNombre,
          observaciones: cmd.observaciones?.trim(),
          bloquearAlmacenAlAbrir: cmd.bloquearAlmacenAlAbrir,
          permitirReconteo: cmd.permitirReconteo,
          diferenciaMinimaReconteo: cmd.diferenciaMinimaReconteo,
          fase: 'Crear',
          productos: cmd.productos.map((p) => ({ ...p })),
          createdBy: cmd.createdBy,
          createdAt: now,
          updatedAt: now,
        }

        await this.deps.conteos.save(conteo)
        await this.deps.conteos.saveCreateMetadata(meta)
        await this.deps.conteos.appendAuditoria({
          id: this.deps.ids.generate(),
          conteoId: conteo.id,
          accion: 'CREAR_CONTEO',
          usuarioId: cmd.createdBy,
          resultado: 'OK',
          detalle: `Conteo ${codigo} en borrador · ${cmd.productos.length} productos en alcance`,
        })

        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoCreado',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: {
            codigo: conteo.codigo,
            estado: conteo.estado,
            nombre: meta.nombre,
            productos: meta.productos.length,
          },
        })

        return ok({
          id: conteo.id,
          codigo: conteo.codigo,
          estado: conteo.estado,
          version: conteo.version,
          nombre: meta.nombre,
          fase: meta.fase,
          productosAlcance: meta.productos.length,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async crearConteo(input: {
    codigo: string
    almacenId: string
    tipoConteo: TipoConteo
    descripcionAlcance: string
    responsableId: string
  }): Promise<ApplicationResult<{ id: string; codigo: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const almacen = await this.deps.almacenes.getById(input.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }
        const conflictiva = await this.deps.conteos.existsSesionActivaConflictiva(
          input.almacenId,
        )
        if (conflictiva) {
          return fail(
            'CONFLICT',
            'Ya existe una sesión de conteo activa para el almacén.',
          )
        }

        const conteo = ConteoFisico.crear({
          id: this.deps.ids.generate(),
          codigo: input.codigo,
          almacenId: input.almacenId,
          tipoConteo: input.tipoConteo,
          descripcionAlcance: input.descripcionAlcance,
          responsableId: input.responsableId,
        })
        await this.deps.conteos.save(conteo)
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoCreado',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: { codigo: conteo.codigo, estado: conteo.estado },
        })
        return ok({
          id: conteo.id,
          codigo: conteo.codigo,
          estado: conteo.estado,
          version: conteo.version,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async listarConteos(): Promise<ApplicationResult<ConteoListItem[]>> {
    try {
      const conteos = await this.deps.conteos.listAll()
      const metas = await this.deps.conteos.listCreateMetadata()
      const metaById = new Map(metas.map((m) => [m.conteoId, m]))
      const items: ConteoListItem[] = conteos.map((c) => {
        const meta = metaById.get(c.id)
        return {
          id: c.id,
          codigo: c.codigo,
          nombre: meta?.nombre ?? c.codigo,
          almacenId: c.almacenId,
          sucursalId: meta?.sucursalId ?? '',
          tipoConteo: c.tipoConteo,
          estado: c.estado,
          fase: meta?.fase ?? (c.estado === 'borrador' ? 'Crear' : c.estado),
          responsableId: c.responsableId,
          responsableNombre: meta?.responsableNombre,
          productosAlcance: meta?.productos.length ?? c.lineas.length,
          diferencias: c.lineas.filter((l) => (l.diferencia ?? 0) !== 0).length,
          bloqueoActivo: c.bloqueoActivo,
          fecha: meta?.createdAt?.slice(0, 10) ?? '',
          version: c.version,
        }
      })
      items.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.codigo.localeCompare(a.codigo))
      return ok(items)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async abrirConteo(input: {
    conteoId: string
    expectedVersion: number
    productoIds?: string[]
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number; lineas: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }

        const conflictiva = await this.deps.conteos.existsSesionActivaConflictiva(
          conteo.almacenId,
          conteo.id,
        )
        if (conflictiva) {
          return fail(
            'CONFLICT',
            'Ya existe otra sesión de conteo activa para el almacén.',
          )
        }

        let existencias = await this.deps.existencias.listByAlmacen(conteo.almacenId)
        let productoIds = input.productoIds
        if (!productoIds?.length) {
          const meta = await this.deps.conteos.getCreateMetadata(conteo.id)
          if (meta?.productos.length) {
            productoIds = meta.productos.map((p) => p.productoId)
          }
        }
        if (productoIds?.length) {
          const set = new Set(productoIds)
          existencias = existencias.filter((e) => set.has(e.productoId))
        }
        if (existencias.length === 0) {
          return fail(
            'VALIDATION',
            'No hay existencias en el alcance para tomar snapshot.',
          )
        }

        const snapshots = existencias.map((e) => ({
          id: this.deps.ids.generate(),
          productoId: e.productoId,
          cantidadTeorica: e.saldo.value,
        }))
        const lineaIds = snapshots.map(() => this.deps.ids.generate())

        conteo.abrir(input.expectedVersion, snapshots, lineaIds)
        await this.deps.almacenes.updateBloqueo(conteo.almacenId, true, conteo.id)
        await this.deps.conteos.save(conteo)

        const meta = await this.deps.conteos.getCreateMetadata(conteo.id)
        if (meta) {
          await this.deps.conteos.saveCreateMetadata({
            ...meta,
            fase: 'Abrir',
            updatedAt: this.deps.clock.now().toISOString(),
          })
        }

        const value = {
          id: conteo.id,
          estado: conteo.estado,
          version: conteo.version,
          lineas: conteo.lineas.length,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoAbierto',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async registrarLineaConteo(input: {
    conteoId: string
    lineaId: string
    cantidadContada: number
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        conteo.registrarLinea(
          input.expectedVersion,
          input.lineaId,
          input.cantidadContada,
        )
        await this.deps.conteos.save(conteo)
        return ok({
          id: conteo.id,
          estado: conteo.estado,
          version: conteo.version,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async enviarConteoARevision(input: {
    conteoId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        conteo.enviarARevision(input.expectedVersion)
        await this.deps.conteos.save(conteo)
        const value = {
          id: conteo.id,
          estado: conteo.estado,
          version: conteo.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoEnRevision',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async clasificarLineaConteo(input: {
    conteoId: string
    lineaId: string
    expectedVersion: number
    clasificacion: ClasificacionDiferencia
    regularizacion?: { tipo: 'ajuste' | 'descarte'; id: string }
  }): Promise<ApplicationResult<{ id: string; version: number; lineaId: string }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        conteo.clasificarLinea(
          input.expectedVersion,
          input.lineaId,
          input.clasificacion,
          input.regularizacion,
        )
        await this.deps.conteos.save(conteo)
        return ok({
          id: conteo.id,
          version: conteo.version,
          lineaId: input.lineaId,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async cerrarConteo(input: {
    conteoId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        conteo.cerrar(input.expectedVersion)
        await this.deps.almacenes.updateBloqueo(conteo.almacenId, false)
        await this.deps.conteos.save(conteo)
        const value = {
          id: conteo.id,
          estado: conteo.estado,
          version: conteo.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoCerrado',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async iniciarReconteo(input: {
    conteoId: string
    expectedVersion: number
    lineaIds?: string[]
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number; lineasEnReconteo: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        conteo.iniciarReconteo(input.expectedVersion, input.lineaIds)
        await this.deps.conteos.save(conteo)
        const value = {
          id: conteo.id,
          estado: conteo.estado,
          version: conteo.version,
          lineasEnReconteo: conteo.lineas.filter((l) => l.estadoLinea === 'en_reconteo').length,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoReconteoIniciado',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async cancelarConteo(input: {
    conteoId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const conteo = await this.deps.conteos.getById(input.conteoId)
        if (!conteo) {
          return fail('NOT_FOUND', 'Conteo no encontrado.')
        }
        const estabaBloqueado = conteo.bloqueoActivo
        conteo.cancelar(input.expectedVersion)
        if (estabaBloqueado) {
          await this.deps.almacenes.updateBloqueo(conteo.almacenId, false)
        }
        await this.deps.conteos.save(conteo)
        const value = { id: conteo.id, estado: conteo.estado, version: conteo.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'ConteoCancelado',
          aggregateType: 'ConteoFisico',
          aggregateId: conteo.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async getConteo(
    id: string,
  ): Promise<ApplicationResult<ConteoFisicoProps & { meta: ConteoCreateMetadata | null }>> {
    try {
      const conteo = await this.deps.conteos.getById(id)
      if (!conteo) {
        return fail('NOT_FOUND', 'Conteo no encontrado.')
      }
      const meta = await this.deps.conteos.getCreateMetadata(id)
      return ok({ ...conteo.toProps(), meta })
    } catch (error) {
      return mapDomainError(error)
    }
  }
}
