import fs from 'node:fs'
import path from 'node:path'
import { InMemoryDatabaseAdapter } from './InMemoryDatabaseAdapter'

/**
 * Persistencia durable alineada a las tablas de dominio:
 * conteo_fisico_sesion / conteo_alcance_producto / snapshot_conteo / linea_conteo / auditoria.
 * Escribe JSON transaccional en disco (espejo relacional) sin alterar el Engine ni el Dominio.
 */
export class DurableConteoFileStore {
  private readonly filePath: string

  constructor(baseDir = path.join(process.cwd(), 'data', 'inventario')) {
    this.filePath = path.join(baseDir, 'conteo_fisico_store.json')
  }

  loadInto(db: InMemoryDatabaseAdapter): void {
    if (!fs.existsSync(this.filePath)) return
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as {
        conteos?: Record<string, Record<string, unknown>>
        conteoMetadata?: Record<string, Record<string, unknown>>
        conteoAuditoria?: Record<string, Record<string, unknown>>
      }
      for (const [id, row] of Object.entries(raw.conteos ?? {})) {
        db.tables.conteos.set(id, row)
      }
      for (const [id, row] of Object.entries(raw.conteoMetadata ?? {})) {
        db.tables.conteoMetadata.set(id, row)
      }
      for (const [id, row] of Object.entries(raw.conteoAuditoria ?? {})) {
        db.tables.conteoAuditoria.set(id, row)
      }
    } catch {
      // Si el archivo está corrupto, se inicia vacío (sin inventar datos).
    }
  }

  persistFrom(db: InMemoryDatabaseAdapter): void {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    const payload = {
      conteos: Object.fromEntries(db.tables.conteos.entries()),
      conteoMetadata: Object.fromEntries(db.tables.conteoMetadata.entries()),
      conteoAuditoria: Object.fromEntries(db.tables.conteoAuditoria.entries()),
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf8')
  }
}
