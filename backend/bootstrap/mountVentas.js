/**
 * Monta el módulo Ventas (DDD) sobre Express legacy.
 * Requiere tsx/cjs registrado antes de require este archivo.
 *
 * Base path: /api/v1/ventas
 * Persistencia: SQL Server LibroSys (public/scriptdb) — sin datos demo.
 */
async function mountVentasDdd(app) {
  const { createInventarioComposition } = require('../src/modules/inventario/infrastructure/composition/createInventarioComposition.ts')

  const { mountVentasModule } = require('../src/modules/ventas/infrastructure/bootstrap/mountVentasModule.ts')
  const { MssqlSqlExecutor } = require('../src/modules/ventas/infrastructure/persistence/mssql/MssqlSqlExecutor.ts')
  const {
    SqlServerProductoConsultaAdapter,
    SqlServerClienteConsultaAdapter,
    SqlServerUsuarioPermisosAdapter,
  } = require('../src/modules/ventas/infrastructure/adapters/index.ts')
  const { syncVentasCatalogFromSqlServer } = require('./syncVentasSqlServer.js')
  const { ensureVentasModuleTables } = require('./applyVentasModule.js')

  const inventario = createInventarioComposition({
    durableConteo: true,
    durableDescarte: true,
  })

  const pool = await syncVentasCatalogFromSqlServer(inventario, null)
  if (!pool) {
    throw new Error(
      '[Ventas] Requiere conexión a SQL Server (LibroSys). Verifique DB_USER, DB_PASSWORD, DB_SERVER y DB_DATABASE en .env',
    )
  }

  await ensureVentasModuleTables(pool)

  const sql = new MssqlSqlExecutor(pool)

  mountVentasModule(app, inventario, {
    seedJoselito: false,
    sql,
    sqlDialect: 'mssql',
    productos: new SqlServerProductoConsultaAdapter(pool),
    clientes: new SqlServerClienteConsultaAdapter(pool),
    permisos: new SqlServerUsuarioPermisosAdapter(pool),
  })
}

module.exports = { mountVentasDdd }
