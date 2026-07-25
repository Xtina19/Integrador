/**
 * Catálogos de Compras desde API (proveedores, productos, monedas).
 * Sustituye mockAdmin / posProducts cuando existen endpoints equivalentes.
 */
import { useEffect, useMemo, useState } from 'react'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import { productosApi } from '@/services/api/productosApi'
import { monedasApi } from '@/services/api/monedasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import type { PurchaseType } from '@/types/domain'

export interface CatalogProveedor {
  id: number
  nombre: string
  tipo: 'nacional' | 'internacional' | 'mixto' | string
}

export interface CatalogProducto {
  id: number
  titulo: string
  costo: number
}

export interface CatalogMoneda {
  id: number | string
  code: string
  name: string
}

function asNumber(v: unknown): number | null {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

export function useComprasCatalogos() {
  const [proveedores, setProveedores] = useState<CatalogProveedor[]>([])
  const [productos, setProductos] = useState<CatalogProducto[]>([])
  const [monedas, setMonedas] = useState<CatalogMoneda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [provRows, prodRows, monRows] = await Promise.all([
          proveedoresApi.list(),
          productosApi.list(),
          monedasApi.list(),
        ])
        if (cancelled) return

        setProveedores(
          provRows
            .map((r) => {
              const id = asNumber(r.id)
              if (!id) return null
              return {
                id,
                nombre: String(r.nombre ?? r.name ?? `Proveedor #${id}`),
                tipo: String(r.tipo ?? r.supplierType ?? 'nacional').toLowerCase(),
              }
            })
            .filter(Boolean) as CatalogProveedor[]
        )

        setProductos(
          prodRows
            .map((r) => {
              const id = asNumber(r.id)
              if (!id) return null
              return {
                id,
                titulo: String(r.titulo ?? r.title ?? r.nombre ?? `Producto #${id}`),
                costo: Number(r.costo ?? r.cost ?? r.precio ?? 0) || 0,
              }
            })
            .filter(Boolean) as CatalogProducto[]
        )

        setMonedas(
          monRows.map((m) => ({
            id: m.id,
            code: m.code,
            name: m.name,
          }))
        )
      } catch (e) {
        if (!cancelled) setError(getFriendlyErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const nationalSuppliers = useMemo(
    () => proveedores.filter((p) => p.tipo === 'nacional' || p.tipo === 'mixto'),
    [proveedores]
  )

  const internationalSuppliers = useMemo(
    () => proveedores.filter((p) => p.tipo === 'internacional' || p.tipo === 'mixto'),
    [proveedores]
  )

  function suppliersForType(purchaseType: PurchaseType): CatalogProveedor[] {
    return purchaseType === 'international' ? internationalSuppliers : nationalSuppliers
  }

  const currencyCodes = useMemo(
    () => (monedas.length ? monedas.map((m) => m.code) : ['DOP', 'USD', 'EUR']),
    [monedas]
  )

  return {
    loading,
    error,
    proveedores,
    productos,
    monedas,
    nationalSuppliers,
    internationalSuppliers,
    suppliersForType,
    currencyCodes,
  }
}
