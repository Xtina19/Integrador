/**
 * Semilla Renovaciones — public/scriptdb (bloque MODULO EDITORIALES: semilla Renovaciones)
 * Ejecutar: node scripts/seed-renovaciones-editoriales.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getConnection } = require('../db');

const UPDATES = [
  `UPDATE Editorial SET codigo_editorial='EDT-PRH', nombre_contacto='Rebecca Torres', tipo_contrato='Distribución exclusiva', vencimiento_contrato='2026-08-22', estado='Activo' WHERE nombre='Penguin Random House'`,
  `UPDATE Editorial SET codigo_editorial='EDT-BLO', nombre_contacto='James Whitfield', tipo_contrato='Importación', vencimiento_contrato='2026-06-10', estado='Activo' WHERE nombre='Bloomsbury Publishing'`,
  `UPDATE Editorial SET codigo_editorial='EDT-TUS', nombre_contacto='María López', tipo_contrato='Consignación', vencimiento_contrato='2026-04-15', estado='Activo' WHERE nombre='Tusquets Editores'`,
  `UPDATE Editorial SET codigo_editorial='EDT-HC', nombre_contacto='David Lee', tipo_contrato='Distribución no exclusiva', vencimiento_contrato='2026-09-02', estado='Activo' WHERE nombre='HarperCollins'`,
  `UPDATE Editorial SET vencimiento_contrato='2026-03-01' WHERE codigo_editorial='EDT-001'`,
  `UPDATE Editorial SET vencimiento_contrato='2026-07-20' WHERE codigo_editorial='EDT-009'`,
  `UPDATE Editorial SET vencimiento_contrato='2026-08-18' WHERE codigo_editorial='EDT-012'`,
  `UPDATE Editorial SET vencimiento_contrato='2026-08-25' WHERE codigo_editorial='EDT-006'`,
  `UPDATE Editorial SET vencimiento_contrato='2026-05-05' WHERE codigo_editorial='EDT-005'`,
];

(async () => {
  const pool = await getConnection();
  for (const sql of UPDATES) {
    const r = await pool.request().query(sql);
    console.log(`OK (${r.rowsAffected[0]} fila)`);
  }
  const check = await pool.request().query(`
    SELECT nombre, codigo_editorial, tipo_contrato, vencimiento_contrato
    FROM Editorial
    WHERE vencimiento_contrato IS NOT NULL AND vencimiento_contrato <= '2026-09-09'
    ORDER BY vencimiento_contrato
  `);
  console.log('\nContratos vencidos o por vencer:');
  console.table(check.recordset);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
