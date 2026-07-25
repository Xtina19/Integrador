import { Descarte, DescarteProps } from '../../domain/aggregates/Descarte'
import { DocumentoOrigenRef } from '../../domain/value-objects/DocumentoOrigenRef'
import { InventoryEngine } from '../../domain/services/InventoryEngine'
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
  IDescarteRepository,
  IExistenciaRepository,
  IIdGenerator,
  IIdempotencyRepository,
  IOutbox,
  IProductoReadPort,
  IUnitOfWork,
  PersistEngineResultPorts,
  persistEngineResult,
  publishApplicationEvent,
} from '../ports/outbound'
import type { IDescarteCreateStore } from '../ports/descarteCreateStore'

export interface DescarteApplicationDeps {
  uow: IUnitOfWork
  descartes: IDescarteRepository
  existencias: IExistenciaRepository
  almacenes: IAlmacenRepository
  productos: IProductoReadPort
  idempotency: IIdempotencyRepository
  outbox: IOutbox
  clock: IClock
  ids: IIdGenerator
  engine: InventoryEngine
  persistPorts: PersistEngineResultPorts
  /** Opcional: sincroniza metadatos del caso "Crear Descarte" al transicionar el agregado. */
  createStore?: IDescarteCreateStore
}

export class DescarteApplicationService {
  constructor(private readonly deps: DescarteApplicationDeps) {}

  async crearDescarte(input: {
    codigo: string
    almacenId: string
    solicitanteId: string
    lineas: Array<{
      productoId: string
      cantidad: number
      motivoCodigo: string
      observacion?: string
    }>
    observacion?: string
    documentoOrigenTipo?: string
    documentoOrigenId?: string
  }): Promise<ApplicationResult<{ id: string; codigo: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const almacen = await this.deps.almacenes.getById(input.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }
        for (const linea of input.lineas) {
          const producto = await this.deps.productos.getById(linea.productoId)
          if (!producto?.activo) {
            return fail('DOMAIN_RULE', 'Producto inexistente o inactivo.', {
              productoId: linea.productoId,
            })
          }
        }

        const descarte = Descarte.crear({
          id: this.deps.ids.generate(),
          codigo: input.codigo,
          almacenId: input.almacenId,
          solicitanteId: input.solicitanteId,
          lineas: input.lineas.map((l) => ({
            id: this.deps.ids.generate(),
            ...l,
          })),
          observacion: input.observacion,
          documentoOrigenTipo: input.documentoOrigenTipo,
          documentoOrigenId: input.documentoOrigenId,
          solicitar: true,
        })

        await this.deps.descartes.save(descarte)
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteSolicitado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: { codigo: descarte.codigo, estado: descarte.estado },
        })
        return ok({
          id: descarte.id,
          codigo: descarte.codigo,
          estado: descarte.estado,
          version: descarte.version,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async aprobarDescarte(input: {
    descarteId: string
    aprobadorId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }
        descarte.aprobar(input.aprobadorId, input.expectedVersion)
        await this.deps.descartes.save(descarte)
        const value = {
          id: descarte.id,
          estado: descarte.estado,
          version: descarte.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteAprobado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async aplicarDescarte(input: {
    descarteId: string
    actorId: string
    expectedVersion: number
    idempotencyKey: string
    /** Permite aplicar durante regularización del conteo dueño del bloqueo. */
    permitirAlmacenBloqueadoPorConteoId?: string
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const prev = await this.deps.idempotency.get(input.idempotencyKey)
        if (prev) {
          return ok(prev.resultado as { id: string; estado: string; version: number }, true)
        }

        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }

        const almacen = await this.deps.almacenes.getById(descarte.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }
        const bloqueado =
          !!almacen.bloqueadoPorConteo &&
          almacen.conteoBloqueanteId !== input.permitirAlmacenBloqueadoPorConteoId

        descarte.marcarAplicado(input.expectedVersion)

        for (const linea of descarte.lineas) {
          const existencia = await this.deps.existencias.get(
            linea.productoId,
            descarte.almacenId,
          )
          if (!existencia) {
            return fail('NOT_FOUND', 'Existencia no encontrada.', {
              productoId: linea.productoId,
            })
          }
          const producto = await this.deps.productos.getById(linea.productoId)
          const engineResult = this.deps.engine.aplicarDescarte(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidad: linea.cantidad,
              documento: DocumentoOrigenRef.of('descarte', descarte.id, linea.id),
              usuarioId: input.actorId,
              idempotencyKey: `${input.idempotencyKey}:linea:${linea.id}`,
              motivoCodigo: linea.motivoCodigo,
              observacion: linea.observacion,
            },
            {
              now: this.deps.clock.now(),
              generateId: () => this.deps.ids.generate(),
              almacenBloqueado: bloqueado,
              productoActivo: producto?.activo !== false,
            },
          )
          await persistEngineResult(this.deps.persistPorts, engineResult)
        }

        await this.deps.descartes.save(descarte)
        const value = {
          id: descarte.id,
          estado: descarte.estado,
          version: descarte.version,
        }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'aplicar_descarte',
          documentoTipo: 'descarte',
          documentoId: descarte.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteAplicado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  private async syncCreateStore(descarte: Descarte): Promise<void> {
    if (this.deps.createStore?.updateEstado) {
      await this.deps.createStore.updateEstado(descarte.id, descarte.estado, descarte.version)
    }
  }

  async solicitarDescarte(input: {
    descarteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }
        descarte.solicitar(input.expectedVersion)
        await this.deps.descartes.save(descarte)
        await this.syncCreateStore(descarte)
        const value = { id: descarte.id, estado: descarte.estado, version: descarte.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteSolicitado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async rechazarDescarte(input: {
    descarteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }
        descarte.rechazar(input.expectedVersion)
        await this.deps.descartes.save(descarte)
        await this.syncCreateStore(descarte)
        const value = { id: descarte.id, estado: descarte.estado, version: descarte.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteRechazado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async cancelarDescarte(input: {
    descarteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }
        descarte.cancelar(input.expectedVersion)
        await this.deps.descartes.save(descarte)
        await this.syncCreateStore(descarte)
        const value = { id: descarte.id, estado: descarte.estado, version: descarte.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteCancelado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  /**
   * Revierte un descarte aplicado: registra una entrada compensatoria por cada
   * línea (misma cantidad que se descartó) para restaurar el stock, luego marca
   * el agregado como revertido.
   */
  async revertirDescarte(input: {
    descarteId: string
    actorId: string
    expectedVersion: number
    idempotencyKey: string
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const prev = await this.deps.idempotency.get(input.idempotencyKey)
        if (prev) {
          return ok(prev.resultado as { id: string; estado: string; version: number }, true)
        }

        const descarte = await this.deps.descartes.getById(input.descarteId)
        if (!descarte) {
          return fail('NOT_FOUND', 'Descarte no encontrado.')
        }

        const almacen = await this.deps.almacenes.getById(descarte.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }

        descarte.marcarRevertido(input.expectedVersion)

        for (const linea of descarte.lineas) {
          let existencia = await this.deps.existencias.get(linea.productoId, descarte.almacenId)
          if (!existencia) {
            return fail('NOT_FOUND', 'Existencia no encontrada.', {
              productoId: linea.productoId,
            })
          }
          const producto = await this.deps.productos.getById(linea.productoId)
          const engineResult = this.deps.engine.registrarEntrada(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidad: linea.cantidad,
              tipoMovimiento: 'devolucion_entrada',
              documento: DocumentoOrigenRef.of('descarte', descarte.id, linea.id),
              usuarioId: input.actorId,
              idempotencyKey: `${input.idempotencyKey}:linea:${linea.id}`,
              motivoCodigo: 'REVERSION_DESCARTE',
              observacion: `Reversión del descarte ${descarte.codigo}`,
            },
            {
              now: this.deps.clock.now(),
              generateId: () => this.deps.ids.generate(),
              almacenBloqueado: false,
              productoActivo: producto?.activo !== false,
            },
          )
          await persistEngineResult(this.deps.persistPorts, engineResult)
        }

        await this.deps.descartes.save(descarte)
        await this.syncCreateStore(descarte)
        const value = { id: descarte.id, estado: descarte.estado, version: descarte.version }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'revertir_descarte',
          documentoTipo: 'descarte',
          documentoId: descarte.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteRevertido',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async listarDescartes(): Promise<ApplicationResult<DescarteProps[]>> {
    try {
      const items = await this.deps.descartes.listAll()
      const props = items.map((d) => d.toProps()).sort((a, b) => b.id.localeCompare(a.id))
      return ok(props)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async getDescarte(id: string): Promise<ApplicationResult<DescarteProps>> {
    try {
      const descarte = await this.deps.descartes.getById(id)
      if (!descarte) {
        return fail('NOT_FOUND', 'Descarte no encontrado.')
      }
      return ok(descarte.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }
}
