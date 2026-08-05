import { httpGet, httpPost, httpPut, httpPatch } from '@/services/http'
import { listAll } from '@/services/api/httpList'

const base = '/api/productos'

export type ProductoStatus = 'active' | 'inactive'

/** DTO alineado con dbo.Producto + joins de lectura */
export interface ProductoDto {
  id: string
  code: string
  isbn: string
  title: string
  author: string
  authorId: string
  category: string
  categoryId: string
  publisher: string
  publisherId: string
  price: number
  cost?: number
  currency: string
  status: ProductoStatus
  createdAt?: string
}

/** Payload de alta/edición — solo campos del formulario Registrar Producto */
export interface ProductoInput {
  isbn: string
  title: string
  author: string
  authorId?: string
  categoryId: string
  publisherId: string
  price: number
  status?: ProductoStatus
}

export const productosApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    listAll<ProductoDto>(base, params),
  getById: (id: string) => httpGet<ProductoDto>(`${base}/${id}`),
  create: (body: Partial<ProductoInput>) => httpPost<ProductoDto>(base, body),
  update: (id: string, body: Partial<ProductoInput>) => httpPut<ProductoDto>(`${base}/${id}`, body),
  setEstado: (id: string, status: ProductoStatus) =>
    httpPatch<ProductoDto>(`${base}/${id}/estado`, { status }),
}
