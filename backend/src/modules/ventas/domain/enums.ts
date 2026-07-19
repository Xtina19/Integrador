/** Enums del Bounded Context Ventas (VEN-DOM / VEN-RULES-2.0.0). */

export type TipoVenta = 'consumidor_final' | 'cliente_registrado'

export type EstadoVenta = 'emitida' | 'anulada'

export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'nota_credito'

export type MonedaCodigo = 'DOP' | 'USD' | 'COP'

export type EstadoNotaCredito =
  | 'emitida'
  | 'parcialmente_aplicada'
  | 'aplicada'
  | 'anulada'

export type ResolucionDiferenciaCambio =
  | 'cobro'
  | 'devolucion_dinero'
  | 'nota_credito'
  | 'mixto'
  | 'sin_diferencia'

export type AptitudReingreso = 'vendible' | 'no_apto' | 'no_aplica'

export type CompensacionDevolucion = 'dinero' | 'nota_credito' | 'mixto'

export type ResultadoHistorial = 'OK' | 'RECHAZADO' | 'ERROR'

export type TipoEventoHistorialVenta =
  | 'emision'
  | 'reimpresion'
  | 'descuento'
  | 'pago'
  | 'cambio'
  | 'devolucion'
  | 'nota_credito'
  | 'aplicacion_nc'
  | 'anulacion'

/** Tipos de efecto inventariable (contrato hacia Inventario; no es el Engine). */
export type TipoEfectoInventarioVenta =
  | 'salida_venta'
  | 'entrada_devolucion'
  | 'efecto_cambio'
  | 'reversion_anulacion'
