declare module 'mssql' {
  export class ConnectionPool {
    request(): Request
  }

  export class Transaction {
    constructor(pool: ConnectionPool)
    begin(): Promise<void>
    commit(): Promise<void>
    rollback(): Promise<void>
  }

  export class Request {
    constructor(poolOrTransaction?: ConnectionPool | Transaction)
    input(name: string, value: unknown): Request
    query<T = unknown>(sql: string): Promise<{
      recordset: T[]
      rowsAffected: number[]
    }>
  }
}
