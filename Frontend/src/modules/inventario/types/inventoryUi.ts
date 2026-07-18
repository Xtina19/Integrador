/** Tipos UI alineados al dominio aprobado de Inventario (solo frontend). */

export type InventoryTabId =
  | 'general'
  | 'movimientos'
  | 'transferencias'
  | 'conteos'
  | 'ajustes'
  | 'descartes'
  | 'kardex'
  | 'auditoria'

export type TransferenciaEstadoUi =
  | 'borrador'
  | 'solicitada'
  | 'en_transito'
  | 'recibida_parcial'
  | 'recibida'
  | 'cancelada'

export type DescarteEstadoUi =
  | 'borrador'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'
  | 'aplicado'
  | 'cancelado'
  | 'revertido'

export type DescarteMotivoUi =
  | 'dano'
  | 'donacion'
  | 'perdida'
  | 'robo'
  | 'error_recepcion'
  | 'otro'

export type ConteoEstadoUi =
  | 'borrador'
  | 'abierto'
  | 'en_conteo'
  | 'en_revision'
  | 'cerrado'
  | 'cancelado'

export type AjusteEstadoUi =
  | 'borrador'
  | 'solicitado'
  | 'aprobado'
  | 'rechazado'
  | 'aplicado'
  | 'cancelado'
  | 'revertido'

export type MovimientoTipoUi =
  | 'entrada'
  | 'salida'
  | 'transferencia_salida'
  | 'transferencia_entrada'
  | 'ajuste'
  | 'descarte'
  | 'compensacion'
  | 'venta'
  | 'recepcion'

export interface StockPorAlmacen {
  almacenId: string
  almacenNombre: string
  sucursal: string
  saldo: number
}

export interface ProductoInventarioVista {
  id: string
  isbn: string
  titulo: string
  autor: string
  categoria: string
  stockConsolidado: number
  stockMinimo: number
  porAlmacen: StockPorAlmacen[]
  transferenciasActivas: number
  conteosAbiertos: number
  ajustesPendientes: number
  descartesRelacionados: number
  ultimoMovimientoId?: string
  ultimoMovimientoFecha?: string
  ultimaAuditoriaFecha?: string
  estado: 'normal' | 'bajo' | 'agotado'
}

export interface MovimientoVista {
  id: string
  fecha: string
  tipo: MovimientoTipoUi
  productoId: string
  productoTitulo: string
  almacenId: string
  almacenNombre: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documentoTipo: 'transferencia' | 'descarte' | 'ajuste' | 'conteo' | 'venta' | 'recepcion' | 'compensacion'
  documentoId: string
  usuario: string
  sucursal: string
}

export interface TransferenciaVista {
  id: string
  codigo: string
  origen: string
  destino: string
  estado: TransferenciaEstadoUi
  fecha: string
  productoResumen: string
  cantidadTotal: number
  solicitante: string
  impactoDespacho?: string
  impactoRecepcion?: string
}

export interface DescarteVista {
  id: string
  codigo: string
  almacen: string
  estado: DescarteEstadoUi
  motivo: DescarteMotivoUi
  cantidad: number
  producto: string
  solicitante: string
  aprobador?: string
  evidencia: boolean
  impactoStock?: string
  fecha: string
}

export interface ConteoVista {
  id: string
  codigo: string
  almacen: string
  tipo: 'general' | 'parcial' | 'ciclico' | 'extraordinario'
  estado: ConteoEstadoUi
  faseVisible: string
  productosAlcance: number
  diferencias: number
  responsable: string
  fecha: string
  bloqueoActivo: boolean
}

export interface AjusteVista {
  id: string
  codigo: string
  almacen: string
  tipo: string
  estado: AjusteEstadoUi
  producto: string
  diferencia: number
  objetivo: number
  solicitante: string
  fecha: string
  historial: string[]
}

export interface KardexLineaVista {
  id: string
  fecha: string
  productoId: string
  productoTitulo: string
  isbn: string
  tipo: MovimientoTipoUi
  cantidad: number
  saldo: number
  documentoTipo: string
  documentoId: string
  usuario: string
  almacen: string
}

export interface AuditoriaInventarioVista {
  id: string
  fecha: string
  usuario: string
  accion: string
  documentoTipo: string
  documentoId: string
  ip: string
  resultado: 'OK' | 'RECHAZADO' | 'ERROR'
  detalle?: string
}

/** Solo estado global del inventario (nunca métricas de procesos). */
export interface InventoryDashboardKpis {
  stockTotal: number
  productosBajoStock: number
  productosSinStock: number
  almacenesBloqueados: number
  /** Null cuando aún no hay costeo / valor de referencia. */
  valorInventario: number | null
  ultimaActualizacion: string
}

export const TRANSFERENCIA_ESTADO_LABEL: Record<TransferenciaEstadoUi, string> = {
  borrador: 'Borrador',
  solicitada: 'Solicitada',
  en_transito: 'En tránsito',
  recibida_parcial: 'Recibida parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

export const DESCARTE_MOTIVO_LABEL: Record<DescarteMotivoUi, string> = {
  dano: 'Daño',
  donacion: 'Donación',
  perdida: 'Pérdida',
  robo: 'Robo',
  error_recepcion: 'Error de recepción',
  otro: 'Otros',
}

export const CONTEO_FASES = [
  'Crear',
  'Abrir',
  'Captura',
  'Reconteo',
  'Revisión',
  'Clasificación',
  'Regularización',
  'Cerrar',
] as const

export const MOVIMIENTO_TIPO_LABEL: Record<MovimientoTipoUi, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  transferencia_salida: 'Transferencia (salida)',
  transferencia_entrada: 'Transferencia (entrada)',
  ajuste: 'Ajuste',
  descarte: 'Descarte',
  compensacion: 'Compensación',
  venta: 'Venta',
  recepcion: 'Recepción',
}
