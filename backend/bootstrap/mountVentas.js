/**
 * Monta el módulo Ventas (DDD) sobre Express legacy.
 * Requiere tsx/cjs registrado antes de require este archivo.
 *
 * Base path: /api/v1/ventas
 * Catálogo/stock: SQL Server (Producto, Inventario, Almacen) + seed demo.
 */
async function mountVentasDdd(app) {
  const {
    createInventarioComposition,
    seedInventarioJoselitoCompleto,
  } = require('../src/modules/inventario/infrastructure/composition/createInventarioComposition.ts')

  const { mountVentasModule } = require('../src/modules/ventas/infrastructure/bootstrap/mountVentasModule.ts')
  const { SqlServerProductoConsultaAdapter } = require('../src/modules/ventas/infrastructure/adapters/SqlServerProductoConsultaAdapter.ts')
  const { syncVentasCatalogFromSqlServer } = require('./syncVentasSqlServer.js')

  const inventario = createInventarioComposition({
    durableConteo: true,
    durableDescarte: true,
  })
  seedInventarioJoselitoCompleto(inventario)

  const pool = await syncVentasCatalogFromSqlServer(inventario, null)

  const mountOptions = {}
  if (pool) {
    mountOptions.productos = new SqlServerProductoConsultaAdapter(pool)
  }

  mountVentasModule(app, inventario, mountOptions)
}

module.exports = { mountVentasDdd }
