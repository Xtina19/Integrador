import { describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  createInventarioComposition,
  seedInventarioBasico,
} from '../../composition/createInventarioComposition'
import { createInventarioHttpApp } from './createInventarioHttpApp'

function authHeaders(userId: string, roles = 'operador') {
  return {
    'x-user-id': userId,
    'x-user-roles': roles,
  }
}

describe('API HTTP — controladores de inventario', () => {
  it('rechaza requests sin usuario', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    const { app } = createInventarioHttpApp(composition)

    const res = await request(app).post('/api/inventario/transferencias').send({})
    expect(res.status).toBe(401)
  })

  it('crea transferencia vía controller → application service', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    composition.auth.grant('user-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const res = await request(app)
      .post('/api/inventario/transferencias')
      .set(authHeaders('user-1'))
      .send({
        codigo: 'TR-API-1',
        almacenOrigenId: 'alm-a',
        almacenDestinoId: 'alm-b',
        lineas: [{ productoId: 'prod-1', cantidadSolicitada: 2 }],
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.codigo).toBe('TR-API-1')
  })

  it('valida body inválido con 400', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    composition.auth.grant('user-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const res = await request(app)
      .post('/api/inventario/transferencias')
      .set(authHeaders('user-1'))
      .send({ codigo: 'X' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  it('flujo descarte crear → aprobar → aplicar por HTTP', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    composition.auth.grant('user-1', '*')
    composition.auth.grant('supervisor-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const creado = await request(app)
      .post('/api/inventario/descartes')
      .set(authHeaders('user-1'))
      .send({
        codigo: 'DES-API-1',
        almacenId: 'alm-a',
        lineas: [
          { productoId: 'prod-1', cantidad: 1, motivoCodigo: 'DANO' },
        ],
      })
    expect(creado.status).toBe(201)

    const aprobado = await request(app)
      .post(`/api/inventario/descartes/${creado.body.data.id}/aprobar`)
      .set(authHeaders('supervisor-1'))
      .send({ expectedVersion: creado.body.data.version })
    expect(aprobado.status).toBe(200)
    expect(aprobado.body.data.estado).toBe('aprobado')

    const aplicado = await request(app)
      .post(`/api/inventario/descartes/${creado.body.data.id}/aplicar`)
      .set(authHeaders('supervisor-1'))
      .send({
        expectedVersion: aprobado.body.data.version,
        idempotencyKey: 'api-aplicar-des-1',
      })
    expect(aplicado.status).toBe(200)
    expect(aplicado.body.data.estado).toBe('aplicado')

    const stock = await composition.existencias.get('prod-1', 'alm-a')
    expect(stock?.saldo.value).toBe(19)
  })

  it('procesa outbox por endpoint', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    composition.auth.grant('admin-1', '*')
    await composition.outbox.add({
      id: 'o1',
      eventName: 'ConteoCerrado',
      aggregateType: 'ConteoFisico',
      aggregateId: 'c1',
      payload: {},
      occurredAt: new Date(),
    })
    const { app } = createInventarioHttpApp(composition)

    const res = await request(app)
      .post('/api/inventario/outbox/process')
      .set(authHeaders('admin-1', 'admin'))
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.data.published).toBe(1)
  })
})
