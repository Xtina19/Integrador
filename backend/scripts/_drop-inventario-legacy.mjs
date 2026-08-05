/**
 * Elimina tablas legacy duplicadas / no usadas (alineado a public/scriptdb).
 * MODULO TRANSFERENCIAS antiguo + CosteoInventario.
 */
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();
const require = createRequire(import.meta.url);
const { getConnection } = require('../db.js');

const DROPS = [
  'DetalleRecibimientoMercancia',
  'RecibimientoTransferencias',
  'DetalleTransferencia',
  'Transferencia',
  'TipoTransferencia',
  'CosteoInventario',
];

const pool = await getConnection();
if (!pool) {
  console.error('No se pudo conectar a SQL Server.');
  process.exit(1);
}

console.log('Base:', (await pool.request().query('SELECT DB_NAME() AS db')).recordset[0]?.db);

for (const table of DROPS) {
  const exists = await pool.request().query(`
    SELECT 1 AS ok
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${table}'
  `);

  if (!exists.recordset[0]) {
    console.log(`SKIP ${table} — no existe`);
    continue;
  }

  try {
    await pool.request().query(`DROP TABLE dbo.[${table}]`);
    console.log(`DROP ${table} — OK`);
  } catch (err) {
    console.error(`DROP ${table} — ERROR:`, err.message);
  }
}

const remaining = await pool.request().query(`
  SELECT TABLE_NAME
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME IN (
      'TipoTransferencia','Transferencia','DetalleTransferencia',
      'RecibimientoTransferencias','DetalleRecibimientoMercancia','CosteoInventario'
    )
  ORDER BY TABLE_NAME
`);

console.log('\nTablas legacy restantes:', remaining.recordset.length ? remaining.recordset : '(ninguna)');
process.exit(0);
