export {
  ApplicationResult,
  ok,
  fail,
  mapDomainError,
  withUnitOfWork,
} from './results/ApplicationResult'
export type { ApplicationFailureCode } from './results/ApplicationResult'

export * from './ports/outbound'

export { TransferenciaApplicationService } from './services/TransferenciaApplicationService'
export { DescarteApplicationService } from './services/DescarteApplicationService'
export { ConteoApplicationService } from './services/ConteoApplicationService'
export { AjusteApplicationService } from './services/AjusteApplicationService'
export { InventoryQueryService, ALMACEN_NOMBRES, nombreAlmacen } from './services/InventoryQueryService'
export { CreateConteoHandler } from './handlers/CreateConteoHandler'
export type { CreateConteoCommand } from './commands/CreateConteoCommand'
export { CreateDescarteHandler } from './handlers/CreateDescarteHandler'
export type { CreateDescarteCommand } from './commands/CreateDescarteCommand'
