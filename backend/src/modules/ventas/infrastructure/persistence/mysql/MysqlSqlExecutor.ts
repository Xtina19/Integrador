import { createPool, type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise'
import type { SqlExecutor, SqlQueryResult } from '../sql/SqlExecutor'

export interface MysqlPoolConfig {
  host: string
  port?: number
  user: string
  password: string
  database: string
  connectionLimit?: number
}

function toResult<T>(raw: [RowDataPacket[] | ResultSetHeader, unknown]): SqlQueryResult<T> {
  const [first] = raw
  if (Array.isArray(first)) {
    return { rows: first as T[], insertId: 0, affectedRows: 0 }
  }
  const header = first as ResultSetHeader
  return {
    rows: [] as T[],
    insertId: Number(header.insertId ?? 0),
    affectedRows: Number(header.affectedRows ?? 0),
  }
}

class MysqlConnectionExecutor implements SqlExecutor {
  constructor(private readonly conn: PoolConnection) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<SqlQueryResult<T>> {
    const raw = await this.conn.query(sql, [...params])
    return toResult<T>(raw as [RowDataPacket[] | ResultSetHeader, unknown])
  }

  async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    // Ya estamos dentro de una conexión de transacción.
    return fn(this)
  }
}

/** Ejecutor MySQL (mysql2). Intercambiable vía SqlExecutor. */
export class MysqlSqlExecutor implements SqlExecutor {
  private readonly pool: Pool

  constructor(config: MysqlPoolConfig | Pool) {
    this.pool =
      'query' in config && 'getConnection' in config
        ? (config as Pool)
        : createPool({
            host: (config as MysqlPoolConfig).host,
            port: (config as MysqlPoolConfig).port ?? 3306,
            user: (config as MysqlPoolConfig).user,
            password: (config as MysqlPoolConfig).password,
            database: (config as MysqlPoolConfig).database,
            waitForConnections: true,
            connectionLimit: (config as MysqlPoolConfig).connectionLimit ?? 10,
            namedPlaceholders: false,
          })
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<SqlQueryResult<T>> {
    const raw = await this.pool.query(sql, [...params])
    return toResult<T>(raw as [RowDataPacket[] | ResultSetHeader, unknown])
  }

  async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection()
    try {
      await conn.beginTransaction()
      const result = await fn(new MysqlConnectionExecutor(conn))
      await conn.commit()
      return result
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  async end(): Promise<void> {
    await this.pool.end()
  }
}
