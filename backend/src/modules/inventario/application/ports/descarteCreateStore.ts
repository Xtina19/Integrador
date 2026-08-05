import { Descarte } from '../../domain/aggregates/Descarte'
import type { DescarteCreateMetadata, DescarteListItem } from '../models/DescarteCreateMetadata'

/**
 * Puerto de persistencia del caso Crear Descarte (metadatos + listado).
 * Separado de IDescarteRepository para no alterar el contrato usado por Application Services.
 */
export interface IDescarteCreateStore {
  saveAggregate(descarte: Descarte): Promise<void>
  getAggregate(id: string): Promise<Descarte | null>
  listAggregates(): Promise<Descarte[]>
  saveMetadata(meta: DescarteCreateMetadata): Promise<void>
  getMetadata(descarteId: string): Promise<DescarteCreateMetadata | null>
  listMetadata(): Promise<DescarteCreateMetadata[]>
  listItems(): Promise<DescarteListItem[]>
  /**
   * Sincroniza el estado en los metadatos (y persiste a disco si aplica) cuando
   * el agregado Descarte transiciona por fuera del flujo de creación (p. ej.
   * solicitar/rechazar/cancelar/revertir vía DescarteApplicationService).
   */
  updateEstado?(id: string, estado: string, version: number): Promise<void>
  /** Adjunta evidencia al documento en borrador (sin mover stock). */
  addEvidencia?(
    descarteId: string,
    evidencia: DescarteCreateMetadata['evidencias'][number],
  ): Promise<DescarteCreateMetadata | null>
}
