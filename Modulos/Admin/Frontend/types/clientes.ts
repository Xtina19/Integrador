export type ClienteTipo = 'persona' | 'empresa' | 'colegio' | 'universidad' | 'institucion'

export type ClienteEstado = 'activo' | 'inactivo' | 'bloqueado'

export type ClienteDocumentoTipo = 'cedula' | 'rnc' | 'pasaporte' | 'ninguno'

export interface Cliente {
  id: string
  codigo: string
  nombre: string
  tipo: ClienteTipo
  documentoTipo: ClienteDocumentoTipo
  documento: string
  telefono: string
  correo: string
  institucion: string
  sucursalPreferidaId: string
  estado: ClienteEstado
  observaciones: string
  fechaAlta: string
  creadoPor: string
  actualizadoEn: string
  actualizadoPor: string
}

export interface ClienteInput {
  nombre: string
  tipo: ClienteTipo
  documentoTipo: ClienteDocumentoTipo
  documento: string
  telefono: string
  correo: string
  institucion: string
  sucursalPreferidaId: string
  estado: ClienteEstado
  observaciones: string
}

export interface ClienteFacturaResumen {
  id: string
  numero: string
  fecha: string
  sucursal: string
  total: number
  estado: string
}

export interface ClienteNotaCreditoResumen {
  id: string
  numero: string
  fecha: string
  facturaOrigen: string
  facturaOrigenId: string
  total: number
  estado: string
}

export interface ClienteCompraResumen {
  facturasCount: number
  notasCreditoCount: number
  totalComprado: number
  totalNc: number
  ultimaCompra: string | null
  sucursalFrecuente: string | null
}
