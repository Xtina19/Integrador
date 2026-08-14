/**
 * Siembra operativa Ventas en LibroSys (public/scriptdb).
 * Tablas: FacturaVenta, DetalleFacturaVenta, PagoFactura, HistorialFacturaVenta,
 *         NotaCredito, SecuenciaFacturaVenta, SecuenciaNotaCredito.
 *
 * Idempotente: no inserta si ya hay facturas (use --force para re-ejecutar).
 *
 *   node scripts/seedVentasScriptdb.js
 *   node scripts/seedVentasScriptdb.js --force
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { getConnection, sql } = require('../db')

const FORCE = process.argv.includes('--force')

/** @typedef {{ codigo: string, numero: string, estado: string, tipo: string, persona: number|null, sucursal: number, almacen: number, usuario: number, diasAtras: number, lineas: Array<{ prod: number, inv: number|null, qty: number, precio: number, titulo: string }>, pago: { forma: string, monto: number }, nc?: { monto: number, motivo: string, estado: string } }} FacturaSeed */

/** @type {FacturaSeed[]} */
const FACTURAS = [
  {
    codigo: 'fv-librosys-001',
    numero: 'F-1-1001',
    estado: 'emitida',
    tipo: 'consumidor_final',
    persona: null,
    sucursal: 1,
    almacen: 1,
    usuario: 8,
    diasAtras: 0,
    lineas: [
      { prod: 16, inv: 11, qty: 1, precio: 720, titulo: 'Cien años de soledad' },
      { prod: 18, inv: 13, qty: 1, precio: 650, titulo: '1984' },
    ],
    pago: { forma: 'efectivo', monto: 1370 },
  },
  {
    codigo: 'fv-librosys-002',
    numero: 'F-1-1002',
    estado: 'emitida',
    tipo: 'cliente_registrado',
    persona: 37,
    sucursal: 1,
    almacen: 1,
    usuario: 13,
    diasAtras: 1,
    lineas: [
      { prod: 23, inv: 18, qty: 2, precio: 1250, titulo: 'La casa de los espíritus' },
      { prod: 22, inv: 17, qty: 1, precio: 550, titulo: 'Rayuela' },
    ],
    pago: { forma: 'tarjeta', monto: 3050 },
  },
  {
    codigo: 'fv-librosys-003',
    numero: 'F-1-1003',
    estado: 'emitida',
    tipo: 'cliente_registrado',
    persona: 42,
    sucursal: 1,
    almacen: 1,
    usuario: 4,
    diasAtras: 3,
    lineas: [
      { prod: 17, inv: 12, qty: 5, precio: 420, titulo: 'Don Quijote de la Mancha' },
      { prod: 16, inv: 11, qty: 3, precio: 720, titulo: 'Cien años de soledad' },
    ],
    pago: { forma: 'transferencia', monto: 4260 },
  },
  {
    codigo: 'fv-librosys-004',
    numero: 'F-2-1001',
    estado: 'emitida',
    tipo: 'cliente_registrado',
    persona: 38,
    sucursal: 2,
    almacen: 2,
    usuario: 3,
    diasAtras: 5,
    lineas: [{ prod: 18, inv: null, qty: 2, precio: 650, titulo: '1984' }],
    pago: { forma: 'efectivo', monto: 1300 },
  },
  {
    codigo: 'fv-librosys-005',
    numero: 'F-1-1004',
    estado: 'emitida',
    tipo: 'cliente_registrado',
    persona: 40,
    sucursal: 1,
    almacen: 1,
    usuario: 8,
    diasAtras: 7,
    lineas: [
      { prod: 21, inv: null, qty: 1, precio: 720, titulo: 'Crónica de una muerte anunciada' },
      { prod: 20, inv: null, qty: 1, precio: 420, titulo: 'Fahrenheit 451' },
    ],
    pago: { forma: 'tarjeta', monto: 1140 },
    nc: { monto: 420, motivo: 'Devolución — ejemplar dañado (Fahrenheit 451)', estado: 'emitida' },
  },
  {
    codigo: 'fv-librosys-006',
    numero: 'F-1-1005',
    estado: 'emitida',
    tipo: 'consumidor_final',
    persona: null,
    sucursal: 1,
    almacen: 1,
    usuario: 14,
    diasAtras: 12,
    lineas: [{ prod: 16, inv: 11, qty: 2, precio: 720, titulo: 'Cien años de soledad' }],
    pago: { forma: 'efectivo', monto: 1440 },
  },
  {
    codigo: 'fv-librosys-007',
    numero: 'F-1-1006',
    estado: 'anulada',
    tipo: 'cliente_registrado',
    persona: 39,
    sucursal: 1,
    almacen: 1,
    usuario: 3,
    diasAtras: 15,
    lineas: [{ prod: 22, inv: 17, qty: 1, precio: 550, titulo: 'Rayuela' }],
    pago: { forma: 'efectivo', monto: 550 },
  },
  {
    codigo: 'fv-librosys-008',
    numero: 'F-1-1007',
    estado: 'emitida',
    tipo: 'cliente_registrado',
    persona: 46,
    sucursal: 1,
    almacen: 1,
    usuario: 4,
    diasAtras: 20,
    lineas: [
      { prod: 17, inv: 12, qty: 10, precio: 420, titulo: 'Don Quijote de la Mancha' },
      { prod: 18, inv: 13, qty: 8, precio: 650, titulo: '1984' },
    ],
    pago: { forma: 'transferencia', monto: 9400 },
    nc: { monto: 1300, motivo: 'Ajuste por convenio institucional PUCMM', estado: 'parcialmente_aplicada' },
  },
]

function subtotal(lineas) {
  return lineas.reduce((s, l) => s + l.qty * l.precio, 0)
}

async function ensureSecuencias(pool, idMoneda) {
  for (const suc of [1, 2]) {
    await pool.request().input('suc', sql.Int, suc).query(`
      IF NOT EXISTS (SELECT 1 FROM SecuenciaFacturaVenta WHERE id_sucursal = @suc)
        INSERT INTO SecuenciaFacturaVenta (id_sucursal, ultimo_numero) VALUES (@suc, 1000)
    `)
  }
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM SecuenciaNotaCredito WHERE id_secuencia = 1)
      INSERT INTO SecuenciaNotaCredito (id_secuencia, ultimo_numero) VALUES (1, 0)
  `)
  await pool.request().input('n1', sql.Int, 1007).input('n2', sql.Int, 1001).query(`
    UPDATE SecuenciaFacturaVenta SET ultimo_numero = @n1 WHERE id_sucursal = 1;
    UPDATE SecuenciaFacturaVenta SET ultimo_numero = @n2 WHERE id_sucursal = 2;
    UPDATE SecuenciaNotaCredito SET ultimo_numero = 2 WHERE id_secuencia = 1;
  `)
  void idMoneda
}

async function insertFactura(pool, f, idMoneda) {
  const sub = subtotal(f.lineas)
  const total = sub
  const fecha = `DATEADD(day, -${f.diasAtras}, CAST(GETDATE() AS DATE))`

  const ins = await pool
    .request()
    .input('codigo', sql.VarChar(50), f.codigo)
    .input('numero', sql.VarChar(50), f.numero)
    .input('estado', sql.VarChar(20), f.estado)
    .input('tipo', sql.VarChar(30), f.tipo)
    .input('persona', sql.Int, f.persona)
    .input('sucursal', sql.Int, f.sucursal)
    .input('almacen', sql.Int, f.almacen)
    .input('usuario', sql.Int, f.usuario)
    .input('moneda', sql.Int, idMoneda)
    .input('sub', sql.Decimal(12, 2), sub)
    .input('total', sql.Decimal(12, 2), total)
    .input('tieneNc', sql.Bit, f.nc ? 1 : 0)
    .input('motivo', sql.VarChar(255), f.estado === 'anulada' ? 'Error de digitación en caja' : null)
    .query(`
      INSERT INTO FacturaVenta (
        codigo_dominio, numero_factura, estado, tipo_venta, id_persona,
        id_sucursal, id_almacen, id_usuario_emision, id_moneda,
        fecha_emision, subtotal, total_descuentos, total, version,
        tiene_cambios, tiene_devoluciones, tiene_notas_credito, motivo_anulacion
      )
      OUTPUT INSERTED.id_factura
      VALUES (
        @codigo, @numero, @estado, @tipo, @persona,
        @sucursal, @almacen, @usuario, @moneda,
        ${fecha}, @sub, 0, @total, 1,
        0, 0, @tieneNc, @motivo
      )
    `)

  const idFactura = ins.recordset[0].id_factura

  for (let i = 0; i < f.lineas.length; i++) {
    const l = f.lineas[i]
    const neto = l.qty * l.precio
    await pool
      .request()
      .input('idf', sql.Int, idFactura)
      .input('cd', sql.VarChar(50), `${f.codigo}-ln-${i + 1}`)
      .input('prod', sql.Int, l.prod)
      .input('inv', sql.Int, l.inv)
      .input('desc', sql.VarChar(255), l.titulo)
      .input('qty', sql.Int, l.qty)
      .input('precio', sql.Decimal(12, 2), l.precio)
      .input('neto', sql.Decimal(12, 2), neto)
      .query(`
        INSERT INTO DetalleFacturaVenta (
          id_factura, codigo_dominio, id_producto, id_inventario,
          descripcion_snapshot, cantidad, precio_unitario, importe_neto
        ) VALUES (@idf, @cd, @prod, @inv, @desc, @qty, @precio, @neto)
      `)
  }

  await pool
    .request()
    .input('idf', sql.Int, idFactura)
    .input('cd', sql.VarChar(50), `${f.codigo}-pago-1`)
    .input('forma', sql.VarChar(30), f.pago.forma)
    .input('monto', sql.Decimal(12, 2), f.pago.monto)
    .input('moneda', sql.Int, idMoneda)
    .query(`
      INSERT INTO PagoFactura (id_factura, codigo_dominio, forma_pago, monto, id_moneda)
      VALUES (@idf, @cd, @forma, @monto, @moneda)
    `)

  await pool
    .request()
    .input('idf', sql.Int, idFactura)
    .input('cd', sql.VarChar(50), `${f.codigo}-hist-1`)
    .input('usuario', sql.Int, f.usuario)
    .query(`
      INSERT INTO HistorialFacturaVenta (
        id_factura, codigo_dominio, tipo_evento, id_usuario, fecha, resultado, detalle
      ) VALUES (
        @idf, @cd, 'emision', @usuario, ${fecha}, 'OK',
        ${f.estado === 'anulada' ? "'Factura emitida (posteriormente anulada)'" : "'Emisión desde siembra LibroSys'"}
      )
    `)

  if (f.estado === 'anulada') {
    await pool
      .request()
      .input('idf', sql.Int, idFactura)
      .input('cd', sql.VarChar(50), `${f.codigo}-hist-2`)
      .input('usuario', sql.Int, 3)
      .query(`
        INSERT INTO HistorialFacturaVenta (
          id_factura, codigo_dominio, tipo_evento, id_usuario, fecha, resultado, detalle
        ) VALUES (
          @idf, @cd, 'anulacion', @usuario, DATEADD(day, -${Math.max(0, f.diasAtras - 1)}, CAST(GETDATE() AS DATE)),
          'OK', 'Anulación por supervisor'
        )
      `)
  }

  if (f.nc && f.persona) {
    const ncCodigo = f.codigo.replace('fv-', 'nc-')
    const ncNumero = ncCodigo === 'nc-librosys-005' ? 'NC-000001' : 'NC-000002'
    const montoAplicado = f.nc.estado === 'parcialmente_aplicada' ? 500 : 0

    const ncIns = await pool
      .request()
      .input('codigo', sql.VarChar(50), ncCodigo)
      .input('idf', sql.Int, idFactura)
      .input('persona', sql.Int, f.persona)
      .input('usuario', sql.Int, f.usuario)
      .input('monto', sql.Decimal(12, 2), f.nc.monto)
      .input('moneda', sql.Int, idMoneda)
      .input('motivo', sql.VarChar(255), f.nc.motivo)
      .input('estado', sql.VarChar(30), f.nc.estado)
      .input('aplicado', sql.Decimal(12, 2), montoAplicado)
      .query(`
        INSERT INTO NotaCredito (
          codigo_dominio, id_factura_origen, id_persona, fecha, id_usuario,
          monto, id_moneda, motivo, estado, monto_aplicado
        )
        OUTPUT INSERTED.id_nota_credito
        VALUES (
          @codigo, @idf, @persona, DATEADD(day, -${Math.max(0, f.diasAtras - 1)}, CAST(GETDATE() AS DATE)),
          @usuario, @monto, @moneda, @motivo, @estado, @aplicado
        )
      `)

    await pool
      .request()
      .input('idf', sql.Int, idFactura)
      .input('cd', sql.VarChar(50), `${f.codigo}-hist-nc`)
      .input('usuario', sql.Int, f.usuario)
      .query(`
        INSERT INTO HistorialFacturaVenta (
          id_factura, codigo_dominio, tipo_evento, id_usuario, fecha, resultado, detalle
        ) VALUES (
          @idf, @cd, 'nota_credito_emitida', @usuario,
          DATEADD(day, -${Math.max(0, f.diasAtras - 1)}, CAST(GETDATE() AS DATE)),
          'OK', 'NC ${ncNumero} — ${f.nc.motivo.replace(/'/g, "''")}'
        )
      `)

    void ncIns
  }

  return idFactura
}

async function main() {
  const pool = await getConnection()
  if (!pool) {
    console.error('Sin conexión a SQL Server.')
    process.exit(1)
  }

  const countRes = await pool.request().query('SELECT COUNT(*) AS c FROM FacturaVenta')
  const existing = Number(countRes.recordset[0].c)
  if (existing > 0 && !FORCE) {
    console.log(`[seedVentas] Ya hay ${existing} factura(s) en LibroSys — omitido (use --force).`)
    process.exit(0)
  }

  if (FORCE && existing > 0) {
    console.log('[seedVentas] --force: eliminando ventas previas…')
    await pool.request().query(`
      DELETE FROM AplicacionNotaCredito;
      DELETE FROM PagoFactura;
      DELETE FROM NotaCredito;
      DELETE FROM HistorialFacturaVenta;
      DELETE FROM DetalleDevolucionFactura;
      DELETE FROM DevolucionFactura;
      DELETE FROM DetalleCambioFactura;
      DELETE FROM CambioFactura;
      DELETE FROM DetalleFacturaVenta;
      DELETE FROM FacturaVenta;
    `)
  }

  const monedaRes = await pool
    .request()
    .query("SELECT TOP 1 id_moneda FROM Moneda WHERE codigo_iso = 'DOP'")
  const idMoneda = monedaRes.recordset[0]?.id_moneda
  if (!idMoneda) {
    console.error('Moneda DOP no encontrada.')
    process.exit(1)
  }

  console.log('[seedVentas] Insertando facturas en LibroSys…')
  for (const f of FACTURAS) {
    const id = await insertFactura(pool, f, idMoneda)
    console.log(`  ✓ ${f.numero} (id_factura=${id})`)
  }

  await ensureSecuencias(pool, idMoneda)

  const final = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM FacturaVenta) AS facturas,
      (SELECT COUNT(*) FROM NotaCredito) AS notas_credito,
      (SELECT SUM(total) FROM FacturaVenta WHERE estado = 'emitida') AS total_emitido
  `)
  const s = final.recordset[0]
  console.log(
    `[seedVentas] Listo — ${s.facturas} facturas, ${s.notas_credito} NC, RD$ ${Number(s.total_emitido || 0).toFixed(2)} emitido.`,
  )
}

main().catch((err) => {
  console.error('[seedVentas] Error:', err.message || err)
  process.exit(1)
})
