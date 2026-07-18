import { randomUUID } from 'node:crypto'
import { Request, Response, NextFunction } from 'express'
import { StructuredLogger, rootLogger } from './StructuredLogger'
import { MetricsRegistry, metricsRegistry } from './MetricsRegistry'

export const REQUEST_ID_HEADER = 'x-request-id'
export const CORRELATION_ID_HEADER = 'x-correlation-id'

export interface RequestObservability {
  requestId: string
  correlationId: string
  logger: StructuredLogger
  metrics: MetricsRegistry
  startedAt: number
}

declare global {
  namespace Express {
    interface Request {
      observability?: RequestObservability
    }
  }
}

export function requestObservabilityMiddleware(
  logger: StructuredLogger = rootLogger,
  metrics: MetricsRegistry = metricsRegistry,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = String(req.header(REQUEST_ID_HEADER) ?? randomUUID())
    const correlationId = String(
      req.header(CORRELATION_ID_HEADER) ?? requestId,
    )

    const childLogger = logger.child({
      requestId,
      correlationId,
      method: req.method,
      path: req.path,
    })

    req.observability = {
      requestId,
      correlationId,
      logger: childLogger,
      metrics,
      startedAt: Date.now(),
    }

    res.setHeader(REQUEST_ID_HEADER, requestId)
    res.setHeader(CORRELATION_ID_HEADER, correlationId)

    childLogger.info('http_request_started', {
      event: 'http_request_started',
    })

    res.on('finish', () => {
      const durationMs = Date.now() - (req.observability?.startedAt ?? Date.now())
      metrics.observe('http_requests', durationMs, {
        method: req.method,
        path: req.route?.path ?? req.path,
        status: String(res.statusCode),
      })
      if (res.statusCode >= 500) {
        metrics.increment('http_errors', {
          method: req.method,
          status: String(res.statusCode),
        })
      }
      childLogger.info('http_request_finished', {
        event: 'http_request_finished',
        statusCode: res.statusCode,
        durationMs,
      })
    })

    next()
  }
}

export async function traceCommand<T>(
  req: Request,
  commandName: string,
  execute: () => Promise<T>,
  classify?: (result: T) => {
    ok: boolean
    versionConflict?: boolean
    idempotencyReplay?: boolean
    engineError?: boolean
  },
): Promise<T> {
  const obs = req.observability
  const started = Date.now()
  obs?.logger.info('command_started', {
    event: 'command_started',
    commandName,
  })

  try {
    const result = await execute()
    const durationMs = Date.now() - started
    obs?.metrics.observe('command_duration_ms', durationMs, {
      command: commandName,
    })

    const classification = classify?.(result)
    if (classification?.versionConflict) {
      obs?.metrics.increment('version_conflicts', { command: commandName })
    }
    if (classification?.idempotencyReplay) {
      obs?.metrics.increment('idempotency_replays', { command: commandName })
    }
    if (classification?.engineError) {
      obs?.metrics.increment('engine_errors', { command: commandName })
    }

    obs?.logger.info('command_finished', {
      event: 'command_finished',
      commandName,
      durationMs,
      ok: classification?.ok ?? true,
      replayed: classification?.idempotencyReplay ?? false,
    })
    return result
  } catch (error) {
    const durationMs = Date.now() - started
    obs?.metrics.increment('infra_errors', { command: commandName })
    obs?.logger.error('command_failed', {
      event: 'command_failed',
      commandName,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
