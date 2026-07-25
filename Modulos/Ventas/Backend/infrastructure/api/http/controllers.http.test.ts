import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createVentasHttpApp } from './createVentasHttpApp'

describe('Ventas HTTP API', () => {
  it('emite venta CF y lista detalle', async () => {
    const { app } = createVentasHttpApp()

    const emit = await request(app)
      .post('/api/v1/ventas')
      .set('x-user-id', 'usr-cajero')
      .send({
        tipoVenta: 'consumidor_final',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [{ productoId: 'prod-cien', cantidad: 1 }],
        pagos: [{ formaPago: 'efectivo', monto: 1200, montoEntregadoEfectivo: 1200 }],
        idempotencyKey: 'test-emit-1',
      })

    expect(emit.status).toBe(201)
    expect(emit.body.success).toBe(true)
    expect(emit.body.data.numeroFactura).toBeTruthy()

    const id = emit.body.data.id as string
    const detail = await request(app)
      .get(`/api/v1/ventas/${id}`)
      .set('x-user-id', 'usr-cajero')

    expect(detail.status).toBe(200)
    expect(detail.body.data.id).toBe(id)
  })

  it('rechaza anulación por cajero (403)', async () => {
    const { app } = createVentasHttpApp()

    const emit = await request(app)
      .post('/api/v1/ventas/pago')
      .set('x-user-id', 'usr-cajero')
      .send({
        tipoVenta: 'consumidor_final',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [{ productoId: 'prod-1984', cantidad: 1 }],
        pagos: [{ formaPago: 'efectivo', monto: 895 }],
        idempotencyKey: 'test-emit-2',
      })

    expect(emit.status).toBe(201)
    const id = emit.body.data.id as string

    const anular = await request(app)
      .post(`/api/v1/ventas/${id}/anular`)
      .set('x-user-id', 'usr-cajero')
      .send({ motivo: 'Error de caja', idempotencyKey: 'anul-1' })

    expect(anular.status).toBe(403)
  })

  it('sirve OpenAPI', async () => {
    const { app } = createVentasHttpApp()
    const res = await request(app).get('/api/v1/ventas/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.3')
  })
})
