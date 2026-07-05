/** DTO devuelto por GET /api/productos (SQL Server). */
export interface ApiProductoDto {
  id_producto: number
  titulo: string
  isbn: string
  autor: string
  editorial: string
  categoria: string
  precio: number
  stock: number
}

export interface ApiTestDbResponse {
  mensaje: string
  resultado: Array<{ fecha: string }>
}

export interface ApiErrorBody {
  error?: string
  message?: string
}
