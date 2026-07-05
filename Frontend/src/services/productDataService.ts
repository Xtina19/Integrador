import type { Product } from '@/types/domain'
import { isApiEnabled } from '@/config/api'
import { inventarioApi } from '@/services/api/inventarioApi'

/**
 * Punto de acceso unificado para lectura de productos.
 * Si VITE_USE_API_INVENTARIO=false (default), retorna null y el caller usa Mock Data.
 */
export async function fetchProductsFromApi(): Promise<Product[] | null> {
  if (!isApiEnabled('inventario')) return null
  return inventarioApi.getProductos()
}

export async function fetchProductFromApi(id: string): Promise<Product | null> {
  if (!isApiEnabled('inventario')) return null
  return inventarioApi.getProductoById(id)
}
