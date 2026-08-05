/**
 * Contrato SQL genérico — desacopla repositorios del motor (MySQL hoy, otro mañana).
 * Sin lógica de negocio: solo ejecución de sentencias.
 */
export interface SqlQueryResult<T = Record<string, unknown>> {
  rows: T[]
  insertId: number
  affectedRows: number
}

export interface SqlExecutor {
  query<T = Record<string, unknown>>(sql: string, params?: ReadonlyArray<unknown>): Promise<SqlQueryResult<T>>
  transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>
}
