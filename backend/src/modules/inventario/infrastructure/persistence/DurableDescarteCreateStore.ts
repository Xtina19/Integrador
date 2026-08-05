import fs from 'node:fs'
import path from 'node:path'
import { Descarte } from '../../domain/aggregates/Descarte'
import type { DescarteCreateMetadata, DescarteListItem } from '../../application/models/DescarteCreateMetadata'
import type { IDescarteCreateStore } from '../../application/ports/descarteCreateStore'
import { InMemoryDatabaseAdapter } from './InMemoryDatabaseAdapter'

/**
 * Persistencia durable del caso Crear Descarte.
 * Espejo de descarte_sesion / descarte_detalle / descarte_evidencia / descarte_aprobacion.
 */
export class DurableDescarteCreateStore implements IDescarteCreateStore {
  private readonly filePath: string
  private metadata = new Map<string, DescarteCreateMetadata>()

  constructor(
    private readonly db: InMemoryDatabaseAdapter,
    baseDir = path.join(process.cwd(), 'data', 'inventario'),
  ) {
    this.filePath = path.join(baseDir, 'descarte_store.json')
    this.load()
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) return
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as {
        descartes?: Record<string, Record<string, unknown>>
        metadata?: Record<string, DescarteCreateMetadata>
      }
      for (const [id, row] of Object.entries(raw.descartes ?? {})) {
        this.db.tables.descartes.set(id, row)
      }
      for (const [id, meta] of Object.entries(raw.metadata ?? {})) {
        this.metadata.set(id, meta)
      }
    } catch {
      /* archivo corrupto → vacío */
    }
  }

  private persist(): void {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(
        {
          descartes: Object.fromEntries(this.db.tables.descartes.entries()),
          metadata: Object.fromEntries(this.metadata.entries()),
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    )
  }

  async saveAggregate(descarte: Descarte): Promise<void> {
    this.db.tables.descartes.set(
      descarte.id,
      descarte.toProps() as unknown as Record<string, unknown>,
    )
    this.persist()
  }

  async getAggregate(id: string): Promise<Descarte | null> {
    const row = this.db.tables.descartes.get(id)
    if (!row) return null
    return Descarte.rehidratar(row as unknown as ReturnType<Descarte['toProps']>)
  }

  async listAggregates(): Promise<Descarte[]> {
    return [...this.db.tables.descartes.values()].map((row) =>
      Descarte.rehidratar(row as unknown as ReturnType<Descarte['toProps']>),
    )
  }

  async saveMetadata(meta: DescarteCreateMetadata): Promise<void> {
    this.metadata.set(meta.descarteId, meta)
    this.persist()
  }

  async getMetadata(descarteId: string): Promise<DescarteCreateMetadata | null> {
    return this.metadata.get(descarteId) ?? null
  }

  async listMetadata(): Promise<DescarteCreateMetadata[]> {
    return [...this.metadata.values()]
  }

  async updateEstado(id: string, estado: string, _version: number): Promise<void> {
    const meta = this.metadata.get(id)
    if (meta) {
      this.metadata.set(id, {
        ...meta,
        aprobacion: {
          ...meta.aprobacion,
          estado: estado as DescarteCreateMetadata['aprobacion']['estado'],
        },
        updatedAt: new Date().toISOString(),
      })
    }
    this.persist()
  }

  async addEvidencia(
    descarteId: string,
    evidencia: DescarteCreateMetadata['evidencias'][number],
  ): Promise<DescarteCreateMetadata | null> {
    const meta = this.metadata.get(descarteId)
    if (!meta) return null
    const next: DescarteCreateMetadata = {
      ...meta,
      evidencias: [...meta.evidencias, evidencia],
      updatedAt: new Date().toISOString(),
    }
    this.metadata.set(descarteId, next)
    this.persist()
    return next
  }

  async listItems(): Promise<DescarteListItem[]> {
    const items: DescarteListItem[] = []
    for (const meta of this.metadata.values()) {
      const agg = await this.getAggregate(meta.descarteId)
      items.push({
        id: meta.descarteId,
        codigo: meta.codigo,
        fecha: meta.fecha,
        almacenId: meta.almacenId,
        sucursalId: meta.sucursalId,
        estado: agg?.estado ?? 'borrador',
        motivoCodigo: meta.motivoCodigo,
        motivoDescripcion: meta.motivoDescripcion,
        responsableNombre: meta.responsableNombre,
        cantidadTotal: meta.lineas.reduce((s, l) => s + l.cantidad, 0),
        productosResumen: meta.lineas
          .map((l) => `${l.titulo ?? l.productoId} × ${l.cantidad}`)
          .slice(0, 3)
          .join(', '),
        evidenciaCount: meta.evidencias.length,
        requiereAprobacion: meta.requiereAprobacion,
        version: agg?.version ?? 1,
      })
    }
    return items.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.codigo.localeCompare(a.codigo))
  }
}
