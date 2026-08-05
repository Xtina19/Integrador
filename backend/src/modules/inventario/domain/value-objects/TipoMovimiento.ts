/**
 * Tipos de movimiento soportados por el Inventory Engine.
 * Alineados al diseño físico y al dominio aprobados.
 */
export type TipoMovimiento =
  | 'transferencia_salida'
  | 'transferencia_entrada'
  | 'descarte'
  | 'ajuste'
  | 'recepcion'
  | 'venta'
  | 'devolucion_entrada'
  | 'compensacion'

export type SentidoMovimiento = 'entrada' | 'salida'

export function sentidoDe(tipo: TipoMovimiento): SentidoMovimiento {
  switch (tipo) {
    case 'transferencia_entrada':
    case 'recepcion':
    case 'devolucion_entrada':
      return 'entrada'
    case 'transferencia_salida':
    case 'descarte':
    case 'venta':
      return 'salida'
    case 'ajuste':
    case 'compensacion':
      throw new Error(
        'ajuste/compensacion requieren sentido explícito en el comando.',
      )
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function esTipoMovimiento(value: string): value is TipoMovimiento {
  return (
    value === 'transferencia_salida' ||
    value === 'transferencia_entrada' ||
    value === 'descarte' ||
    value === 'ajuste' ||
    value === 'recepcion' ||
    value === 'venta' ||
    value === 'devolucion_entrada' ||
    value === 'compensacion'
  )
}
