/** Metadatos de creación de conteo (fuera del agregado puro, capa aplicación/persistencia). */

import type { AlcanceTipoConteo, ProductoAlcanceConteo } from '../commands/CreateConteoCommand'

export interface ConteoCreateMetadata {
  conteoId: string
  nombre: string
  sucursalId: string
  alcanceTipo: AlcanceTipoConteo
  alcanceValor?: string
  fechaProgramada?: string
  horaProgramada?: string
  responsableNombre?: string
  observaciones?: string
  bloquearAlmacenAlAbrir: boolean
  permitirReconteo: boolean
  diferenciaMinimaReconteo: number
  fase: string
  productos: ProductoAlcanceConteo[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ConteoListItem {
  id: string
  codigo: string
  nombre: string
  almacenId: string
  sucursalId: string
  tipoConteo: string
  estado: string
  fase: string
  responsableId: string
  responsableNombre?: string
  productosAlcance: number
  diferencias: number
  bloqueoActivo: boolean
  fecha: string
  version: number
}
