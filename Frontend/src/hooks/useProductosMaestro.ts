/**
 * Catálogo Maestro de Productos (Administración → productosApi).
 * Única fuente de verdad para selectores de Inventario, Compras, Ventas y Eventos.
 */
import { useCallback, useEffect, useState } from 'react'
import { productosApi } from '@/services/api/productosApi'
import { getFriendlyErrorMessage } from '@/services/http'

export interface ProductoMaestro {
  id: string
  code: string
  isbn: string
  title: string
  author: string
  category: string
  publisher: string
  price: number
  cost: number
  currency: string
  status: string
}

function mapRow(r: Record<string, unknown>): ProductoMaestro | null {
  const id = String(r.id ?? '').trim()
  if (!id) return null
  return {
    id,
    code: String(r.code ?? r.codigo ?? ''),
    isbn: String(r.isbn ?? ''),
    title: String(r.title ?? r.titulo ?? r.nombre ?? `Producto #${id}`),
    author: String(r.author ?? r.autor ?? ''),
    category: String(r.category ?? r.categoria ?? ''),
    publisher: String(r.publisher ?? r.editorial ?? ''),
    price: Number(r.price ?? r.precio ?? 0) || 0,
    cost: Number(r.cost ?? r.costo ?? 0) || 0,
    currency: String(r.currency ?? 'DOP'),
    status: String(r.status ?? r.estado ?? 'active'),
  }
}

export function useProductosMaestro(options?: { soloActivos?: boolean }) {
  const soloActivos = options?.soloActivos !== false
  const [productos, setProductos] = useState<ProductoMaestro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await productosApi.list()
      let list = (rows as Record<string, unknown>[]).map(mapRow).filter(Boolean) as ProductoMaestro[]
      if (soloActivos) {
        list = list.filter((p) => p.status === 'active' || p.status === 'activo')
      }
      list.sort((a, b) => a.title.localeCompare(b.title))
      setProductos(list)
    } catch (e) {
      setProductos([])
      setError(getFriendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [soloActivos])

  useEffect(() => {
    void reload()
  }, [reload])

  return { productos, loading, error, reload }
}
