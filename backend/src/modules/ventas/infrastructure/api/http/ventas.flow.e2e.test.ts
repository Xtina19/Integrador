import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createVentasHttpApp } from './createVentasHttpApp'

/**
 * E2E del flujo comercial vía HTTP (sin Frontend).
 * Emisión → consulta → postventa (cliente registrado) → anulación.
 */
describe('Ventas flow E2E (API)', () => {
  it('emisión CF, listado, detalle, reimpresión', async () => {
    const { app } = createVentasHttpApp()
    const auth = { 'x-user-id': 'usr-cajero' }

    const emit = await request(app)
      .post('/api/v1/ventas/pago')
      .set(auth)
      .send({
        tipoVenta: 'consumidor_final',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [{ productoId: 'prod-cien', cantidad: 1, precioUnitario: 1200 }],
        pagos: [{ formaPago: 'efectivo', monto: 1200, montoEntregadoEfectivo: 1200 }],
        idempotencyKey: `e2e-cf-${Date.now()}`,
      })
    expect(emit.status).toBe(201)
    const id = emit.body.data.id as string

    const list = await request(app).get('/api/v1/ventas').set(auth)
    expect(list.status).toBe(200)
    expect(list.body.data.some((r: { id: string }) => r.id === id)).toBe(true)

    const reprint = await request(app).post(`/api/v1/ventas/${id}/reimprimir`).set(auth)
    expect(reprint.status).toBe(200)

    const hist = await request(app).get(`/api/v1/ventas/${id}/historial`).set(auth)
    expect(hist.status).toBe(200)
    expect(hist.body.data.length).toBeGreaterThan(0)
  })

  it('cliente registrado: NC y anulación por supervisor', async () => {
    const { app } = createVentasHttpApp()
    const cajero = { 'x-user-id': 'usr-cajero' }
    const supervisor = { 'x-user-id': 'usr-supervisor' }

    const emit = await request(app)
      .post('/api/v1/ventas/pago-mixto')
      .set(cajero)
      .send({
        tipoVenta: 'cliente_registrado',
        clienteId: 'CLI-000002',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [
          { productoId: 'prod-cien', cantidad: 2, precioUnitario: 1200 },
          { productoId: 'prod-principito', cantidad: 1, precioUnitario: 650 },
        ],
        pagos: [
          { formaPago: 'transferencia', monto: 2000 },
          { formaPago: 'tarjeta', monto: 1050 },
        ],
        idempotencyKey: `e2e-cr-${Date.now()}`,
      })
    expect(emit.status).toBe(201)
    const id = emit.body.data.id as string
    const version = emit.body.data.version as number
    const total = emit.body.data.total as number

    const nc = await request(app)
      .post(`/api/v1/ventas/${id}/notas-credito`)
      .set(cajero)
      .send({ monto: Math.min(100, total), motivo: 'E2E nota crédito', expectedVersion: version })
    // Puede ser 200 o 422 según reglas de postventa; no debe ser 500
    expect([200, 422, 403, 400]).toContain(nc.status)

    const anularCajero = await request(app)
      .post(`/api/v1/ventas/${id}/anular`)
      .set(cajero)
      .send({ motivo: 'intento cajero', idempotencyKey: `anul-c-${Date.now()}` })
    expect(anularCajero.status).toBe(403)

    // Factura fresca sin postventa para anular
    const emit2 = await request(app)
      .post('/api/v1/ventas')
      .set(cajero)
      .send({
        tipoVenta: 'consumidor_final',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [{ productoId: 'prod-1984', cantidad: 1, precioUnitario: 895 }],
        pagos: [{ formaPago: 'efectivo', monto: 895 }],
        idempotencyKey: `e2e-anul-${Date.now()}`,
      })
    expect(emit2.status).toBe(201)

    const anular = await request(app)
      .post(`/api/v1/ventas/${emit2.body.data.id}/anular`)
      .set(supervisor)
      .send({
        motivo: 'Error de caja E2E',
        idempotencyKey: `anul-s-${Date.now()}`,
        expectedVersion: emit2.body.data.version,
      })
    expect(anular.status).toBe(200)
    expect(anular.body.data.estado).toBe('anulada')
  })

  it('buscar cliente', async () => {
    const { app } = createVentasHttpApp()
    const res = await request(app)
      .get('/api/v1/ventas/clientes/buscar')
      .query({ texto: 'PUC' })
      .set('x-user-id', 'usr-cajero')
    expect(res.status).toBe(200)
    expect(res.body.data.some((c: { id: string }) => c.id === 'CLI-000002')).toBe(true)
  })

  it('cambio Naruto→One Piece: diferencia auto + pago en misma factura', async () => {
    const { app } = createVentasHttpApp()
    const cajero = { 'x-user-id': 'usr-cajero' }

    const emit = await request(app)
      .post('/api/v1/ventas/pago')
      .set(cajero)
      .send({
        tipoVenta: 'cliente_registrado',
        clienteId: 'CLI-000004',
        sucursalId: 'suc-central',
        almacenId: 'alm-central',
        moneda: 'DOP',
        lineas: [{ productoId: 'prod-naruto-5', cantidad: 1 }],
        pagos: [{ formaPago: 'efectivo', monto: 900, montoEntregadoEfectivo: 900 }],
        idempotencyKey: `e2e-naruto-${Date.now()}`,
      })
    expect(emit.status).toBe(201)
    const id = emit.body.data.id as string
    const version = emit.body.data.version as number
    const pagosAntes = (emit.body.data.pagos as unknown[]).length

    const cambio = await request(app)
      .post(`/api/v1/ventas/${id}/cambios`)
      .set(cajero)
      .send({
        lineasDevueltas: [{ productoId: 'prod-naruto-5', cantidad: 1 }],
        lineasNuevas: [{ productoId: 'prod-onepiece-109', cantidad: 1 }],
        pagoDiferencia: {
          formaPago: 'efectivo',
          monto: 300,
          montoEntregadoEfectivo: 300,
        },
        idempotencyKey: `e2e-cam-${Date.now()}`,
        expectedVersion: version,
      })
    expect(cambio.status).toBe(200)
    expect(cambio.body.data.tieneCambios).toBe(true)
    expect(cambio.body.data.cambios[0].valorDevuelto).toBe(900)
    expect(cambio.body.data.cambios[0].valorNuevo).toBe(1200)
    expect(cambio.body.data.cambios[0].diferenciaMonto).toBe(300)
    expect(cambio.body.data.cambios[0].resolucion).toBe('cobro')
    expect(cambio.body.data.pagos.length).toBe(pagosAntes + 1)
    expect(
      cambio.body.data.pagos.some(
        (p: { monto: number; formaPago: string }) =>
          p.monto === 300 && p.formaPago === 'efectivo',
      ),
    ).toBe(true)

    const hist = await request(app).get(`/api/v1/ventas/${id}/historial`).set(cajero)
    expect(hist.status).toBe(200)
    const eventos = hist.body.data as Array<{ tipoEvento: string; detalle?: string }>
    expect(eventos.some((e) => e.tipoEvento === 'cambio')).toBe(true)
    expect(eventos.some((e) => e.tipoEvento === 'pago')).toBe(true)
  })
})
