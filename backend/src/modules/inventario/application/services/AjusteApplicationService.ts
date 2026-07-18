import { Ajuste, AjusteProps, TipoAjuste } from '../../domain/aggregates/Ajuste'
import { Existencia } from '../../domain/entities/Existencia'
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
  IAjusteRepository,
  IAlmacenRepository,
  IClock,
  IConteoFisicoRepository,
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

export interface AjusteApplicationDeps {
  uow: IUnitOfWork
  ajustes: IAjusteRepository
  conteos: IConteoFisicoRepository
  existencias: IExistenciaRepository
  almacenes: IAlmacenRepository
  productos: IProductoReadPort
  idempotency: IIdempotencyRepository
  outbox: IOutbox
  clock: IClock
  ids: IIdGenerator
  engine: InventoryEngine
  persistPorts: PersistEngineResultPorts
}

export class AjusteApplicationService {
  constructor(private readonly deps: AjusteApplicationDeps) {}

  async crearAjuste(input: {
    codigo: string
    almacenId: string
    tipoAjuste: TipoAjuste
    solicitanteId: string
    lineas: Array<{
      productoId: string
      cantidadObjetivo: number
      diferencia: number
      motivoCodigo?: string
      lineaConteoId?: string
      observacion?: string
    }>
    observacion?: string
    documentoOrigenTipo?: string
    documentoOrigenId?: string
    solicitar?: boolean
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

        const ajuste = Ajuste.crear({
          id: this.deps.ids.generate(),
          codigo: input.codigo,
          almacenId: input.almacenId,
          tipoAjuste: input.tipoAjuste,
          solicitanteId: input.solicitanteId,
          lineas: input.lineas.map((l) => ({
            id: this.deps.ids.generate(),
            ...l,
          })),
          observacion: input.observacion,
          documentoOrigenTipo: input.documentoOrigenTipo,
          documentoOrigenId: input.documentoOrigenId,
          solicitar: input.solicitar !== false,
        })

        await this.deps.ajustes.save(ajuste)
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: ajuste.estado === 'borrador' ? 'AjusteCreado' : 'AjusteSolicitado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: { codigo: ajuste.codigo, estado: ajuste.estado },
        })
        return ok({
          id: ajuste.id,
          codigo: ajuste.codigo,
          estado: ajuste.estado,
          version: ajuste.version,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async aprobarAjuste(input: {
    ajusteId: string
    aprobadorId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }
        ajuste.aprobar(input.aprobadorId, input.expectedVersion)
        await this.deps.ajustes.save(ajuste)
        const value = {
          id: ajuste.id,
          estado: ajuste.estado,
          version: ajuste.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteAprobado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async aplicarAjuste(input: {
    ajusteId: string
    actorId: string
    expectedVersion: number
    idempotencyKey: string
    permitirAlmacenBloqueadoPorConteoId?: string
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const prev = await this.deps.idempotency.get(input.idempotencyKey)
        if (prev) {
          return ok(prev.resultado as { id: string; estado: string; version: number }, true)
        }

        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }

        const almacen = await this.deps.almacenes.getById(ajuste.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }
        const bloqueado =
          !!almacen.bloqueadoPorConteo &&
          almacen.conteoBloqueanteId !== input.permitirAlmacenBloqueadoPorConteoId

        ajuste.marcarAplicado(input.expectedVersion)

        for (const linea of ajuste.lineas) {
          let existencia = await this.deps.existencias.get(
            linea.productoId,
            ajuste.almacenId,
          )
          if (!existencia) {
            existencia = Existencia.crear({
              id: this.deps.ids.generate(),
              productoId: linea.productoId,
              almacenId: ajuste.almacenId,
              saldo: 0,
              version: 1,
            })
          }
          const producto = await this.deps.productos.getById(linea.productoId)
          const engineResult = this.deps.engine.aplicarAjuste(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidadObjetivo: linea.cantidadObjetivo,
              documento: DocumentoOrigenRef.of('ajuste', ajuste.id, linea.id),
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

          if (linea.lineaConteoId && ajuste.documentoOrigenTipo === 'conteo' && ajuste.documentoOrigenId) {
            const conteo = await this.deps.conteos.getById(ajuste.documentoOrigenId)
            if (conteo) {
              conteo.marcarLineaRegularizada(conteo.version, linea.lineaConteoId, {
                tipo: 'ajuste',
                id: ajuste.id,
              })
              await this.deps.conteos.save(conteo)
            }
          }
        }

        await this.deps.ajustes.save(ajuste)
        const value = {
          id: ajuste.id,
          estado: ajuste.estado,
          version: ajuste.version,
        }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'aplicar_ajuste',
          documentoTipo: 'ajuste',
          documentoId: ajuste.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteAplicado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async solicitarAjuste(input: {
    ajusteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }
        ajuste.solicitar(input.expectedVersion)
        await this.deps.ajustes.save(ajuste)
        const value = { id: ajuste.id, estado: ajuste.estado, version: ajuste.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteSolicitado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async rechazarAjuste(input: {
    ajusteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }
        ajuste.rechazar(input.expectedVersion)
        await this.deps.ajustes.save(ajuste)
        const value = { id: ajuste.id, estado: ajuste.estado, version: ajuste.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteRechazado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async cancelarAjuste(input: {
    ajusteId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }
        ajuste.cancelar(input.expectedVersion)
        await this.deps.ajustes.save(ajuste)
        const value = { id: ajuste.id, estado: ajuste.estado, version: ajuste.version }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteCancelado',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  /**
   * Revierte un ajuste ya aplicado: por cada línea calcula el objetivo
   * complementario (saldoActual - diferencia) y reutiliza Engine.aplicarAjuste
   * para restaurar el stock al valor previo a la aplicación original.
   */
  async revertirAjuste(input: {
    ajusteId: string
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

        const ajuste = await this.deps.ajustes.getById(input.ajusteId)
        if (!ajuste) {
          return fail('NOT_FOUND', 'Ajuste no encontrado.')
        }

        const almacen = await this.deps.almacenes.getById(ajuste.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }

        ajuste.marcarRevertido(input.expectedVersion)

        for (const linea of ajuste.lineas) {
          const existencia = await this.deps.existencias.get(linea.productoId, ajuste.almacenId)
          if (!existencia) {
            return fail('NOT_FOUND', 'Existencia no encontrada.', {
              productoId: linea.productoId,
            })
          }
          const producto = await this.deps.productos.getById(linea.productoId)
          const cantidadObjetivoRevertida = existencia.saldo.value - linea.diferencia
          const engineResult = this.deps.engine.aplicarAjuste(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidadObjetivo: cantidadObjetivoRevertida,
              documento: DocumentoOrigenRef.of('ajuste', ajuste.id, linea.id),
              usuarioId: input.actorId,
              idempotencyKey: `${input.idempotencyKey}:linea:${linea.id}`,
              motivoCodigo: 'REVERSION_AJUSTE',
              observacion: `Reversión del ajuste ${ajuste.codigo}`,
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

        await this.deps.ajustes.save(ajuste)
        const value = { id: ajuste.id, estado: ajuste.estado, version: ajuste.version }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'revertir_ajuste',
          documentoTipo: 'ajuste',
          documentoId: ajuste.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'AjusteRevertido',
          aggregateType: 'Ajuste',
          aggregateId: ajuste.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async listarAjustes(): Promise<ApplicationResult<AjusteProps[]>> {
    try {
      const items = await this.deps.ajustes.listAll()
      const props = items.map((a) => a.toProps()).sort((a, b) => b.id.localeCompare(a.id))
      return ok(props)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async getAjuste(id: string): Promise<ApplicationResult<AjusteProps>> {
    try {
      const ajuste = await this.deps.ajustes.getById(id)
      if (!ajuste) {
        return fail('NOT_FOUND', 'Ajuste no encontrado.')
      }
      return ok(ajuste.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }
}
