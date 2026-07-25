import { Transferencia, TransferenciaProps } from '../../domain/aggregates/Transferencia'
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
  IAlmacenRepository,
  IClock,
  IExistenciaRepository,
  IIdGenerator,
  IIdempotencyRepository,
  IOutbox,
  IProductoReadPort,
  ITransferenciaRepository,
  IUnitOfWork,
  PersistEngineResultPorts,
  persistEngineResult,
  publishApplicationEvent,
} from '../ports/outbound'

export interface TransferenciaApplicationDeps {
  uow: IUnitOfWork
  transferencias: ITransferenciaRepository
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

export class TransferenciaApplicationService {
  constructor(private readonly deps: TransferenciaApplicationDeps) {}

  async crearTransferencia(input: {
    codigo: string
    almacenOrigenId: string
    almacenDestinoId: string
    solicitanteId: string
    lineas: Array<{ productoId: string; cantidadSolicitada: number }>
    observacion?: string
    solicitar?: boolean
  }): Promise<ApplicationResult<{ id: string; codigo: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const origen = await this.deps.almacenes.getById(input.almacenOrigenId)
        const destino = await this.deps.almacenes.getById(input.almacenDestinoId)
        if (!origen || !destino) {
          return fail('NOT_FOUND', 'Almacén origen o destino no encontrado.')
        }
        for (const linea of input.lineas) {
          const producto = await this.deps.productos.getById(linea.productoId)
          if (!producto?.activo) {
            return fail('DOMAIN_RULE', 'Producto inexistente o inactivo.', {
              productoId: linea.productoId,
            })
          }
        }

        const transferencia = Transferencia.crear({
          id: this.deps.ids.generate(),
          codigo: input.codigo,
          almacenOrigenId: input.almacenOrigenId,
          almacenDestinoId: input.almacenDestinoId,
          solicitanteId: input.solicitanteId,
          lineas: input.lineas.map((l) => ({
            id: this.deps.ids.generate(),
            productoId: l.productoId,
            cantidadSolicitada: l.cantidadSolicitada,
          })),
          observacion: input.observacion,
          solicitar: input.solicitar,
        })

        await this.deps.transferencias.save(transferencia)
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'TransferenciaCreada',
          aggregateType: 'Transferencia',
          aggregateId: transferencia.id,
          payload: {
            codigo: transferencia.codigo,
            estado: transferencia.estado,
          },
        })

        return ok({
          id: transferencia.id,
          codigo: transferencia.codigo,
          estado: transferencia.estado,
          version: transferencia.version,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async despacharTransferencia(input: {
    transferenciaId: string
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

        const transferencia = await this.deps.transferencias.getById(input.transferenciaId)
        if (!transferencia) {
          return fail('NOT_FOUND', 'Transferencia no encontrada.')
        }

        const origen = await this.deps.almacenes.getById(transferencia.almacenOrigenId)
        if (!origen) {
          return fail('NOT_FOUND', 'Almacén origen no encontrado.')
        }
        if (origen.bloqueadoPorConteo) {
          return fail('DOMAIN_RULE', 'El almacén origen está bloqueado por conteo.')
        }

        transferencia.despachar(input.expectedVersion)

        for (const linea of transferencia.lineas) {
          const existencia = await this.deps.existencias.get(
            linea.productoId,
            transferencia.almacenOrigenId,
          )
          if (!existencia) {
            return fail('NOT_FOUND', 'Existencia no encontrada en origen.', {
              productoId: linea.productoId,
            })
          }
          const producto = await this.deps.productos.getById(linea.productoId)
          const engineResult = this.deps.engine.registrarSalida(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidad: linea.cantidadDespachada,
              tipoMovimiento: 'transferencia_salida',
              documento: DocumentoOrigenRef.of(
                'transferencia',
                transferencia.id,
                linea.id,
              ),
              usuarioId: input.actorId,
              idempotencyKey: `${input.idempotencyKey}:linea:${linea.id}`,
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

        await this.deps.transferencias.save(transferencia)
        const value = {
          id: transferencia.id,
          estado: transferencia.estado,
          version: transferencia.version,
        }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'despachar_transferencia',
          documentoTipo: 'transferencia',
          documentoId: transferencia.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'TransferenciaDespachada',
          aggregateType: 'Transferencia',
          aggregateId: transferencia.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async recibirTransferencia(input: {
    transferenciaId: string
    actorId: string
    expectedVersion: number
    idempotencyKey: string
    recepciones: Array<{
      lineaId: string
      cantidadRecibida: number
      cantidadFaltante?: number
      cantidadDanada?: number
    }>
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const prev = await this.deps.idempotency.get(input.idempotencyKey)
        if (prev) {
          return ok(prev.resultado as { id: string; estado: string; version: number }, true)
        }

        const transferencia = await this.deps.transferencias.getById(input.transferenciaId)
        if (!transferencia) {
          return fail('NOT_FOUND', 'Transferencia no encontrada.')
        }

        const destino = await this.deps.almacenes.getById(transferencia.almacenDestinoId)
        if (!destino) {
          return fail('NOT_FOUND', 'Almacén destino no encontrado.')
        }
        if (destino.bloqueadoPorConteo) {
          return fail('DOMAIN_RULE', 'El almacén destino está bloqueado por conteo.')
        }

        transferencia.recibir(input.expectedVersion, input.recepciones)

        for (const rec of input.recepciones) {
          if (rec.cantidadRecibida <= 0) continue
          const linea = transferencia.lineas.find((l) => l.id === rec.lineaId)
          if (!linea) {
            return fail('NOT_FOUND', 'Línea no encontrada.', { lineaId: rec.lineaId })
          }

          let existencia = await this.deps.existencias.get(
            linea.productoId,
            transferencia.almacenDestinoId,
          )
          if (!existencia) {
            existencia = Existencia.crear({
              id: this.deps.ids.generate(),
              productoId: linea.productoId,
              almacenId: transferencia.almacenDestinoId,
              saldo: 0,
              version: 1,
            })
          }

          const producto = await this.deps.productos.getById(linea.productoId)
          const engineResult = this.deps.engine.registrarEntrada(
            {
              existencia,
              expectedVersion: existencia.version.value,
              cantidad: rec.cantidadRecibida,
              tipoMovimiento: 'transferencia_entrada',
              documento: DocumentoOrigenRef.of(
                'transferencia',
                transferencia.id,
                linea.id,
              ),
              usuarioId: input.actorId,
              idempotencyKey: `${input.idempotencyKey}:linea:${linea.id}`,
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

        await this.deps.transferencias.save(transferencia)
        const value = {
          id: transferencia.id,
          estado: transferencia.estado,
          version: transferencia.version,
        }
        await this.deps.idempotency.save({
          key: input.idempotencyKey,
          tipoOperacion: 'recibir_transferencia',
          documentoTipo: 'transferencia',
          documentoId: transferencia.id,
          resultado: value,
          fechaRegistro: this.deps.clock.now(),
        })
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'TransferenciaRecibida',
          aggregateType: 'Transferencia',
          aggregateId: transferencia.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async solicitarTransferencia(input: {
    transferenciaId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const transferencia = await this.deps.transferencias.getById(input.transferenciaId)
        if (!transferencia) {
          return fail('NOT_FOUND', 'Transferencia no encontrada.')
        }
        transferencia.solicitar(input.expectedVersion)
        await this.deps.transferencias.save(transferencia)
        const value = {
          id: transferencia.id,
          estado: transferencia.estado,
          version: transferencia.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'TransferenciaSolicitada',
          aggregateType: 'Transferencia',
          aggregateId: transferencia.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async cancelarTransferencia(input: {
    transferenciaId: string
    expectedVersion: number
  }): Promise<ApplicationResult<{ id: string; estado: string; version: number }>> {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        const transferencia = await this.deps.transferencias.getById(input.transferenciaId)
        if (!transferencia) {
          return fail('NOT_FOUND', 'Transferencia no encontrada.')
        }
        transferencia.cancelar(input.expectedVersion)
        await this.deps.transferencias.save(transferencia)
        const value = {
          id: transferencia.id,
          estado: transferencia.estado,
          version: transferencia.version,
        }
        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'TransferenciaCancelada',
          aggregateType: 'Transferencia',
          aggregateId: transferencia.id,
          payload: value,
        })
        return ok(value)
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }

  async listarTransferencias(): Promise<ApplicationResult<TransferenciaProps[]>> {
    try {
      const items = await this.deps.transferencias.listAll()
      const props = items
        .map((t) => t.toProps())
        .sort((a, b) => b.id.localeCompare(a.id))
      return ok(props)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async getTransferencia(id: string): Promise<ApplicationResult<TransferenciaProps>> {
    try {
      const transferencia = await this.deps.transferencias.getById(id)
      if (!transferencia) {
        return fail('NOT_FOUND', 'Transferencia no encontrada.')
      }
      return ok(transferencia.toProps())
    } catch (error) {
      return mapDomainError(error)
    }
  }
}
