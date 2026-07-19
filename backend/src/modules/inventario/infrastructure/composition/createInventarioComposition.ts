import type {
  IAlmacenRepository,
  IClock,
  IConteoFisicoRepository,
  IExistenciaRepository,
  IIdGenerator,
  IIdempotencyRepository,
  IProductoReadPort,
  IUnitOfWork,
  PersistEngineResultPorts,
} from '../../application/ports/outbound'
import { InventoryEngine } from '../../domain/services/InventoryEngine'
import { TransferenciaApplicationService } from '../../application/services/TransferenciaApplicationService'
import { DescarteApplicationService } from '../../application/services/DescarteApplicationService'
import { ConteoApplicationService } from '../../application/services/ConteoApplicationService'
import { AjusteApplicationService } from '../../application/services/AjusteApplicationService'
import { InventoryQueryService } from '../../application/services/InventoryQueryService'
import { SystemClockAdapter, FixedClockAdapter } from '../adapters/ClockAdapter'
import { SequentialIdGenerator, UuidIdGenerator } from '../adapters/IdGeneratorAdapter'
import { InMemoryAuthorizationAdapter } from '../adapters/AuthorizationAdapter'
import {
  InMemoryEventPublisher,
  OutboxProcessor,
} from '../adapters/EventPublisherAdapter'
import { InMemoryDatabaseAdapter } from '../persistence/InMemoryDatabaseAdapter'
import { InMemoryUnitOfWork } from '../persistence/InMemoryUnitOfWork'
import { DurableConteoFileStore } from '../persistence/DurableConteoFileStore'
import { DurableInventorySnapshotStore } from '../persistence/DurableInventorySnapshotStore'
import { PersistingConteoRepository } from '../persistence/PersistingConteoRepository'
import {
  DbAlmacenRepository,
  DbAjusteRepository,
  DbAuditoriaRepository,
  DbConteoRepository,
  DbDescarteRepository,
  DbExistenciaRepository,
  DbIdempotencyRepository,
  DbKardexRepository,
  DbMovimientoRepository,
  DbOutboxRepository,
  DbProductoReadAdapter,
  DbTransferenciaRepository,
} from '../persistence/repositories'
import { CreateConteoHandler } from '../../application/handlers/CreateConteoHandler'
import { CreateDescarteHandler } from '../../application/handlers/CreateDescarteHandler'
import { DurableDescarteCreateStore } from '../persistence/DurableDescarteCreateStore'
import { InMemoryDescarteCreateStore } from '../../application/testing/InMemoryDescarteCreateStore'
import { StructuredLogger, rootLogger } from '../observability/StructuredLogger'
import { MetricsRegistry, metricsRegistry } from '../observability/MetricsRegistry'
import { seedInventarioJoselito } from './seedJoselito'
import { ensureVentasStockCatalog } from './ensureVentasStockCatalog'

/** Superficie mínima para ACL de módulos externos (p. ej. Ventas) hacia el Engine. */
export interface InventarioEngineBridge {
  engine: InventoryEngine
  uow: IUnitOfWork
  existencias: IExistenciaRepository
  almacenes: IAlmacenRepository
  productos: IProductoReadPort
  idempotency: IIdempotencyRepository
  clock: IClock
  ids: IIdGenerator
  persistPorts: PersistEngineResultPorts
  queryService: InventoryQueryService
}

export interface InventarioComposition {
  db: InMemoryDatabaseAdapter
  uow: InMemoryUnitOfWork
  outbox: DbOutboxRepository
  publisher: InMemoryEventPublisher
  outboxProcessor: OutboxProcessor
  auth: InMemoryAuthorizationAdapter
  logger: StructuredLogger
  metrics: MetricsRegistry
  transferenciaService: TransferenciaApplicationService
  descarteService: DescarteApplicationService
  createDescarteHandler: CreateDescarteHandler
  descarteCreateStore: DurableDescarteCreateStore | InMemoryDescarteCreateStore
  conteoService: ConteoApplicationService
  createConteoHandler: CreateConteoHandler
  ajusteService: AjusteApplicationService
  queryService: InventoryQueryService
  existencias: DbExistenciaRepository
  almacenes: DbAlmacenRepository
  movimientos: DbMovimientoRepository
  transferencias: DbTransferenciaRepository
  ajustes: DbAjusteRepository
  descartes: DbDescarteRepository
  conteos: IConteoFisicoRepository
  kardex: DbKardexRepository
  auditorias: DbAuditoriaRepository
  productos: DbProductoReadAdapter
  snapshotStore: DurableInventorySnapshotStore | null
  /** Puente hacia el Inventory Engine para BC consumidores (Ventas). */
  engineBridge: InventarioEngineBridge
}

export function createInventarioComposition(options?: {
  fixedClock?: Date
  sequentialIds?: boolean
  durableConteo?: boolean
  durableDescarte?: boolean
  /** Snapshot durable de todas las tablas. Default: sigue a `durableConteo`. */
  durableSnapshot?: boolean
  logger?: StructuredLogger
  metrics?: MetricsRegistry
}): InventarioComposition {
  const logger = options?.logger ?? rootLogger
  const metrics = options?.metrics ?? metricsRegistry
  const db = new InMemoryDatabaseAdapter()
  const durable = options?.durableConteo === true
  const durableDescarte = options?.durableDescarte === true || durable
  const durableSnapshot = options?.durableSnapshot ?? durable
  const conteoStore = durable ? new DurableConteoFileStore() : null
  const snapshotStore = durableSnapshot ? new DurableInventorySnapshotStore() : null
  // El snapshot general carga primero (cobertura amplia); los stores específicos
  // de conteo/descarte cargan después y prevalecen para sus propias tablas.
  if (snapshotStore) {
    snapshotStore.loadInto(db)
  }
  if (conteoStore) {
    conteoStore.loadInto(db)
  }
  const descarteCreateStore = durableDescarte
    ? new DurableDescarteCreateStore(db)
    : new InMemoryDescarteCreateStore()
  const uow = new InMemoryUnitOfWork(db, snapshotStore ? () => snapshotStore.persistFrom(db) : undefined)
  const clock = options?.fixedClock
    ? new FixedClockAdapter(options.fixedClock)
    : new SystemClockAdapter()
  const ids = options?.sequentialIds
    ? new SequentialIdGenerator()
    : new UuidIdGenerator()
  const outbox = new DbOutboxRepository(db)
  const publisher = new InMemoryEventPublisher()
  const outboxProcessor = new OutboxProcessor(outbox, publisher, {
    logger,
    metrics,
  })
  const auth = new InMemoryAuthorizationAdapter()

  const transferencias = new DbTransferenciaRepository(db)
  const descartes = new DbDescarteRepository(db)
  const ajustes = new DbAjusteRepository(db)
  const conteos = conteoStore
    ? new PersistingConteoRepository(db, conteoStore)
    : new DbConteoRepository(db)
  const existencias = new DbExistenciaRepository(db)
  const almacenes = new DbAlmacenRepository(db)
  const productos = new DbProductoReadAdapter(db)
  const movimientos = new DbMovimientoRepository(db)
  const kardex = new DbKardexRepository(db)
  const auditorias = new DbAuditoriaRepository(db)
  const idempotency = new DbIdempotencyRepository(db)
  const engine = new InventoryEngine()

  const persistPorts = {
    existencias,
    movimientos,
    kardex,
    auditorias,
    outbox,
    ids,
  }

  const transferenciaService = new TransferenciaApplicationService({
    uow,
    transferencias,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
  })

  const descarteService = new DescarteApplicationService({
    uow,
    descartes,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
    createStore: descarteCreateStore,
  })

  const createDescarteHandler = new CreateDescarteHandler({
    uow,
    descartes,
    store: descarteCreateStore,
    almacenes,
    existencias,
    outbox,
    clock,
    ids,
  })

  const conteoService = new ConteoApplicationService({
    uow,
    conteos,
    existencias,
    almacenes,
    outbox,
    clock,
    ids,
  })
  const createConteoHandler = new CreateConteoHandler(conteoService)

  const ajusteService = new AjusteApplicationService({
    uow,
    ajustes,
    conteos,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
  })

  const queryService = new InventoryQueryService(db)

  const engineBridge: InventarioEngineBridge = {
    engine,
    uow,
    existencias,
    almacenes,
    productos,
    idempotency,
    clock,
    ids,
    persistPorts,
    queryService,
  }

  return {
    db,
    uow,
    outbox,
    publisher,
    outboxProcessor,
    auth,
    logger,
    metrics,
    transferenciaService,
    descarteService,
    createDescarteHandler,
    descarteCreateStore,
    conteoService,
    createConteoHandler,
    ajusteService,
    queryService,
    existencias,
    almacenes,
    movimientos,
    transferencias,
    ajustes,
    descartes,
    conteos,
    kardex,
    auditorias,
    productos,
    snapshotStore,
    engineBridge,
  }
}

export function seedInventarioBasico(db: InMemoryDatabaseAdapter): void {
  db.seedProducto({ id: 'prod-1', activo: true, costoReferencia: 100 })
  db.seedAlmacen({ id: 'alm-a', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'alm-b', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'central', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'suc-1', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'suc-2', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'suc-3', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'suc-4', bloqueadoPorConteo: false })
  db.seedAlmacen({ id: 'suc-5', bloqueadoPorConteo: false })
  db.seedExistencia({
    id: 'ex-a',
    productoId: 'prod-1',
    almacenId: 'alm-a',
    saldo: 20,
    version: 1,
  })
}

/** Semilla operativa para API montada en servidor (almacenes = sucursales del frontend). */
export function seedInventarioOperativo(db: InMemoryDatabaseAdapter): void {
  seedInventarioBasico(db)
  const almacenes = ['central', 'suc-1', 'suc-2', 'suc-3', 'suc-4', 'suc-5']
  for (const id of almacenes) {
    db.seedAlmacen({ id, bloqueadoPorConteo: false })
  }
}

/**
 * Semilla operativa extendida ("Joselito"): almacenes/mínimos + catálogo rico de
 * productos, existencias por sucursal y documentos de ejemplo (transferencias,
 * ajustes, descartes, conteos, movimientos, auditorías). Pensada para el servidor
 * montado (mountInventarioModule) y para exploración manual/QA.
 */
export function seedInventarioJoselitoCompleto(composition: InventarioComposition): void {
  // Si ya hay productos (p. ej. restaurados desde el snapshot durable), no se
  // reinicia el catálogo/documentos para no pisar operaciones reales previas.
  // OJO: este chequeo debe ocurrir ANTES de seedInventarioOperativo, que ya
  // siembra `prod-1` incondicionalmente.
  if (composition.db.tables.productos.size === 0) {
    seedInventarioOperativo(composition.db)
    seedInventarioJoselito({
      db: composition.db,
      transferencias: composition.transferencias,
      ajustes: composition.ajustes,
      descartes: composition.descartes,
      conteos: composition.conteos,
      movimientos: composition.movimientos,
      kardex: composition.kardex,
      auditorias: composition.auditorias,
    })
  }
  // Siempre alinea el catálogo vendible de Ventas con el Engine (idempotente).
  ensureVentasStockCatalog(composition.db)
}
