import type { InventarioConsultaPort } from '../../application/ports/outbound'
import type { SqlExecutor } from '../persistence/sql/SqlExecutor'

/**
 * Disponibilidad contra Inventario / Almacen en SQL Server (public/scriptdb).
 * Fuente de verdad del stock para emisión de ventas.
 */
export class SqlServerInventarioConsultaAdapter implements InventarioConsultaPort {
  constructor(private readonly sql: SqlExecutor) {}

  async disponabilidad(productoId: string, almacenId: string) {
    const idProducto = Number(productoId)
    const idAlmacen = Number(almacenId)
    if (!Number.isFinite(idProducto) || !Number.isFinite(idAlmacen)) {
      return { saldo: 0, almacenBloqueadoPorConteo: false }
    }

    const { rows: almRows } = await this.sql.query<{ bloqueado: boolean | number }>(
      `SELECT bloqueado FROM Almacen WHERE id_almacen = ?`,
      [idAlmacen],
    )
    const almacenBloqueadoPorConteo = Boolean(almRows[0]?.bloqueado)

    const { rows } = await this.sql.query<{ stock_actual: number }>(
      `SELECT stock_actual
       FROM Inventario
       WHERE id_producto = ? AND id_almacen = ?`,
      [idProducto, idAlmacen],
    )

    return {
      saldo: Number(rows[0]?.stock_actual ?? 0),
      almacenBloqueadoPorConteo,
    }
  }
}
