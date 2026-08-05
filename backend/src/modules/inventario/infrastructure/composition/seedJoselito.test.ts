import { describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  createInventarioComposition,
  seedInventarioJoselitoCompleto,
} from './createInventarioComposition'
import { createInventarioHttpApp } from '../api/http/createInventarioHttpApp'

function authHeaders(userId: string, roles = 'operador') {
  return { 'x-user-id': userId, 'x-user-roles': roles }
}

describe('Seeder Joselito — catálogo rico', () => {
  it('puebla productos, existencias y documentos de ejemplo en una composición vacía', () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(composition)

    expect(composition.db.tables.productos.size).toBeGreaterThanOrEqual(40)
    expect(composition.db.tables.existencias.size).toBeGreaterThan(0)
    expect(composition.db.tables.transferencias.size).toBeGreaterThan(0)
    expect(composition.db.tables.ajustes.size).toBeGreaterThan(0)
    expect(composition.db.tables.descartes.size).toBeGreaterThan(0)
    expect(composition.db.tables.conteos.size).toBeGreaterThan(0)
    expect(composition.db.tables.movimientos.size).toBeGreaterThan(0)
    expect(composition.db.tables.kardex.size).toBeGreaterThan(0)
    expect(composition.db.tables.auditorias.size).toBeGreaterThan(0)
  })

  it('no reinicia el catálogo si ya hay productos cargados (idempotente)', () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(composition)
    const productosCount = composition.db.tables.productos.size
    const transferenciasCount = composition.db.tables.transferencias.size

    seedInventarioJoselitoCompleto(composition)

    expect(composition.db.tables.productos.size).toBe(productosCount)
    expect(composition.db.tables.transferencias.size).toBe(transferenciasCount)
  })

  it('expone datos coherentes vía InventoryQueryService', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(composition)

    const productos = await composition.queryService.listProductosVista()
    expect(productos.ok).toBe(true)
    if (!productos.ok) return
    expect(productos.value.length).toBeGreaterThanOrEqual(40)
    const catalogoJoselito = productos.value.filter((p) => p.productoId.startsWith('prod-jsl-'))
    expect(catalogoJoselito.length).toBeGreaterThanOrEqual(40)
    expect(catalogoJoselito.every((p) => !!p.categoria)).toBe(true)
    expect(catalogoJoselito.every((p) => !!p.editorial)).toBe(true)
    for (const p of catalogoJoselito) {
      expect(Number.isInteger(p.costoReferencia)).toBe(true)
      expect(p.existencias.length).toBeGreaterThan(0)
    }

    const movimientos = await composition.queryService.listMovimientos()
    expect(movimientos.ok).toBe(true)
    if (movimientos.ok) {
      expect(movimientos.value.length).toBeGreaterThan(0)
      expect(movimientos.value.every((m) => !!m.almacenNombre)).toBe(true)
    }

    const kardex = await composition.queryService.listKardex()
    expect(kardex.ok).toBe(true)
    if (kardex.ok) expect(kardex.value.length).toBeGreaterThan(0)

    const auditorias = await composition.queryService.listAuditorias()
    expect(auditorias.ok).toBe(true)
    if (auditorias.ok) expect(auditorias.value.length).toBeGreaterThan(0)

    const dashboard = await composition.queryService.dashboardKpis()
    expect(dashboard.ok).toBe(true)
    if (dashboard.ok) {
      expect(dashboard.value.totalProductos).toBeGreaterThanOrEqual(40)
      expect(dashboard.value.totalExistencias).toBeGreaterThan(0)
      expect(dashboard.value.valorInventario).toBeGreaterThan(0)
      expect(dashboard.value.porAlmacen.length).toBeGreaterThan(0)
    }
  })

  it('expone los nuevos endpoints de lectura vía HTTP', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(composition)
    composition.auth.grant('user-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const productos = await request(app)
      .get('/api/inventario/productos')
      .set(authHeaders('user-1'))
    expect(productos.status).toBe(200)
    expect(Array.isArray(productos.body.data)).toBe(true)
    expect(productos.body.data.length).toBeGreaterThanOrEqual(40)

    const dashboard = await request(app)
      .get('/api/inventario/dashboard')
      .set(authHeaders('user-1'))
    expect(dashboard.status).toBe(200)
    expect(dashboard.body.data.totalProductos).toBeGreaterThanOrEqual(40)

    const transferencias = await request(app)
      .get('/api/inventario/transferencias')
      .set(authHeaders('user-1'))
    expect(transferencias.status).toBe(200)
    expect(transferencias.body.data.length).toBeGreaterThan(0)

    const ajustes = await request(app)
      .get('/api/inventario/ajustes')
      .set(authHeaders('user-1'))
    expect(ajustes.status).toBe(200)
    expect(ajustes.body.data.length).toBeGreaterThan(0)

    const movimientos = await request(app)
      .get('/api/inventario/movimientos')
      .set(authHeaders('user-1'))
    expect(movimientos.status).toBe(200)
    expect(movimientos.body.data.length).toBeGreaterThan(0)

    const kardex = await request(app)
      .get('/api/inventario/kardex')
      .set(authHeaders('user-1'))
    expect(kardex.status).toBe(200)
    expect(kardex.body.data.length).toBeGreaterThan(0)

    const auditoria = await request(app)
      .get('/api/inventario/auditoria')
      .set(authHeaders('user-1'))
    expect(auditoria.status).toBe(200)
    expect(auditoria.body.data.length).toBeGreaterThan(0)

    const auditoriaCsv = await request(app)
      .get('/api/inventario/auditoria/export?format=csv')
      .set(authHeaders('user-1'))
    expect(auditoriaCsv.status).toBe(200)
    expect(auditoriaCsv.text).toContain('id,tipoAccion')

    const unaTransferencia = transferencias.body.data[0]
    const detalleTransferencia = await request(app)
      .get(`/api/inventario/transferencias/${unaTransferencia.id}`)
      .set(authHeaders('user-1'))
    expect(detalleTransferencia.status).toBe(200)
    expect(detalleTransferencia.body.data.id).toBe(unaTransferencia.id)
  })

  it('permite solicitar/cancelar una transferencia creada en borrador vía HTTP', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioJoselitoCompleto(composition)
    composition.auth.grant('user-1', '*')
    const { app } = createInventarioHttpApp(composition)

    const creada = await request(app)
      .post('/api/inventario/transferencias')
      .set(authHeaders('user-1'))
      .send({
        codigo: 'TR-SMOKE-1',
        almacenOrigenId: 'central',
        almacenDestinoId: 'suc-1',
        lineas: [{ productoId: 'prod-jsl-001', cantidadSolicitada: 2 }],
        solicitar: false,
      })
    expect(creada.status).toBe(201)
    expect(creada.body.data.estado).toBe('borrador')

    const solicitada = await request(app)
      .post(`/api/inventario/transferencias/${creada.body.data.id}/solicitar`)
      .set(authHeaders('user-1'))
      .send({ expectedVersion: creada.body.data.version })
    expect(solicitada.status).toBe(200)
    expect(solicitada.body.data.estado).toBe('solicitada')

    const cancelada = await request(app)
      .post(`/api/inventario/transferencias/${creada.body.data.id}/cancelar`)
      .set(authHeaders('user-1'))
      .send({ expectedVersion: solicitada.body.data.version })
    expect(cancelada.status).toBe(200)
    expect(cancelada.body.data.estado).toBe('cancelada')
  })
})
