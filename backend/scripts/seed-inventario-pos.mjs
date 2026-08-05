/**
 * Semilla stock mínimo para pruebas POS/Ventas.
 * Tablas: Producto, Almacen, Inventario (public/scriptdb)
 *
 * Uso: node scripts/seed-inventario-pos.mjs
 * Opcional: STOCK_MINIMO=500 node scripts/seed-inventario-pos.mjs
 */
import dotenv from 'dotenv'
import sql from 'mssql'

dotenv.config()

const STOCK_MINIMO = Number(process.env.STOCK_MINIMO ?? 500)

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

async function main() {
  const pool = await sql.connect(config)

  const almacenRes = await pool.request().query(`
    SELECT TOP 1 id_almacen, nombre
    FROM Almacen
    WHERE estado = 'Activo'
    ORDER BY CASE WHEN nombre LIKE '%Central%' THEN 0 ELSE 1 END, id_almacen
  `)
  const almacen = almacenRes.recordset[0]
  if (!almacen) {
    console.error('No hay almacén activo.')
    process.exit(1)
  }

  const idAlmacen = almacen.id_almacen
  console.log(`Almacén POS: ${almacen.nombre} (id=${idAlmacen}), stock mínimo=${STOCK_MINIMO}`)

  const productosRes = await pool.request().query(`
    SELECT id_producto, titulo
    FROM Producto
    WHERE estado = 'Activo'
  `)

  let updated = 0
  let inserted = 0

  for (const p of productosRes.recordset) {
    const check = await pool
      .request()
      .input('prod', sql.Int, p.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .query(`
        SELECT id_inventario, stock_actual
        FROM Inventario
        WHERE id_producto = @prod AND id_almacen = @alm
      `)

    const row = check.recordset[0]
    if (row) {
      if (Number(row.stock_actual) >= STOCK_MINIMO) continue
      await pool
        .request()
        .input('id', sql.Int, row.id_inventario)
        .input('stock', sql.Int, STOCK_MINIMO)
        .query(`
          UPDATE Inventario
          SET stock_actual = @stock, fecha_actualizacion = SYSDATETIME()
          WHERE id_inventario = @id
        `)
      updated += 1
    } else {
      await pool
        .request()
        .input('prod', sql.Int, p.id_producto)
        .input('alm', sql.Int, idAlmacen)
        .input('stock', sql.Int, STOCK_MINIMO)
        .query(`
          INSERT INTO Inventario (
            id_producto, id_almacen, stock_actual, stock_minimo, ubicacion, version
          )
          VALUES (@prod, @alm, @stock, 5, 'POS-DEMO', 1)
        `)
      inserted += 1
    }
  }

  console.log(
    `Listo: ${productosRes.recordset.length} productos activos — ` +
      `${inserted} insertados, ${updated} actualizados a ${STOCK_MINIMO} u.`,
  )
  await pool.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
