import { IUnitOfWork } from '../../application/ports/outbound'
import { InMemoryDatabaseAdapter } from './InMemoryDatabaseAdapter'

export class InMemoryUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly db: InMemoryDatabaseAdapter,
    /** Invocado tras un commit que efectivamente persiste al estado `committed` (transacción raíz). */
    private readonly onCommit?: () => void,
  ) {}

  async begin(): Promise<void> {
    this.db.begin()
  }

  async commit(): Promise<void> {
    this.db.commit()
    if (!this.db.isInTransaction()) {
      this.onCommit?.()
    }
  }

  async rollback(): Promise<void> {
    this.db.rollback()
  }
}
