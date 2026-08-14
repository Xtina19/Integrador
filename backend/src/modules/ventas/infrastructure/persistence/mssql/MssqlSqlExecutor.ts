import { Transaction, Request as MssqlRequest } from 'mssql'
import type { ConnectionPool } from 'mssql'
import type { SqlExecutor, SqlQueryResult } from '../sql/SqlExecutor'

function bindQuestionParams(sql: string): { text: string; names: string[] } {
  let index = 0
  const names: string[] = []
  const text = sql.replace(/\?/g, () => {
    const name = `p${index}`
    names.push(name)
    index += 1
    return `@${name}`
  })
  return { text, names }
}

function applyParams(req: MssqlRequest, names: string[], params: ReadonlyArray<unknown>): void {
  for (let i = 0; i < names.length; i += 1) {
    req.input(names[i], params[i])
  }
}

function toResult<T>(rows: T[], rowsAffected: number | undefined): SqlQueryResult<T> {
  let insertId = 0
  if (rows.length === 1 && rows[0] && typeof rows[0] === 'object') {
    const row = rows[0] as Record<string, unknown>
    for (const key of Object.keys(row)) {
      if (/^id_/i.test(key) && typeof row[key] === 'number') {
        insertId = row[key] as number
        break
      }
    }
  }
  return {
    rows,
    insertId,
    affectedRows: rowsAffected ?? 0,
  }
}

class MssqlTxExecutor implements SqlExecutor {
  constructor(private readonly makeRequest: () => MssqlRequest) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<SqlQueryResult<T>> {
    const req = this.makeRequest()
    const { text, names } = bindQuestionParams(sql)
    applyParams(req, names, params)
    const result = await req.query<T>(text)
    return toResult(result.recordset ?? [], result.rowsAffected?.[0])
  }

  async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return fn(this)
  }
}

/** Ejecutor SQL Server (mssql) — misma interfaz que MySQL para repositorios. */
export class MssqlSqlExecutor implements SqlExecutor {
  constructor(private readonly pool: ConnectionPool) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<SqlQueryResult<T>> {
    const req = this.pool.request()
    const { text, names } = bindQuestionParams(sql)
    applyParams(req, names, params)
    const result = await req.query<T>(text)
    return toResult(result.recordset ?? [], result.rowsAffected?.[0])
  }

  async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    const tx = new Transaction(this.pool)
    await tx.begin()
    try {
      const result = await fn(new MssqlTxExecutor(() => new MssqlRequest(tx)))
      await tx.commit()
      return result
    } catch (err) {
      await tx.rollback()
      throw err
    }
  }
}
