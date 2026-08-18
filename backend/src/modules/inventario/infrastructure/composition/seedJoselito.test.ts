import { describe, expect, it } from 'vitest'
import {
  createInventarioComposition,
  seedInventarioJoselitoCompleto,
} from './createInventarioComposition'

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
})
