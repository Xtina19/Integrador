import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'

/**
 * El Kardex no tiene una vista de detalle propia: redirige a la pestaña Kardex
 * de Inventario con el producto pre-filtrado.
 */
export function DetalleKardexPage() {
  const { productoId = '' } = useParams()

  useEffect(() => {
    document.title = `Kardex · ${productoId}`
  }, [productoId])

  return <Navigate to={`/inventario?tab=kardex&productoId=${encodeURIComponent(productoId)}`} replace />
}
