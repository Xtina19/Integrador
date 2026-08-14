require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { getConnection } = require('../db')

async function main() {
  const p = await getConnection()
  const q = async (sql) => (await p.request().query(sql)).recordset
  console.log('Sucursal', await q('SELECT TOP 5 id_sucursal, nombre FROM Sucursal'))
  console.log('Almacen', await q('SELECT TOP 5 id_almacen, id_sucursal, nombre FROM Almacen'))
  console.log('Moneda', await q('SELECT id_moneda, codigo_iso FROM Moneda'))
  console.log('Usuario', await q("SELECT TOP 8 id_usuario, rol FROM Usuario WHERE estado='Activo'"))
  console.log('Producto', await q("SELECT TOP 8 id_producto, titulo, precio FROM Producto WHERE estado='Activo'"))
  console.log(
    'Cliente',
    await q(`
      SELECT TOP 8 p.id_persona,
        COALESCE(NULLIF(p.razon_social,''), CONCAT(p.nombres,' ',p.apellidos)) AS nombre
      FROM Persona p
      WHERE p.id_persona NOT IN (SELECT id_persona FROM Usuario WHERE id_persona IS NOT NULL)
        AND p.id_persona NOT IN (SELECT id_persona FROM Proveedor)
        AND p.estado='Activo'
    `),
  )
  console.log('Inventario sample', await q('SELECT TOP 5 id_inventario, id_producto, id_almacen, stock_actual FROM Inventario'))
  console.log('Counts', await q('SELECT (SELECT COUNT(*) FROM FacturaVenta) fv, (SELECT COUNT(*) FROM NotaCredito) nc'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
