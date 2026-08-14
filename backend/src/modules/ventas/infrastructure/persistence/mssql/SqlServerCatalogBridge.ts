import type { SqlExecutor } from '../sql/SqlExecutor'

/** Resuelve IDs string (FE) ↔ FKs INT de public/scriptdb. */
export class SqlServerCatalogBridge {
  private readonly monedaCache = new Map<string, number>()

  constructor(private readonly sql: SqlExecutor) {}

  parseId(value: string | undefined): number | null {
    if (!value) return null
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : null
  }

  requireId(value: string, label: string): number {
    const n = this.parseId(value)
    if (n == null) {
      throw new Error(`SqlServerCatalogBridge: ${label} inválido (${value})`)
    }
    return n
  }

  async monedaId(codigo: string): Promise<number> {
    const key = codigo.trim().toUpperCase()
    const cached = this.monedaCache.get(key)
    if (cached != null) return cached

    const { rows } = await this.sql.query<{ id_moneda: number }>(
      `SELECT id_moneda FROM Moneda WHERE codigo_iso = ?`,
      [key],
    )
    if (!rows[0]) {
      throw new Error(`SqlServerCatalogBridge: moneda no encontrada (${codigo})`)
    }
    const id = Number(rows[0].id_moneda)
    this.monedaCache.set(key, id)
    return id
  }

  async inventarioId(productoId: string, almacenId: string): Promise<number | null> {
    const { rows } = await this.sql.query<{ id_inventario: number }>(
      `SELECT id_inventario FROM Inventario WHERE id_producto = ? AND id_almacen = ?`,
      [this.requireId(productoId, 'producto'), this.requireId(almacenId, 'almacen')],
    )
    return rows[0] ? Number(rows[0].id_inventario) : null
  }

  async facturaPk(codigoDominio: string): Promise<number | null> {
    const { rows } = await this.sql.query<{ id_factura: number }>(
      `SELECT id_factura FROM FacturaVenta WHERE codigo_dominio = ?`,
      [codigoDominio],
    )
    return rows[0] ? Number(rows[0].id_factura) : null
  }

  async notaCreditoPk(codigoDominio: string): Promise<number | null> {
    const { rows } = await this.sql.query<{ id_nota_credito: number }>(
      `SELECT id_nota_credito FROM NotaCredito WHERE codigo_dominio = ?`,
      [codigoDominio],
    )
    return rows[0] ? Number(rows[0].id_nota_credito) : null
  }
}
