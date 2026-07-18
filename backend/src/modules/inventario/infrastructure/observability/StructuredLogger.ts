export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogFields {
  readonly [key: string]: unknown
}

/**
 * Logger estructurado JSON (sin dependencias externas).
 * No contiene reglas de negocio.
 */
export class StructuredLogger {
  constructor(
    private readonly service = 'librosys-inventario',
    private readonly sink: (line: string) => void = console.log,
  ) {}

  child(base: LogFields): StructuredLogger {
    const parent = this
    return new StructuredLogger(this.service, (line) => {
      const parsed = JSON.parse(line) as LogFields
      parent.sink(JSON.stringify({ ...base, ...parsed }))
    })
  }

  debug(message: string, fields: LogFields = {}): void {
    this.write('debug', message, fields)
  }

  info(message: string, fields: LogFields = {}): void {
    this.write('info', message, fields)
  }

  warn(message: string, fields: LogFields = {}): void {
    this.write('warn', message, fields)
  }

  error(message: string, fields: LogFields = {}): void {
    this.write('error', message, fields)
  }

  private write(level: LogLevel, message: string, fields: LogFields): void {
    this.sink(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        service: this.service,
        message,
        ...fields,
      }),
    )
  }
}

export const rootLogger = new StructuredLogger()
