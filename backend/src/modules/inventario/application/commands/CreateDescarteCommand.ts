export type MotivoDescarteCodigo =
  | 'DANO_FISICO'
  | 'DONACION'
  | 'PERDIDA'
  | 'ROBO'
  | 'ERROR_RECEPCION'
  | 'PRODUCTO_DEFECTUOSO'
  | 'CADUCIDAD'
  | 'OTRO'

export interface CreateDescarteLineaCommand {
  productoId: string
  isbn?: string
  titulo?: string
  existenciaActual: number
  cantidad: number
  costo: number
  motivoEspecifico?: string
  observacion?: string
}

export interface CreateDescarteEvidenciaCommand {
  tipo: 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'
  nombreArchivo?: string
  urlReferencia?: string
  comentario?: string
}

/**
 * Command: Crear Descarte.
 * No muta stock. No invoca Inventory Engine.
 * No modifica DescarteApplicationService existente.
 */
export interface CreateDescarteCommand {
  codigo?: string
  fecha: string
  sucursalId: string
  almacenId: string
  responsableId: string
  responsableNombre?: string
  observaciones?: string
  motivoCodigo: MotivoDescarteCodigo
  motivoDescripcion?: string
  lineas: CreateDescarteLineaCommand[]
  evidencias: CreateDescarteEvidenciaCommand[]
  requiereAprobacion: boolean
  supervisorId?: string
  supervisorNombre?: string
  createdBy: string
}
