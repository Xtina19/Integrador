import { Navigate } from 'react-router-dom'

/** Redirige la ruta legacy al submódulo unificado. */
export function ConsolidacionesPage() {
  return <Navigate to="/importaciones/embarques" replace />
}
