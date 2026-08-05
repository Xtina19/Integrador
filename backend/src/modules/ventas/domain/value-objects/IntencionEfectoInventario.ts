import type { TipoEfectoInventarioVenta } from '../enums'

/** Referencia de documento origen hacia el Inventory Engine (sin duplicar lógica). */
export interface DocumentoOrigenInventario {
  readonly tipo: 'venta' | 'cambio' | 'devolucion' | 'anulacion_venta'
  readonly ventaId: string
  readonly documentoId: string
  readonly lineaId?: string
}

export interface LineaEfectoInventario {
  readonly productoId: string
  readonly almacenId: string
  readonly cantidad: number
  /** positivo = entrada, negativo = salida en el sentido del efecto */
  readonly sentido: 'entrada' | 'salida'
}

export interface IntencionEfectoInventario {
  readonly tipoEfecto: TipoEfectoInventarioVenta
  readonly documento: DocumentoOrigenInventario
  readonly usuarioId: string
  readonly idempotencyKey: string
  readonly lineas: readonly LineaEfectoInventario[]
}
