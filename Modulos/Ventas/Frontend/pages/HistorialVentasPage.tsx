import { Navigate } from 'react-router-dom'

/**
 * Ruta legacy eliminada como menú.
 * El historial vive en el expediente de cada factura (`/ventas/facturas/:id?tab=historial`).
 */
export function HistorialVentasPage() {
  return <Navigate to="/ventas/facturas" replace />
}
