/// <reference types="vite/client" />

export type AdminModuleKey =
  | 'productos'
  | 'categorias'
  | 'editoriales'
  | 'sucursales'
  | 'proveedores'
  | 'monedas'
  | 'tasas-cambio'

export interface AdminModuleConfig {
  key: AdminModuleKey
  basePath: string
  label: string
  singular: string
  createLabel: string
  editTitle: string
  createTitle: string
  detailTitle: string
  deleteTitle: string
  deleteConsequences: string[]
}

export const ADMIN_MODULES: Record<AdminModuleKey, AdminModuleConfig> = {
  productos: {
    key: 'productos',
    basePath: '/administracion/productos',
    label: 'Productos',
    singular: 'Producto',
    createLabel: 'Crear Producto',
    createTitle: 'Registrar Producto',
    editTitle: 'Editar Producto',
    detailTitle: 'Detalle de Producto',
    deleteTitle: 'Eliminar Producto',
    deleteConsequences: [
      'Se eliminará el producto del catálogo maestro en todas las sucursales.',
      'Las referencias en inventario quedarán obsoletas hasta nueva sincronización.',
      'Los movimientos históricos conservarán el ISBN como referencia.',
      'Esta acción no se puede deshacer desde la interfaz.',
    ],
  },
  categorias: {
    key: 'categorias',
    basePath: '/administracion/categorias',
    label: 'Categorías',
    singular: 'Categoría',
    createLabel: 'Crear Categoría',
    createTitle: 'Registrar Categoría',
    editTitle: 'Editar Categoría',
    detailTitle: 'Detalle de Categoría',
    deleteTitle: 'Eliminar Categoría',
    deleteConsequences: [
      'Los productos asociados quedarán sin categoría asignada.',
      'Los reportes por categoría dejarán de contabilizar esta clasificación.',
      'Se recomienda reasignar productos antes de eliminar.',
    ],
  },
  editoriales: {
    key: 'editoriales',
    basePath: '/administracion/editoriales',
    label: 'Editoriales',
    singular: 'Editorial',
    createLabel: 'Registrar Editorial',
    createTitle: 'Registrar Editorial',
    editTitle: 'Editar Editorial',
    detailTitle: 'Detalle de Editorial',
    deleteTitle: 'Eliminar Editorial',
    deleteConsequences: [
      'Se perderá la vinculación con todos los productos de esta editorial.',
      'Los contratos activos quedarían sin referencia en el sistema.',
      'Las órdenes de compra pendientes podrían verse afectadas.',
    ],
  },
  sucursales: {
    key: 'sucursales',
    basePath: '/administracion/sucursales',
    label: 'Sucursales',
    singular: 'Sucursal',
    createLabel: 'Registrar Sucursal',
    createTitle: 'Registrar Sucursal',
    editTitle: 'Editar Sucursal',
    detailTitle: 'Detalle de Sucursal',
    deleteTitle: 'Eliminar Sucursal',
    deleteConsequences: [
      'El inventario asociado quedará sin ubicación operativa.',
      'Las transferencias hacia esta sucursal serán canceladas.',
      'Los usuarios asignados perderán acceso a esta ubicación.',
    ],
  },
  proveedores: {
    key: 'proveedores',
    basePath: '/administracion/proveedores',
    label: 'Proveedores',
    singular: 'Proveedor',
    createLabel: 'Registrar Proveedor',
    createTitle: 'Registrar Proveedor',
    editTitle: 'Editar Proveedor',
    detailTitle: 'Detalle de Proveedor',
    deleteTitle: 'Eliminar Proveedor',
    deleteConsequences: [
      'El historial de compras quedará archivado sin proveedor activo.',
      'Las órdenes abiertas deberán reasignarse manualmente.',
      'Los contactos comerciales dejarán de estar disponibles.',
    ],
  },
  monedas: {
    key: 'monedas',
    basePath: '/administracion/monedas',
    label: 'Monedas',
    singular: 'Moneda',
    createLabel: 'Registrar Moneda',
    createTitle: 'Registrar Moneda',
    editTitle: 'Editar Moneda',
    detailTitle: 'Detalle de Moneda',
    deleteTitle: 'Eliminar Moneda',
    deleteConsequences: [
      'Los productos con esta moneda requerirán conversión manual.',
      'Las tasas de cambio asociadas quedarían inválidas.',
      'Los reportes financieros podrían mostrar inconsistencias.',
    ],
  },
  'tasas-cambio': {
    key: 'tasas-cambio',
    basePath: '/administracion/tasas-cambio',
    label: 'Tasas de Cambio',
    singular: 'Tasa de Cambio',
    createLabel: 'Actualizar Tasa',
    createTitle: 'Registrar Tasa de Cambio',
    editTitle: 'Editar Tasa de Cambio',
    detailTitle: 'Detalle de Tasa',
    deleteTitle: 'Eliminar Tasa de Cambio',
    deleteConsequences: [
      'Los cálculos de conversión usarán la tasa anterior.',
      'Las transacciones en proceso podrían requerir recálculo.',
      'El historial conservará el registro eliminado como referencia.',
    ],
  },
}

export function adminPath(module: AdminModuleKey, action: 'list' | 'nuevo' | 'editar' | 'ver' | 'eliminar', id?: string) {
  const base = ADMIN_MODULES[module].basePath
  if (action === 'list') return base
  if (action === 'nuevo') return `${base}/nuevo`
  if (id) return `${base}/${action}/${id}`
  return base
}
