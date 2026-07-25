import { Navigate } from 'react-router-dom'

/**
 * Ruta legacy. El listado administrativo de NC vive en `/ventas/notas-credito`.
 * La emisión sigue exclusiva del expediente de factura (`?tab=notas_credito`).
 */
export function CambiosNotasCreditoPage() {
  return <Navigate to="/ventas/notas-credito" replace />
}
