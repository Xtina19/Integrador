import type { TipoConteo } from '../../domain/aggregates/ConteoFisico'

export type AlcanceTipoConteo =
  | 'todo_almacen'
  | 'categoria'
  | 'editorial'
  | 'ubicacion'
  | 'productos'

export interface ProductoAlcanceConteo {
  productoId: string
  isbn?: string
  titulo?: string
  categoria?: string
  editorial?: string
  ubicacion?: string
  existenciaActual: number
  stockMinimo: number
}

/**
 * Command: Crear Conteo Físico.
 * No muta stock. No invoca Inventory Engine.
 */
export interface CreateConteoCommand {
  codigo?: string
  nombre: string
  tipoConteo: TipoConteo
  sucursalId: string
  almacenId: string
  alcanceTipo: AlcanceTipoConteo
  alcanceValor?: string
  fechaProgramada?: string
  horaProgramada?: string
  responsableId: string
  responsableNombre?: string
  observaciones?: string
  bloquearAlmacenAlAbrir: boolean
  permitirReconteo: boolean
  diferenciaMinimaReconteo: number
  productos: ProductoAlcanceConteo[]
  createdBy: string
}
