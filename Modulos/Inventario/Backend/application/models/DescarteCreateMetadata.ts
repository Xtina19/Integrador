import type {
  CreateDescarteEvidenciaCommand,
  CreateDescarteLineaCommand,
  MotivoDescarteCodigo,
} from '../commands/CreateDescarteCommand'

export interface DescarteCreateMetadata {
  descarteId: string
  codigo: string
  fecha: string
  sucursalId: string
  almacenId: string
  responsableId: string
  responsableNombre?: string
  motivoCodigo: MotivoDescarteCodigo
  motivoDescripcion?: string
  observaciones?: string
  lineas: CreateDescarteLineaCommand[]
  evidencias: Array<CreateDescarteEvidenciaCommand & { id: string }>
  requiereAprobacion: boolean
  aprobacion: {
    solicitanteId: string
    solicitanteNombre?: string
    supervisorId?: string
    supervisorNombre?: string
    estado: 'borrador' | 'solicitado' | 'aprobado' | 'rechazado' | 'aplicado' | 'revertido'
    fechaSolicitud?: string
  }
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface DescarteListItem {
  id: string
  codigo: string
  fecha: string
  almacenId: string
  sucursalId: string
  estado: string
  motivoCodigo: string
  motivoDescripcion?: string
  responsableNombre?: string
  cantidadTotal: number
  productosResumen: string
  evidenciaCount: number
  requiereAprobacion: boolean
  version: number
}
