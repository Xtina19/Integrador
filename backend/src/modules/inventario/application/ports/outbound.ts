import { Ajuste } from '../../domain/aggregates/Ajuste'
import { ConteoFisico } from '../../domain/aggregates/ConteoFisico'
import { Descarte } from '../../domain/aggregates/Descarte'
import { Transferencia } from '../../domain/aggregates/Transferencia'
import { AuditoriaMovimiento } from '../../domain/entities/AuditoriaMovimiento'
import { Existencia } from '../../domain/entities/Existencia'
import { Kardex } from '../../domain/entities/Kardex'
import { MovimientoInventario } from '../../domain/entities/MovimientoInventario'
import { InventoryDomainEvent } from '../../domain/events/InventoryDomainEvents'
import { EngineResult } from '../../domain/services/InventoryEngine'
import type { ConteoCreateMetadata } from '../models/ConteoCreateMetadata'

export interface OutboxMessage {
  id: string
  eventName: string
  aggregateType: string
  aggregateId: string
  payload: Readonly<Record<string, unknown>>
  occurredAt: Date
}

export interface IdempotencyRecord {
  key: string
  tipoOperacion: string
  documentoTipo: string
  documentoId: string
  resultado: unknown
  fechaRegistro: Date
}

export interface AlmacenSnapshot {
  id: string
  bloqueadoPorConteo: boolean
  conteoBloqueanteId?: string
}

export interface ProductoSnapshot {
  id: string
  activo: boolean
  costoReferencia?: number
}

export interface IUnitOfWork {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ITransferenciaRepository {
  getById(id: string): Promise<Transferencia | null>
  save(transferencia: Transferencia): Promise<void>
  listAll(): Promise<Transferencia[]>
}

export interface IDescarteRepository {
  getById(id: string): Promise<Descarte | null>
  save(descarte: Descarte): Promise<void>
  listAll(): Promise<Descarte[]>
}

export interface IConteoFisicoRepository {
  getById(id: string): Promise<ConteoFisico | null>
  listAll(): Promise<ConteoFisico[]>
  existsSesionActivaConflictiva(almacenId: string, excludeId?: string): Promise<boolean>
  save(conteo: ConteoFisico): Promise<void>
  saveCreateMetadata(meta: ConteoCreateMetadata): Promise<void>
  getCreateMetadata(conteoId: string): Promise<ConteoCreateMetadata | null>
  listCreateMetadata(): Promise<ConteoCreateMetadata[]>
  appendAuditoria(entry: {
    id: string
    conteoId: string
    accion: string
    usuarioId: string
    resultado: 'OK' | 'RECHAZADO' | 'ERROR'
    detalle?: string
  }): Promise<void>
}

export interface IAjusteRepository {
  getById(id: string): Promise<Ajuste | null>
  save(ajuste: Ajuste): Promise<void>
  listAll(): Promise<Ajuste[]>
}

export interface IExistenciaRepository {
  get(productoId: string, almacenId: string): Promise<Existencia | null>
  listByAlmacen(almacenId: string): Promise<Existencia[]>
  save(existencia: Existencia): Promise<void>
}

export interface IMovimientoInventarioRepository {
  add(movimiento: MovimientoInventario): Promise<void>
}

export interface IKardexRepository {
  add(kardex: Kardex): Promise<void>
}

export interface IAuditoriaInventarioRepository {
  add(auditoria: AuditoriaMovimiento): Promise<void>
}

export interface IIdempotencyRepository {
  get(key: string): Promise<IdempotencyRecord | null>
  save(record: IdempotencyRecord): Promise<void>
}

export interface IOutbox {
  add(message: OutboxMessage): Promise<void>
}

export interface IAlmacenRepository {
  getById(id: string): Promise<AlmacenSnapshot | null>
  updateBloqueo(
    almacenId: string,
    bloqueado: boolean,
    conteoBloqueanteId?: string,
  ): Promise<void>
}

export interface IProductoReadPort {
  getById(id: string): Promise<ProductoSnapshot | null>
}

export interface IClock {
  now(): Date
}

export interface IIdGenerator {
  generate(): string
}

export interface PersistEngineResultPorts {
  existencias: IExistenciaRepository
  movimientos: IMovimientoInventarioRepository
  kardex: IKardexRepository
  auditorias: IAuditoriaInventarioRepository
  outbox: IOutbox
  ids: IIdGenerator
}

export async function persistEngineResult(
  ports: PersistEngineResultPorts,
  result: EngineResult,
): Promise<void> {
  if (result.replayed) {
    return
  }
  await ports.existencias.save(result.existencia)
  await ports.movimientos.add(result.movimiento)
  await ports.kardex.add(result.kardex)
  await ports.auditorias.add(result.auditoria)
  for (const event of result.events) {
    await ports.outbox.add({
      id: ports.ids.generate(),
      eventName: event.name,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload as unknown as Record<string, unknown>,
      occurredAt: event.occurredAt,
    })
  }
}

export async function publishApplicationEvent(
  outbox: IOutbox,
  ids: IIdGenerator,
  clock: IClock,
  event: {
    eventName: string
    aggregateType: string
    aggregateId: string
    payload: Readonly<Record<string, unknown>>
  },
): Promise<void> {
  await outbox.add({
    id: ids.generate(),
    eventName: event.eventName,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    payload: event.payload,
    occurredAt: clock.now(),
  })
}

/** Re-export for consumers that persist domain events already typed. */
export type { InventoryDomainEvent }
