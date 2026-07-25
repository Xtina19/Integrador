import type { MovimientoFiltroId } from '../types/inventoryUi'

export type MovimientoContext = {
  title: string
  description: string
  /** Etiqueta del botón principal; `null` = no mostrar. */
  buttonLabel: string | null
  /** Ruta del formulario existente; `null` si no hay botón. */
  buttonPath: string | null
}

/** Textos y CTA contextuales de la pestaña Movimientos según filtro. */
export const MOVIMIENTO_CONTEXT: Record<MovimientoFiltroId, MovimientoContext> = {
  all: {
    title: 'Movimientos de Inventario',
    description: 'Visualiza todas las operaciones realizadas sobre el inventario.',
    buttonLabel: null,
    buttonPath: null,
  },
  entradas: {
    title: 'Entradas de Inventario',
    description: 'Registra las entradas de mercancía al almacén.',
    buttonLabel: 'Nueva Entrada',
    buttonPath: '/inventario/nuevo',
  },
  salidas: {
    title: 'Salidas de Inventario',
    description: 'Registra las salidas de productos del almacén.',
    buttonLabel: 'Nueva Salida',
    buttonPath: '/inventario/ajustes/nuevo',
  },
  transferencias: {
    title: 'Transferencias',
    description: 'Gestiona las transferencias entre almacenes.',
    buttonLabel: 'Nueva Transferencia',
    buttonPath: '/inventario/transferencias/nuevo',
  },
  conteos: {
    title: 'Conteos Físicos',
    description: 'Realiza conteos físicos del inventario.',
    buttonLabel: 'Nuevo Conteo',
    buttonPath: '/inventario/conteos/nuevo',
  },
  ajustes: {
    title: 'Ajustes de Inventario',
    description: 'Corrige diferencias detectadas en el inventario.',
    buttonLabel: 'Nuevo Ajuste',
    buttonPath: '/inventario/ajustes/nuevo',
  },
  descartes: {
    title: 'Descartes',
    description: 'Registra productos dañados o descartados.',
    buttonLabel: 'Nuevo Descarte',
    buttonPath: '/inventario/descartes/nuevo',
  },
  compensaciones: {
    title: 'Compensaciones',
    description: 'Administra movimientos compensatorios del inventario.',
    buttonLabel: 'Nueva Compensación',
    buttonPath: '/inventario/ajustes/nuevo',
  },
}
