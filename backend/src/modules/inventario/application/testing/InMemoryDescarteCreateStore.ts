import { Descarte } from '../../domain/aggregates/Descarte'
import type { DescarteCreateMetadata, DescarteListItem } from '../../application/models/DescarteCreateMetadata'
import type { IDescarteCreateStore } from '../../application/ports/descarteCreateStore'

/** Store en memoria para tests (sin disco). */
export class InMemoryDescarteCreateStore implements IDescarteCreateStore {
  private readonly aggregates = new Map<string, Descarte>()
  private readonly metadata = new Map<string, DescarteCreateMetadata>()

  async saveAggregate(descarte: Descarte): Promise<void> {
    this.aggregates.set(descarte.id, Descarte.rehidratar(descarte.toProps()))
  }

  async getAggregate(id: string): Promise<Descarte | null> {
    const found = this.aggregates.get(id)
    return found ? Descarte.rehidratar(found.toProps()) : null
  }

  async listAggregates(): Promise<Descarte[]> {
    return [...this.aggregates.values()].map((d) => Descarte.rehidratar(d.toProps()))
  }

  async saveMetadata(meta: DescarteCreateMetadata): Promise<void> {
    this.metadata.set(meta.descarteId, meta)
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
    return next
  }

  async listItems(): Promise<DescarteListItem[]> {
    return [...this.metadata.values()].map((meta) => {
      const agg = this.aggregates.get(meta.descarteId)
      return {
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
      }
    })
  }
}
