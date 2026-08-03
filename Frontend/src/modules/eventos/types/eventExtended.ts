/** Datos extendidos del módulo Eventos (mock — preparado para DB) */

export interface EventInventoryItem {
  id: string
  product: string
  code: string
  isbn: string
  qty: number
  originBranch: string
}

export interface EventUtensil {
  id: string
  supplier: string
  utensil: string
  qty: number
  unitCost: number
  notes: string
  id_material?: number
  id_proveedor?: number
}

export interface EventStaffMember {
  id: string
  id_persona: number
  personaNombre: string
  rol: string
  horaEntrada: string
  horaSalida: string
  costo: string
  observacion: string
}

export interface EventExtendedData {
  eventId: string
  publishers: string[]
  capacity: number
  inventory: EventInventoryItem[]
  utensils: EventUtensil[]
  staff: EventStaffMember[]
  operationalCost: number
  notes: string
}

/** Venta asociada a un evento (preparado para integración con módulo Ventas) */
export interface EventAssociatedSale {
  id: string
  eventId: string
  date: string
  customer: string
  branch: string
  total: number
  status: 'paid' | 'cancelled'
}

export interface EventHistoryEntry {
  id: string
  eventId: string
  date: string
  action: string
  detail: string
  user: string
}

export const UTENSIL_OPTIONS = [
  'Mesas',
  'Sillas',
  'Carpas',
  'Banners',
  'Roll Up',
  'Manteles',
  'Extensiones',
  'POS',
  'Computadoras',
  'Impresoras',
] as const satisfies readonly string[]

export type FormEventTab = 'detalle' | 'personal' | 'inventario' | 'utensilios' | 'resumen'
export type DetailEventTab = 'resumen' | 'inventario' | 'personal' | 'utensilios' | 'ventas' | 'historial'
