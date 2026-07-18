import fs from 'node:fs'
import path from 'node:path'
import { InMemoryDatabaseAdapter, InventoryDbTables } from './InMemoryDatabaseAdapter'

/**
 * Snapshot durable de TODAS las tablas del módulo Inventario (excepto idempotencia,
 * que es transitoria y se puede regenerar). Complementa a `DurableConteoFileStore` /
 * `DurableDescarteCreateStore` (específicos) con una foto completa para poder
 * recuperar el estado del proceso in-memory tras un reinicio.
 *
 * Se conecta mediante `InMemoryUnitOfWork.onCommit`, de forma que cada commit raíz
 * de una transacción (Application Service) dispare una escritura a disco.
 */
const TABLAS_PERSISTIDAS: ReadonlyArray<keyof InventoryDbTables> = [
  'productos',
  'almacenes',
  'existencias',
  'transferencias',
  'descartes',
  'ajustes',
  'conteos',
  'conteoMetadata',
  'conteoAuditoria',
  'movimientos',
  'kardex',
  'auditorias',
  'outbox',
]

export class DurableInventorySnapshotStore {
  private readonly filePath: string

  constructor(baseDir = path.join(process.cwd(), 'data', 'inventario')) {
    this.filePath = path.join(baseDir, 'inventario_snapshot.json')
  }

  loadInto(db: InMemoryDatabaseAdapter): void {
    if (!fs.existsSync(this.filePath)) return
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as Partial<
        Record<keyof InventoryDbTables, Record<string, unknown>>
      >
      for (const key of TABLAS_PERSISTIDAS) {
        const rows = raw[key]
        if (!rows) continue
        for (const [id, row] of Object.entries(rows)) {
          db.tables[key].set(id, row as Record<string, unknown>)
        }
      }
    } catch {
      // Snapshot corrupto o ilegible: se inicia vacío (sin inventar datos).
    }
  }

  persistFrom(db: InMemoryDatabaseAdapter): void {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    for (const key of TABLAS_PERSISTIDAS) {
      payload[key] = Object.fromEntries(db.tables[key].entries())
    }
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf8')
  }
}
