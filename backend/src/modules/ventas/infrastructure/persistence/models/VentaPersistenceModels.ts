/**
 * Modelos de persistencia (independientes del dominio y del motor de BD).
 * Formato serializable / JSON-friendly — sin clases de dominio.
 */

export type DescuentoRecord =
  | { tipo: 'monto'; monto: number; moneda: string }
  | { tipo: 'porcentaje'; valor: number }

export interface VentaLineaRecord {
  id: string
  productoId: string
  descripcionSnapshot: string
  cantidad: number
  precioUnitario: number
  moneda: string
  descuento?: DescuentoRecord
  importeNeto: number
}

export interface PagoRecord {
  id: string
  formaPago: string
  monto: number
  moneda: string
  notaCreditoId?: string
  vuelto?: number
}

export interface LineaCambioRecord {
  productoId: string
  cantidad: number
  precioUnitario?: number
  descripcionSnapshot?: string
}

export interface CambioRecord {
  id: string
  fecha: string
  usuarioId: string
  lineasDevueltas: LineaCambioRecord[]
  lineasNuevas: LineaCambioRecord[]
  valorDevuelto?: number
  valorNuevo?: number
  diferenciaMonto: number
  moneda: string
  resolucion: string
}

export interface DevolucionRecord {
  id: string
  fecha: string
  usuarioId: string
  lineas: Array<{ productoId: string; cantidad: number }>
  aptitudReingreso: string
  compensacion: string
  montoCompensacion: number
  moneda: string
}

export interface NotaCreditoRecord {
  id: string
  ventaOrigenId: string
  clienteId: string
  fecha: string
  usuarioId: string
  monto: number
  moneda: string
  motivo: string
  estado: string
  montoAplicado: number
  aplicaciones: Array<{ ventaDestinoId: string; montoAplicado: number; fecha: string }>
}

export interface HistorialVentaRecord {
  id: string
  tipoEvento: string
  usuarioId: string
  fecha: string
  resultado: string
  detalle?: string
}

/** Documento raíz persistido (= factura). */
export interface VentaRecord {
  id: string
  numeroFactura: string
  estado: string
  tipoVenta: string
  clienteId?: string
  sucursalId: string
  almacenId: string
  usuarioEmisionId: string
  moneda: string
  fechaEmision: string
  subtotal: number
  totalDescuentos: number
  total: number
  version: number
  tieneCambios: boolean
  tieneDevoluciones: boolean
  tieneNotasCredito: boolean
  motivoAnulacion?: string
  lineas: VentaLineaRecord[]
  pagos: PagoRecord[]
  cambios: CambioRecord[]
  devoluciones: DevolucionRecord[]
  notasCredito: NotaCreditoRecord[]
  historial: HistorialVentaRecord[]
}

export interface VentasCatalogoClienteRecord {
  id: string
  nombre: string
  activo: boolean
}

export interface VentasCatalogoProductoRecord {
  id: string
  titulo: string
  precio: number
  moneda: string
  activo: boolean
}

export interface VentasExistenciaRecord {
  productoId: string
  almacenId: string
  saldo: number
  almacenBloqueadoPorConteo: boolean
}

export interface VentasUsuarioRecord {
  id: string
  rol: 'cajero' | 'supervisor' | 'administrador'
  topePorcentajeDescuento: number
}

export interface InventarioEfectoLogRecord {
  id: string
  at: string
  intencion: unknown
  resultado: 'OK' | 'ERROR'
  message?: string
}
