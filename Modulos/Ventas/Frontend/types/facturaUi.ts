/** Secciones del expediente de factura (VEN-ARCH · Design System). */
export type FacturaTabId =
  | 'general'
  | 'productos'
  | 'pagos'
  | 'cambios'
  | 'notas_credito'
  | 'historial'
  | 'inventario'

export const FACTURA_TABS: { id: FacturaTabId; label: string }[] = [
  { id: 'general', label: 'Información General' },
  { id: 'productos', label: 'Productos' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'cambios', label: 'Cambios' },
  { id: 'notas_credito', label: 'Notas de Crédito' },
  { id: 'historial', label: 'Historial' },
  { id: 'inventario', label: 'Inventario' },
]

export function parseFacturaTab(raw: string | null): FacturaTabId {
  if (raw === 'devoluciones') return 'cambios'
  const match = FACTURA_TABS.find((t) => t.id === raw)
  return match?.id ?? 'general'
}
