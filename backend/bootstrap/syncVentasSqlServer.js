/**
 * Sincroniza catálogo vendible y existencias desde SQL Server hacia el Inventory Engine
 * usado por Ventas (mismos IDs que /api/productos y /api/almacenes).
 */
const { getConnection } = require('../db')

/**
 * @param {import('../src/modules/inventario/infrastructure/composition/createInventarioComposition').InventarioComposition} inventario
 * @param {import('../src/modules/ventas/infrastructure/persistence/InMemoryVentasStore').InMemoryVentasStore | null} ventasStore
 */
async function syncVentasCatalogFromSqlServer(inventario, ventasStore) {
  const pool = await getConnection()
  if (!pool) {
    console.warn('[Ventas] Sin conexión SQL — inventario sin catálogo remoto')
    return null
  }

  const db = inventario.db

  const almacenesRes = await pool.request().query(`
    SELECT id_almacen, id_sucursal, nombre, codigo_almacen, bloqueado, estado
    FROM Almacen
    WHERE estado = 'Activo'
  `)

  for (const a of almacenesRes.recordset) {
    db.seedAlmacen({
      id: String(a.id_almacen),
      nombre: a.nombre,
      codigo: a.codigo_almacen,
      sucursalId: a.id_sucursal != null ? String(a.id_sucursal) : null,
      bloqueadoPorConteo: Boolean(a.bloqueado),
    })
  }

  const productosRes = await pool.request().query(`
    SELECT id_producto, titulo, precio, costo_referencia, estado
    FROM Producto
    WHERE estado = 'Activo'
  `)

  for (const p of productosRes.recordset) {
    const id = String(p.id_producto)
    db.seedProducto({
      id,
      titulo: p.titulo,
      activo: true,
      costoReferencia: Number(p.costo_referencia) || 0,
    })
    if (ventasStore) {
      ventasStore.productos.set(id, {
        id,
        titulo: String(p.titulo || ''),
        precio: Number(p.precio) || 0,
        moneda: 'DOP',
        activo: true,
      })
    }
  }

  const existenciasRes = await pool.request().query(`
    SELECT id_inventario, id_producto, id_almacen, stock_actual, version
    FROM Inventario
  `)

  const principalAlmacen =
    almacenesRes.recordset.find((a) => /central/i.test(String(a.nombre || ''))) ??
    almacenesRes.recordset[0]
  const principalAlmacenId = principalAlmacen ? String(principalAlmacen.id_almacen) : '1'
  const MIN_STOCK_POS = Number(process.env.VENTAS_MIN_STOCK_POS ?? 500)

  for (const e of existenciasRes.recordset) {
    const saldoSql = Number(e.stock_actual) || 0
    const almacenId = String(e.id_almacen)
    const esPrincipal = almacenId === principalAlmacenId
    db.seedExistencia({
      id: String(e.id_inventario),
      productoId: String(e.id_producto),
      almacenId,
      saldo: esPrincipal ? Math.max(saldoSql, MIN_STOCK_POS) : saldoSql,
      version: Number(e.version) || 1,
    })
  }

  const stockKeys = new Set(
    existenciasRes.recordset.map((e) => `${e.id_producto}::${e.id_almacen}`),
  )

  let stockDefault = 0
  for (const p of productosRes.recordset) {
    const pid = String(p.id_producto)
    const key = `${pid}::${principalAlmacenId}`
    if (stockKeys.has(key)) continue
    stockDefault += 1
    db.seedExistencia({
      id: `ex-ventas-${pid}-${principalAlmacenId}`,
      productoId: pid,
      almacenId: principalAlmacenId,
      saldo: MIN_STOCK_POS,
      version: 1,
    })
  }

  console.log(
    `[Ventas] catálogo SQL sincronizado: ${productosRes.recordset.length} productos, ` +
      `${existenciasRes.recordset.length} existencias SQL, ${stockDefault} existencias POS por defecto, ` +
      `${almacenesRes.recordset.length} almacenes`,
  )

  return pool
}

module.exports = { syncVentasCatalogFromSqlServer }
