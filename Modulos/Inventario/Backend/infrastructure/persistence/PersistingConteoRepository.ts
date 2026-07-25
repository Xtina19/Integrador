import { IConteoFisicoRepository } from '../../application/ports/outbound'
import { ConteoFisico } from '../../domain/aggregates/ConteoFisico'
import type { ConteoCreateMetadata } from '../../application/models/ConteoCreateMetadata'
import { InMemoryDatabaseAdapter } from './InMemoryDatabaseAdapter'
import { DurableConteoFileStore } from './DurableConteoFileStore'
import { DbConteoRepository } from './repositories'

/** Decorador: persiste conteos en disco tras cada mutación. */
export class PersistingConteoRepository implements IConteoFisicoRepository {
  private readonly inner: DbConteoRepository

  constructor(
    private readonly db: InMemoryDatabaseAdapter,
    private readonly store: DurableConteoFileStore,
  ) {
    this.inner = new DbConteoRepository(db)
  }

  getById(id: string) {
    return this.inner.getById(id)
  }
  listAll() {
    return this.inner.listAll()
  }
  existsSesionActivaConflictiva(almacenId: string, excludeId?: string) {
    return this.inner.existsSesionActivaConflictiva(almacenId, excludeId)
  }
  async save(conteo: ConteoFisico): Promise<void> {
    await this.inner.save(conteo)
    this.store.persistFrom(this.db)
  }
  async saveCreateMetadata(meta: ConteoCreateMetadata): Promise<void> {
    await this.inner.saveCreateMetadata(meta)
    this.store.persistFrom(this.db)
  }
  getCreateMetadata(conteoId: string) {
    return this.inner.getCreateMetadata(conteoId)
  }
  listCreateMetadata() {
    return this.inner.listCreateMetadata()
  }
  async appendAuditoria(entry: {
    id: string
    conteoId: string
    accion: string
    usuarioId: string
    resultado: 'OK' | 'RECHAZADO' | 'ERROR'
    detalle?: string
  }): Promise<void> {
    await this.inner.appendAuditoria(entry)
    this.store.persistFrom(this.db)
  }
}
