import type { SqlExecutor } from '../sql/SqlExecutor'

export type VentasRefTipo = 'sucursal' | 'almacen' | 'usuario' | 'producto' | 'cliente'

/**
 * Resuelve IDs de dominio (strings) ↔ FKs INT del ERP vía `ventas_ref_catalogo`.
 * Mantiene independencia del Aggregate respecto al motor físico.
 */
export class VentasCatalogBridge {
  constructor(private readonly sql: SqlExecutor) {}

  async resolveErpId(tipo: VentasRefTipo, dominioId: string): Promise<number> {
    const { rows } = await this.sql.query<{ erp_id: number }>(
      `SELECT erp_id FROM ventas_ref_catalogo WHERE tipo = ? AND dominio_id = ? LIMIT 1`,
      [tipo, dominioId],
    )
    if (!rows[0]) {
      throw new Error(`VentasCatalogBridge: no hay mapeo ${tipo}/${dominioId}`)
    }
    return Number(rows[0].erp_id)
  }

  async resolveClienteErpId(dominioId: string | undefined): Promise<number | null> {
    if (!dominioId) return null
    const byRef = await this.sql.query<{ erp_id: number }>(
      `SELECT erp_id FROM ventas_ref_catalogo WHERE tipo = 'cliente' AND dominio_id = ? LIMIT 1`,
      [dominioId],
    )
    if (byRef.rows[0]) return Number(byRef.rows[0].erp_id)

    const byCliente = await this.sql.query<{ id: number }>(
      `SELECT id FROM venta_clientes WHERE dominio_id = ? LIMIT 1`,
      [dominioId],
    )
    return byCliente.rows[0] ? Number(byCliente.rows[0].id) : null
  }

  async ensureClienteRef(dominioId: string, erpId: number, codigo?: string): Promise<void> {
    await this.sql.query(
      `INSERT INTO ventas_ref_catalogo (tipo, dominio_id, erp_id, codigo_erp)
       VALUES ('cliente', ?, ?, ?)
       ON DUPLICATE KEY UPDATE erp_id = VALUES(erp_id), codigo_erp = COALESCE(VALUES(codigo_erp), codigo_erp)`,
      [dominioId, erpId, codigo ?? null],
    )
  }
}
