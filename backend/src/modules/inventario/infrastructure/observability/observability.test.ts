import { describe, expect, it } from 'vitest'
import {
  createInventarioComposition,
  seedInventarioBasico,
} from '../composition/createInventarioComposition'
import { MetricsRegistry } from './MetricsRegistry'
import { StructuredLogger } from './StructuredLogger'

describe('Observabilidad (sin HTTP DDD)', () => {
  it('registra métricas de outbox', async () => {
    const metrics = new MetricsRegistry()
    const composition = createInventarioComposition({
      sequentialIds: true,
      metrics,
    })
    await composition.outbox.add({
      id: 'e1',
      eventName: 'TestEvent',
      aggregateType: 'Test',
      aggregateId: '1',
      payload: {},
      occurredAt: new Date(),
    })
    await composition.outboxProcessor.processPending()
    expect(metrics.getCounter('outbox_published', { eventName: 'TestEvent' })).toBe(1)
  })

  it('acepta logger estructurado en composition', () => {
    const lines: string[] = []
    const logger = new StructuredLogger('test-inventario', (line) => lines.push(line))
    const composition = createInventarioComposition({
      sequentialIds: true,
      logger,
    })
    seedInventarioBasico(composition.db)
    composition.logger.info('smoke', { event: 'smoke' })
    expect(lines.some((l) => l.includes('smoke'))).toBe(true)
  })
})
