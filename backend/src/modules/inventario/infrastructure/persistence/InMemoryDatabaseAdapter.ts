/**
 * Adaptador de base de datos en memoria con soporte transaccional.
 * Implementa el rol de Database Adapter sin filtrar reglas de negocio.
 * La forma de los registros sigue el modelo físico/lógico aprobado.
 */

export type JsonRecord = Record<string, unknown>

export interface InventoryDbTables {
  productos: Map<string, JsonRecord>
  almacenes: Map<string, JsonRecord>
  existencias: Map<string, JsonRecord>
  transferencias: Map<string, JsonRecord>
  descartes: Map<string, JsonRecord>
  ajustes: Map<string, JsonRecord>
  conteos: Map<string, JsonRecord>
  conteoMetadata: Map<string, JsonRecord>
  conteoAuditoria: Map<string, JsonRecord>
  movimientos: Map<string, JsonRecord>
  kardex: Map<string, JsonRecord>
  auditorias: Map<string, JsonRecord>
  idempotency: Map<string, JsonRecord>
  outbox: Map<string, JsonRecord>
}

function emptyTables(): InventoryDbTables {
  return {
    productos: new Map(),
    almacenes: new Map(),
    existencias: new Map(),
    transferencias: new Map(),
    descartes: new Map(),
    ajustes: new Map(),
    conteos: new Map(),
    conteoMetadata: new Map(),
    conteoAuditoria: new Map(),
    movimientos: new Map(),
    kardex: new Map(),
    auditorias: new Map(),
    idempotency: new Map(),
    outbox: new Map(),
  }
}

function cloneTables(source: InventoryDbTables): InventoryDbTables {
  const clone = emptyTables()
  for (const key of Object.keys(source) as (keyof InventoryDbTables)[]) {
    for (const [id, value] of source[key].entries()) {
      clone[key].set(id, structuredClone(value))
    }
  }
  return clone
}

function mergeTables(target: InventoryDbTables, source: InventoryDbTables): void {
  for (const key of Object.keys(source) as (keyof InventoryDbTables)[]) {
    target[key] = source[key]
  }
}

/**
 * Conexión/adaptador de persistencia.
 * begin/commit/rollback habilitan Unit of Work sobre un working set.
 */
export class InMemoryDatabaseAdapter {
  private committed = emptyTables()
  private working: InventoryDbTables | null = null
  private txDepth = 0

  /** Tablas visibles en la transacción actual o en el estado committed. */
  get tables(): InventoryDbTables {
    return this.working ?? this.committed
  }

  isInTransaction(): boolean {
    return this.working !== null
  }

  begin(): void {
    if (this.txDepth === 0) {
      this.working = cloneTables(this.committed)
    }
    this.txDepth += 1
  }

  commit(): void {
    if (this.txDepth === 0) {
      throw new Error('No hay transacción activa para commit.')
    }
    this.txDepth -= 1
    if (this.txDepth === 0 && this.working) {
      mergeTables(this.committed, this.working)
      this.working = null
    }
  }

  rollback(): void {
    if (this.txDepth === 0) {
      throw new Error('No hay transacción activa para rollback.')
    }
    this.txDepth -= 1
    if (this.txDepth === 0) {
      this.working = null
    }
  }

  /** Semilla de maestros para pruebas/bootstrap (fuera de reglas de inventario). */
  seedProducto(row: JsonRecord): void {
    this.committed.productos.set(String(row.id), structuredClone(row))
  }

  seedAlmacen(row: JsonRecord): void {
    this.committed.almacenes.set(String(row.id), structuredClone(row))
  }

  seedExistencia(row: JsonRecord): void {
    const key = `${row.productoId}::${row.almacenId}`
    this.committed.existencias.set(key, structuredClone(row))
  }

  reset(): void {
    this.committed = emptyTables()
    this.working = null
    this.txDepth = 0
  }
}
