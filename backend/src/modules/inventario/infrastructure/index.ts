export { InMemoryDatabaseAdapter } from './persistence/InMemoryDatabaseAdapter'
export { InMemoryUnitOfWork } from './persistence/InMemoryUnitOfWork'
export * from './persistence/repositories'
export * from './adapters/ClockAdapter'
export * from './adapters/IdGeneratorAdapter'
export * from './adapters/AuthorizationAdapter'
export * from './adapters/EventPublisherAdapter'
export {
  createInventarioComposition,
  seedInventarioBasico,
  seedInventarioOperativo,
  seedInventarioJoselitoCompleto,
} from './composition/createInventarioComposition'
export { seedInventarioJoselito } from './composition/seedJoselito'
export { DurableInventorySnapshotStore } from './persistence/DurableInventorySnapshotStore'
export { createInventarioHttpApp } from './api/http/createInventarioHttpApp'
export { StructuredLogger, rootLogger } from './observability/StructuredLogger'
export { MetricsRegistry, metricsRegistry } from './observability/MetricsRegistry'
export { inventarioOpenApiDocument } from './api/openapi/inventarioOpenApi'
