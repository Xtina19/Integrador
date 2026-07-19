import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export function VentasApiRequiredBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Módulo de Ventas no disponible</p>
        <p className="mt-1 text-amber-800/90">
          Verifique que el servicio de Ventas esté activo e inténtelo de nuevo.
        </p>
        <p className="mt-2">
          <Link className="font-medium text-corporate underline" to="/ventas">
            Volver a Ventas
          </Link>
        </p>
      </div>
    </div>
  )
}
