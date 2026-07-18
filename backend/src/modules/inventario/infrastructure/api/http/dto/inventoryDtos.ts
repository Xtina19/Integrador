export interface CrearTransferenciaDto {
  codigo: string
  almacenOrigenId: string
  almacenDestinoId: string
  lineas: Array<{ productoId: string; cantidadSolicitada: number }>
  observacion?: string
  solicitar?: boolean
}

export interface DespacharTransferenciaDto {
  expectedVersion: number
  idempotencyKey: string
}

export interface RecibirTransferenciaDto {
  expectedVersion: number
  idempotencyKey: string
  recepciones: Array<{
    lineaId: string
    cantidadRecibida: number
    cantidadFaltante?: number
    cantidadDanada?: number
  }>
}

export interface CrearDescarteDto {
  codigo: string
  almacenId: string
  lineas: Array<{
    productoId: string
    cantidad: number
    motivoCodigo: string
    observacion?: string
  }>
  observacion?: string
}

export interface AprobarDocumentoDto {
  expectedVersion: number
}

export interface AplicarDocumentoDto {
  expectedVersion: number
  idempotencyKey: string
  permitirAlmacenBloqueadoPorConteoId?: string
}

export interface CrearConteoDto {
  codigo: string
  almacenId: string
  tipoConteo: 'general' | 'parcial' | 'ciclico' | 'extraordinario'
  descripcionAlcance: string
}

export interface AbrirConteoDto {
  expectedVersion: number
  productoIds?: string[]
}

export interface RegistrarLineaConteoDto {
  cantidadContada: number
  expectedVersion: number
}

export interface EnviarRevisionDto {
  expectedVersion: number
}

export interface ClasificarLineaDto {
  expectedVersion: number
  clasificacion: 'cuadra' | 'sobrante' | 'faltante' | 'dano' | 'investigacion'
  regularizacion?: { tipo: 'ajuste' | 'descarte'; id: string }
}

export interface CrearAjusteDto {
  codigo: string
  almacenId: string
  tipoAjuste: 'positivo' | 'negativo' | 'digitacion' | 'conteo' | 'error_documental'
  lineas: Array<{
    productoId: string
    cantidadObjetivo: number
    diferencia: number
    motivoCodigo?: string
    lineaConteoId?: string
    observacion?: string
  }>
  observacion?: string
  solicitar?: boolean
}
