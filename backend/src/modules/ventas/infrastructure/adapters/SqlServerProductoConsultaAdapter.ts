import type { ProductoConsultaPort } from '../../application/ports/outbound'
import type { MonedaCodigo } from '../../domain/enums'

interface SqlRequestLike {
  input(name: string, value: unknown): SqlRequestLike
  query<T = unknown>(sql: string): Promise<{ recordset: T[] }>
}

interface SqlPoolLike {
  request(): SqlRequestLike
}

/**
 * Catálogo vendible desde SQL Server (tabla Producto — public/scriptdb).
 * IDs = id_producto como string (mismo criterio que /api/productos).
 */
export class SqlServerProductoConsultaAdapter implements ProductoConsultaPort {
  constructor(private readonly pool: SqlPoolLike) {}

  async getVendible(productoId: string) {
    const id = Number(productoId)
    if (!Number.isInteger(id) || id <= 0) return null

    const result = await this.pool
      .request()
      .input('id', id)
      .query(`
        SELECT id_producto, titulo, precio, estado
        FROM Producto
        WHERE id_producto = @id
      `)

    const row = result.recordset[0] as
      | { id_producto: number; titulo: string; precio: number | string; estado: string }
      | undefined
    if (!row) return null

    const estado = String(row.estado || '').trim().toLowerCase()
    const activo = estado === 'activo' || estado === 'active'
    if (!activo) return null

    return {
      id: String(row.id_producto),
      titulo: String(row.titulo || '').trim(),
      precio: Number(row.precio) || 0,
      moneda: 'DOP' as MonedaCodigo,
      activo: true,
    }
  }
}
