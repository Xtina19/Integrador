import { describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  createInventarioComposition,
  seedInventarioBasico,
} from '../composition/createInventarioComposition'
import { createInventarioHttpApp } from '../api/http/createInventarioHttpApp'
import { MetricsRegistry } from './MetricsRegistry'
import { StructuredLogger } from './StructuredLogger'

describe('Observabilidad y health', () => {
  it('expone /live /ready /health y propaga correlation/request id', async () => {
    const metrics = new MetricsRegistry()
    const lines: string[] = []
    const logger = new StructuredLogger('test-inventario', (line) => lines.push(line))
    const composition = createInventarioComposition({
      sequentialIds: true,
      metrics,
      logger,
    })
    seedInventarioBasico(composition.db)
    composition.auth.grant('user-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const live = await request(app).get('/live')
    expect(live.status).toBe(200)
    expect(live.body.status).toBe('alive')

    const ready = await request(app).get('/ready')
    expect(ready.status).toBe(200)
    expect(ready.body.status).toBe('ready')

    const health = await request(app).get('/health')
    expect(health.status).toBe(200)
    expect(health.body.status).toBe('ok')

    const res = await request(app)
      .post('/api/inventario/transferencias')
      .set({
        'x-user-id': 'user-1',
        'x-correlation-id': 'corr-123',
        'x-request-id': 'req-123',
      })
      .send({
        codigo: 'TR-OBS-1',
        almacenOrigenId: 'alm-a',
        almacenDestinoId: 'alm-b',
        lineas: [{ productoId: 'prod-1', cantidadSolicitada: 1 }],
      })

    expect(res.status).toBe(201)
    expect(res.headers['x-correlation-id']).toBe('corr-123')
    expect(res.headers['x-request-id']).toBe('req-123')
    expect(lines.some((l) => l.includes('command_started'))).toBe(true)
    expect(lines.some((l) => l.includes('CrearTransferencia'))).toBe(true)

    const metricsRes = await request(app).get('/metrics')
    expect(metricsRes.status).toBe(200)
    expect(metricsRes.body.counters).toBeTruthy()
  })

  it('sirve OpenAPI', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    const { app } = createInventarioHttpApp(composition)
    const res = await request(app).get('/api/inventario/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.3')
    expect(res.body.paths['/api/inventario/transferencias']).toBeTruthy()
  })

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
})
