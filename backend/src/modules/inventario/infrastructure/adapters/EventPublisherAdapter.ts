import { OutboxMessage } from '../../application/ports/outbound'
import { DbOutboxRepository } from '../persistence/repositories'
import { StructuredLogger } from '../observability/StructuredLogger'
import { MetricsRegistry } from '../observability/MetricsRegistry'

export interface PublishedEvent {
  message: OutboxMessage
  publishedAt: Date
}

export interface IEventPublisher {
  publish(message: OutboxMessage): Promise<void>
}

/**
 * Publicador en memoria (captura eventos para pruebas / desarrollo).
 */
export class InMemoryEventPublisher implements IEventPublisher {
  readonly published: PublishedEvent[] = []

  async publish(message: OutboxMessage): Promise<void> {
    this.published.push({ message, publishedAt: new Date() })
  }
}

export interface OutboxProcessorOptions {
  logger?: StructuredLogger
  metrics?: MetricsRegistry
}

/**
 * Procesador Outbox: lee pendientes, publica y marca estado.
 * No contiene reglas de inventario.
 */
export class OutboxProcessor {
  constructor(
    private readonly outbox: DbOutboxRepository,
    private readonly publisher: IEventPublisher,
    private readonly options: OutboxProcessorOptions = {},
  ) {}

  async processPending(limit = 50): Promise<{
    published: number
    failed: number
  }> {
    const pending = await this.outbox.listPending(limit)
    let published = 0
    let failed = 0

    this.options.logger?.info('outbox_process_started', {
      event: 'outbox_process_started',
      pending: pending.length,
    })

    for (const message of pending) {
      try {
        await this.publisher.publish(message)
        await this.outbox.markPublished(message.id)
        published += 1
        this.options.metrics?.increment('outbox_published', {
          eventName: message.eventName,
        })
        this.options.logger?.info('outbox_published', {
          event: 'outbox_published',
          outboxId: message.id,
          eventName: message.eventName,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error de publicación'
        await this.outbox.markError(message.id, errorMessage)
        failed += 1
        this.options.metrics?.increment('outbox_failed', {
          eventName: message.eventName,
        })
        this.options.logger?.error('outbox_publish_failed', {
          event: 'outbox_publish_failed',
          outboxId: message.id,
          eventName: message.eventName,
          error: errorMessage,
        })
      }
    }

    this.options.logger?.info('outbox_process_finished', {
      event: 'outbox_process_finished',
      published,
      failed,
    })

    return { published, failed }
  }
}
