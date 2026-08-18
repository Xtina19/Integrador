/**
 * Dashboard principal — adaptada exclusivamente a public/scriptdb
 * Tablas: FacturaVenta, OrdenCompra, Inventario, Producto, CategoriaProducto,
 *         Almacen, Sucursal, Embarque, Evento, MovimientoInventario, AuditoriaInventario
 */
const express = require('express')
const router = express.Router()
const { getConnection } = require('../db')

const CATEGORY_COLORS = {
  Literatura: '#1E2D86',
  Académico: '#3B82F6',
  Infantil: '#F4D22E',
  Cómics: '#F59E0B',
  Otros: '#9CA3AF',
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function isCentralAlmacen(nombre) {
  return /central/i.test(String(nombre || ''))
}

function signedQty(tipo, cantidad) {
  const t = String(tipo || '').toLowerCase()
  const q = Math.abs(Number(cantidad) || 0)
  if (
    t.includes('salida') ||
    t === 'venta' ||
    t === 'descarte' ||
    t === 'transferencia_salida'
  ) {
    return -q
  }
  return q
}

function buildInventoryChart(stockRows, movementRows) {
  let centralNow = 0
  let sucursalesNow = 0
  for (const row of stockRows) {
    const stock = Number(row.stock_actual) || 0
    if (isCentralAlmacen(row.almacen_nombre)) centralNow += stock
    else sucursalesNow += stock
  }

  const now = new Date()
  const points = []
  for (let i = 5; i >= 0; i -= 1) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    let central = centralNow
    let sucursales = sucursalesNow
    for (const m of movementRows) {
      const fecha = new Date(m.fecha_movimiento)
      if (fecha >= end) {
        const delta = signedQty(m.tipo_movimiento, m.cantidad)
        if (isCentralAlmacen(m.almacen_nombre)) central -= delta
        else sucursales -= delta
      }
    }
    const labelDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    points.push({
      month: MONTH_LABELS[labelDate.getMonth()],
      central: Math.max(0, Math.round(central)),
      sucursales: Math.max(0, Math.round(sucursales)),
    })
  }
  return points
}

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection()
    if (!pool) {
      return res.status(503).json({ error: 'Sin conexión a la base de datos.' })
    }

    const [
      ventasMes,
      comprasMes,
      ordenesAbiertas,
      stockCritico,
      importaciones,
      eventos,
      stockActual,
      movimientos,
      stockCategoria,
      lowStock,
      actividad,
    ] = await Promise.all([
      pool.request().query(`
        SELECT
          ISNULL(SUM(CASE WHEN estado = 'emitida' THEN total ELSE 0 END), 0) AS monthly_sales,
          ISNULL(AVG(CASE WHEN estado = 'emitida' THEN total END), 0) AS avg_ticket,
          COUNT(CASE WHEN estado = 'emitida' THEN 1 END) AS sales_count
        FROM FacturaVenta
        WHERE YEAR(fecha_emision) = YEAR(GETDATE())
          AND MONTH(fecha_emision) = MONTH(GETDATE())
      `),
      pool.request().query(`
        SELECT ISNULL(SUM(total), 0) AS monthly_purchases
        FROM OrdenCompra
        WHERE estado NOT IN ('Cancelada', 'Anulada')
          AND YEAR(fecha_emision) = YEAR(GETDATE())
          AND MONTH(fecha_emision) = MONTH(GETDATE())
      `),
      pool.request().query(`
        SELECT COUNT(*) AS open_orders
        FROM OrdenCompra
        WHERE estado IN ('Pendiente', 'Aprobada')
      `),
      pool.request().query(`
        SELECT COUNT(*) AS critical_stock_count
        FROM (
          SELECT
            p.id_producto,
            SUM(i.stock_actual) AS stock_total,
            SUM(i.stock_minimo) AS stock_minimo
          FROM Producto p
          INNER JOIN Inventario i ON i.id_producto = p.id_producto
          WHERE p.estado = 'Activo'
          GROUP BY p.id_producto
        ) x
        WHERE x.stock_total <= x.stock_minimo
      `),
      pool.request().query(`
        SELECT
          COUNT(*) AS active_shipments,
          COUNT(CASE WHEN estado IN ('En Tránsito', 'En Aduana', 'in_transit', 'customs') THEN 1 END) AS in_transit
        FROM Embarque
        WHERE estado NOT IN ('Finalizado', 'Anulado', 'Costeado', 'finalized', 'void', 'costed')
      `),
      pool.request().query(`
        SELECT
          COUNT(*) AS upcoming_events,
          (
            SELECT TOP 1 nombre
            FROM Evento
            WHERE estado NOT IN ('Finalizado', 'Cancelado')
              AND fecha_inicio >= CAST(GETDATE() AS DATE)
            ORDER BY fecha_inicio ASC
          ) AS next_event_name
        FROM Evento
        WHERE estado NOT IN ('Finalizado', 'Cancelado')
          AND fecha_fin >= CAST(GETDATE() AS DATE)
      `),
      pool.request().query(`
        SELECT
          i.stock_actual,
          a.nombre AS almacen_nombre
        FROM Inventario i
        INNER JOIN Almacen a ON a.id_almacen = i.id_almacen
        WHERE a.estado = 'Activo'
      `),
      pool.request().query(`
        SELECT
          m.tipo_movimiento,
          m.cantidad,
          m.fecha_movimiento,
          a.nombre AS almacen_nombre
        FROM MovimientoInventario m
        INNER JOIN Almacen a ON a.id_almacen = m.id_almacen
        WHERE m.fecha_movimiento >= DATEADD(MONTH, -6, GETDATE())
      `),
      pool.request().query(`
        SELECT
          ISNULL(c.nombre_categoria, 'Otros') AS name,
          ISNULL(SUM(i.stock_actual), 0) AS value
        FROM Inventario i
        INNER JOIN Producto p ON p.id_producto = i.id_producto
        LEFT JOIN CategoriaProducto c ON c.id_categoria = p.id_categoria
        WHERE p.estado = 'Activo'
        GROUP BY ISNULL(c.nombre_categoria, 'Otros')
        ORDER BY value DESC
      `),
      pool.request().query(`
        SELECT TOP 20
          CAST(p.id_producto AS VARCHAR(20)) + '-' + CAST(i.id_almacen AS VARCHAR(20)) AS id,
          p.titulo AS title,
          ISNULL(p.isbn, '') AS isbn,
          i.stock_actual AS stock,
          i.stock_minimo AS minStock,
          ISNULL(s.nombre, a.nombre) AS branch
        FROM Inventario i
        INNER JOIN Producto p ON p.id_producto = i.id_producto
        INNER JOIN Almacen a ON a.id_almacen = i.id_almacen
        LEFT JOIN Sucursal s ON s.id_sucursal = a.id_sucursal
        WHERE p.estado = 'Activo'
          AND i.stock_actual <= i.stock_minimo
        ORDER BY i.stock_actual ASC, p.titulo ASC
      `),
      pool.request().query(`
        SELECT TOP 8 * FROM (
          SELECT TOP 8
            'venta-' + CAST(fv.id_factura AS VARCHAR(20)) AS id,
            'Venta ' + fv.numero_factura + ' por RD$ ' + FORMAT(fv.total, 'N2') AS message,
            'Ventas' AS module,
            fv.fecha_emision AS createdAt
          FROM FacturaVenta fv
          WHERE fv.estado = 'emitida'
          ORDER BY fv.fecha_emision DESC

          UNION ALL

          SELECT TOP 8
            'emb-' + CAST(e.id_embarque AS VARCHAR(20)) AS id,
            'Embarque ' + e.codigo_embarque + ' · ' + e.estado AS message,
            'Importaciones' AS module,
            e.fecha_registro AS createdAt
          FROM Embarque e
          ORDER BY e.fecha_registro DESC

          UNION ALL

          SELECT TOP 8
            'oc-' + CAST(o.id_orden_compra AS VARCHAR(20)) AS id,
            'Orden ' + o.codigo_orden + ' · ' + o.estado AS message,
            'Compras' AS module,
            o.fecha_emision AS createdAt
          FROM OrdenCompra o
          ORDER BY o.fecha_emision DESC

          UNION ALL

          SELECT TOP 8
            'aud-' + CAST(a.id_auditoria AS VARCHAR(20)) AS id,
            a.tipo_accion + ISNULL(' · ' + LEFT(a.detalle, 80), '') AS message,
            'Inventario' AS module,
            a.fecha AS createdAt
          FROM AuditoriaInventario a
          ORDER BY a.fecha DESC
        ) x
        ORDER BY createdAt DESC
      `),
    ])

    const v = ventasMes.recordset[0] || {}
    const c = comprasMes.recordset[0] || {}
    const o = ordenesAbiertas.recordset[0] || {}
    const crit = stockCritico.recordset[0] || {}
    const imp = importaciones.recordset[0] || {}
    const ev = eventos.recordset[0] || {}

    const categoryOrder = ['Literatura', 'Académico', 'Infantil', 'Cómics', 'Otros']
    const catMap = new Map(
      (stockCategoria.recordset || []).map((row) => [String(row.name), Number(row.value) || 0]),
    )
    // Fold unknown categories into Otros
    let otrosExtra = 0
    for (const [name, value] of catMap.entries()) {
      if (!categoryOrder.includes(name)) {
        otrosExtra += value
        catMap.delete(name)
      }
    }
    const stockByCategory = categoryOrder.map((name) => ({
      name,
      value: (catMap.get(name) || 0) + (name === 'Otros' ? otrosExtra : 0),
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Otros,
    }))

    const activities = (actividad.recordset || []).map((row) => ({
      id: String(row.id),
      message: String(row.message || ''),
      module: String(row.module || ''),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      relativeTime: '',
    }))

    res.json({
      metrics: {
        monthlySales: Number(v.monthly_sales) || 0,
        monthlyPurchases: Number(c.monthly_purchases) || 0,
        avgTicket: Number(v.avg_ticket) || 0,
        openOrders: Number(o.open_orders) || 0,
        criticalStockCount: Number(crit.critical_stock_count) || 0,
        activeShipments: Number(imp.active_shipments) || 0,
        boxesInTransit: Number(imp.in_transit) || 0,
        upcomingEvents: Number(ev.upcoming_events) || 0,
      },
      nextEventName: ev.next_event_name || null,
      inventoryChartData: buildInventoryChart(stockActual.recordset || [], movimientos.recordset || []),
      stockByCategory,
      lowStockProducts: (lowStock.recordset || []).map((row) => ({
        id: String(row.id),
        title: String(row.title || ''),
        isbn: String(row.isbn || ''),
        stock: Number(row.stock) || 0,
        minStock: Number(row.minStock) || 0,
        branch: String(row.branch || ''),
      })),
      activities,
    })
  } catch (err) {
    console.error('[dashboard]', err)
    res.status(500).json({
      error: 'No se pudo cargar el dashboard.',
      detail: err.message,
    })
  }
})

module.exports = router
