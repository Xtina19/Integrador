import { isApiEnabled } from '@/config/api'
import { httpGet } from '@/services/http'
import type { Product } from '@/types/domain'
import type { ApiProductoDto, ApiTestDbResponse } from '@/services/api/types'
import { mapApiProductoToProduct, mapApiProductosToProducts } from '@/services/api/mappers/productMapper'

const BASE = '/api/productos'

export const inventarioApi = {
  isEnabled: () => isApiEnabled('inventario'),

  async testConnection(): Promise<ApiTestDbResponse> {
    return httpGet<ApiTestDbResponse>('/api/test-db')
  },

  async getProductos(): Promise<Product[]> {
    const rows = await httpGet<ApiProductoDto[]>(BASE)
    return mapApiProductosToProducts(rows)
  },

  async getProductoById(id: string | number): Promise<Product> {
    const row = await httpGet<ApiProductoDto>(`${BASE}/${id}`)
    return mapApiProductoToProduct(row)
  },
}
