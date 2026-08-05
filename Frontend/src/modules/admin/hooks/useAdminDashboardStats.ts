import { useEffect, useState } from 'react'
import { productosApi } from '@/services/api/productosApi'
import { categoriasApi } from '@/services/api/categoriasApi'
import { almacenesApi } from '@/services/api/almacenesApi'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import { monedasApi } from '@/modules/configuracion/services/monedasApi'
import { tasasCambioApi } from '@/modules/configuracion/services/tasasCambioApi'

export interface AdminDashboardCounts {
  productos: number
  categorias: number
  almacenes: number
  proveedores: number
  monedas: number
  tasas: number
  loading: boolean
}

const EMPTY: Omit<AdminDashboardCounts, 'loading'> = {
  productos: 0,
  categorias: 0,
  almacenes: 0,
  proveedores: 0,
  monedas: 0,
  tasas: 0,
}

export function useAdminDashboardCounts(): AdminDashboardCounts {
  const [counts, setCounts] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const [productos, categorias, almacenes, proveedores, monedas, tasas] =
          await Promise.all([
            productosApi.list(),
            categoriasApi.list(),
            almacenesApi.list(),
            proveedoresApi.list(),
            monedasApi.list(),
            tasasCambioApi.list(),
          ])

        if (cancelled) return

        setCounts({
          productos: productos.length,
          categorias: categorias.length,
          almacenes: almacenes.length,
          proveedores: proveedores.length,
          monedas: monedas.filter((m) => m.status === 'active').length,
          tasas: tasas.length,
        })
      } catch {
        if (!cancelled) setCounts(EMPTY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { ...counts, loading }
}
