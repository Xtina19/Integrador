import type { Product } from '@/types/domain'
import type { ApiProductoDto } from '@/services/api/types'

const DEFAULT_MIN_STOCK = 10

export function mapApiProductoToProduct(dto: ApiProductoDto): Product {
  const stock = Number(dto.stock) || 0
  const minStock = DEFAULT_MIN_STOCK

  return {
    id: String(dto.id_producto),
    isbn: dto.isbn ?? '',
    title: dto.titulo ?? '',
    author: dto.autor ?? '',
    category: dto.categoria ?? '',
    publisher: dto.editorial ?? '',
    stock,
    minStock,
    location: '—',
    status: stock === 0 ? 'out' : stock <= minStock ? 'low' : 'normal',
    cost: undefined,
    price: dto.precio != null ? Number(dto.precio) : undefined,
  }
}

export function mapApiProductosToProducts(dtos: ApiProductoDto[]): Product[] {
  return dtos.map(mapApiProductoToProduct)
}
