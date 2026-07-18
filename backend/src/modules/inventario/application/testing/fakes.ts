import { Ajuste } from '../../domain/aggregates/Ajuste'
import { ConteoFisico } from '../../domain/aggregates/ConteoFisico'
import { Descarte } from '../../domain/aggregates/Descarte'
import { Transferencia } from '../../domain/aggregates/Transferencia'
import { AuditoriaMovimiento } from '../../domain/entities/AuditoriaMovimiento'
import { Existencia } from '../../domain/entities/Existencia'
import { Kardex } from '../../domain/entities/Kardex'
import { MovimientoInventario } from '../../domain/entities/MovimientoInventario'
import {
  AlmacenSnapshot,
  IAlmacenRepository,
  IAjusteRepository,
  IAuditoriaInventarioRepository,
  IClock,
  IConteoFisicoRepository,
  IDescarteRepository,
  IExistenciaRepository,
  IIdGenerator,
  IIdempotencyRepository,
  IKardexRepository,
  IMovimientoInventarioRepository,
  IOutbox,
  IProductoReadPort,
  ITransferenciaRepository,
  IUnitOfWork,
  IdempotencyRecord,
  OutboxMessage,
  PersistEngineResultPorts,
  ProductoSnapshot,
} from '../ports/outbound'

export class FakeUnitOfWork implements IUnitOfWork {
  began = false
  committed = false
  rolledBack = false

  async begin(): Promise<void> {
    this.began = true
    this.committed = false
    this.rolledBack = false
  }

  async commit(): Promise<void> {
    this.committed = true
  }

  async rollback(): Promise<void> {
    this.rolledBack = true
  }
}

export class FakeIdGenerator implements IIdGenerator {
  private n = 0
  generate(): string {
    this.n += 1
    return `id-${this.n}`
  }
}

export class FakeClock implements IClock {
  constructor(private readonly fixed = new Date('2026-07-18T15:00:00.000Z')) {}
  now(): Date {
    return this.fixed
  }
}

export class FakeOutbox implements IOutbox {
  messages: OutboxMessage[] = []
  async add(message: OutboxMessage): Promise<void> {
    this.messages.push(message)
  }
}

export class FakeIdempotencyRepository implements IIdempotencyRepository {
  private readonly store = new Map<string, IdempotencyRecord>()
  async get(key: string): Promise<IdempotencyRecord | null> {
    return this.store.get(key) ?? null
  }
  async save(record: IdempotencyRecord): Promise<void> {
    this.store.set(record.key, record)
  }
}

export class FakeTransferenciaRepository implements ITransferenciaRepository {
  private readonly store = new Map<string, Transferencia>()
  async getById(id: string): Promise<Transferencia | null> {
    const found = this.store.get(id)
    return found ? Transferencia.rehidratar(found.toProps()) : null
  }
  async save(transferencia: Transferencia): Promise<void> {
    this.store.set(transferencia.id, Transferencia.rehidratar(transferencia.toProps()))
  }
  async listAll(): Promise<Transferencia[]> {
    return [...this.store.values()].map((t) => Transferencia.rehidratar(t.toProps()))
  }
}

export class FakeDescarteRepository implements IDescarteRepository {
  private readonly store = new Map<string, Descarte>()
  async getById(id: string): Promise<Descarte | null> {
    const found = this.store.get(id)
    return found ? Descarte.rehidratar(found.toProps()) : null
  }
  async save(descarte: Descarte): Promise<void> {
    this.store.set(descarte.id, Descarte.rehidratar(descarte.toProps()))
  }
  async listAll(): Promise<Descarte[]> {
    return [...this.store.values()].map((d) => Descarte.rehidratar(d.toProps()))
  }
}

export class FakeAjusteRepository implements IAjusteRepository {
  private readonly store = new Map<string, Ajuste>()
  async getById(id: string): Promise<Ajuste | null> {
    const found = this.store.get(id)
    return found ? Ajuste.rehidratar(found.toProps()) : null
  }
  async save(ajuste: Ajuste): Promise<void> {
    this.store.set(ajuste.id, Ajuste.rehidratar(ajuste.toProps()))
  }
  async listAll(): Promise<Ajuste[]> {
    return [...this.store.values()].map((a) => Ajuste.rehidratar(a.toProps()))
  }
}

export class FakeConteoRepository implements IConteoFisicoRepository {
  private readonly store = new Map<string, ConteoFisico>()
  private readonly metadata = new Map<string, import('../models/ConteoCreateMetadata').ConteoCreateMetadata>()
  private readonly auditoria: Array<Record<string, unknown>> = []

  async getById(id: string): Promise<ConteoFisico | null> {
    const found = this.store.get(id)
    return found ? ConteoFisico.rehidratar(found.toProps()) : null
  }
  async listAll(): Promise<ConteoFisico[]> {
    return [...this.store.values()].map((c) => ConteoFisico.rehidratar(c.toProps()))
  }
  async existsSesionActivaConflictiva(
    almacenId: string,
    excludeId?: string,
  ): Promise<boolean> {
    for (const conteo of this.store.values()) {
      if (conteo.id === excludeId) continue
      if (conteo.almacenId !== almacenId) continue
      if (
        conteo.estado === 'abierto' ||
        conteo.estado === 'en_conteo' ||
        conteo.estado === 'en_revision'
      ) {
        return true
      }
    }
    return false
  }
  async save(conteo: ConteoFisico): Promise<void> {
    this.store.set(conteo.id, ConteoFisico.rehidratar(conteo.toProps()))
  }
  async saveCreateMetadata(
    meta: import('../models/ConteoCreateMetadata').ConteoCreateMetadata,
  ): Promise<void> {
    this.metadata.set(meta.conteoId, meta)
  }
  async getCreateMetadata(
    conteoId: string,
  ): Promise<import('../models/ConteoCreateMetadata').ConteoCreateMetadata | null> {
    return this.metadata.get(conteoId) ?? null
  }
  async listCreateMetadata(): Promise<
    import('../models/ConteoCreateMetadata').ConteoCreateMetadata[]
  > {
    return [...this.metadata.values()]
  }
  async appendAuditoria(entry: {
    id: string
    conteoId: string
    accion: string
    usuarioId: string
    resultado: 'OK' | 'RECHAZADO' | 'ERROR'
    detalle?: string
  }): Promise<void> {
    this.auditoria.push(entry)
  }
}

export class FakeExistenciaRepository implements IExistenciaRepository {
  private readonly store = new Map<string, Existencia>()
  private key(productoId: string, almacenId: string): string {
    return `${productoId}::${almacenId}`
  }
  async get(productoId: string, almacenId: string): Promise<Existencia | null> {
    const found = this.store.get(this.key(productoId, almacenId))
    return found ? Existencia.crear(found.toSnapshot()) : null
  }
  async listByAlmacen(almacenId: string): Promise<Existencia[]> {
    return [...this.store.values()]
      .filter((e) => e.almacenId === almacenId)
      .map((e) => Existencia.crear(e.toSnapshot()))
  }
  async save(existencia: Existencia): Promise<void> {
    this.store.set(
      this.key(existencia.productoId, existencia.almacenId),
      Existencia.crear(existencia.toSnapshot()),
    )
  }
  seed(existencia: Existencia): void {
    this.store.set(
      this.key(existencia.productoId, existencia.almacenId),
      Existencia.crear(existencia.toSnapshot()),
    )
  }
}

export class FakeMovimientoRepository implements IMovimientoInventarioRepository {
  items: MovimientoInventario[] = []
  async add(movimiento: MovimientoInventario): Promise<void> {
    this.items.push(movimiento)
  }
}

export class FakeKardexRepository implements IKardexRepository {
  items: Kardex[] = []
  async add(kardex: Kardex): Promise<void> {
    this.items.push(kardex)
  }
}

export class FakeAuditoriaRepository implements IAuditoriaInventarioRepository {
  items: AuditoriaMovimiento[] = []
  async add(auditoria: AuditoriaMovimiento): Promise<void> {
    this.items.push(auditoria)
  }
}

export class FakeAlmacenRepository implements IAlmacenRepository {
  private readonly store = new Map<string, AlmacenSnapshot>()
  seed(almacen: AlmacenSnapshot): void {
    this.store.set(almacen.id, { ...almacen })
  }
  async getById(id: string): Promise<AlmacenSnapshot | null> {
    const found = this.store.get(id)
    return found ? { ...found } : null
  }
  async updateBloqueo(
    almacenId: string,
    bloqueado: boolean,
    conteoBloqueanteId?: string,
  ): Promise<void> {
    const current = this.store.get(almacenId)
    if (!current) return
    this.store.set(almacenId, {
      ...current,
      bloqueadoPorConteo: bloqueado,
      conteoBloqueanteId: bloqueado ? conteoBloqueanteId : undefined,
    })
  }
}

export class FakeProductoReadPort implements IProductoReadPort {
  private readonly store = new Map<string, ProductoSnapshot>()
  seed(producto: ProductoSnapshot): void {
    this.store.set(producto.id, producto)
  }
  async getById(id: string): Promise<ProductoSnapshot | null> {
    return this.store.get(id) ?? null
  }
}

export function createPersistPorts(parts: {
  existencias: IExistenciaRepository
  movimientos: IMovimientoInventarioRepository
  kardex: IKardexRepository
  auditorias: IAuditoriaInventarioRepository
  outbox: IOutbox
  ids: IIdGenerator
}): PersistEngineResultPorts {
  return parts
}
