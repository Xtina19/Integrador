/**
 * Aplica migraciones de public/scriptdb (OrdenCompra.tipo_orden, FacturaInternacional FKs).
 */
require('dotenv').config();
const { getConnection } = require('../db');
const { ensureScriptdbCompras } = require('../lib/ensureScriptdb');

(async () => {
  const pool = await getConnection();
  if (!pool) {
    console.error('Sin conexión a SQL Server');
    process.exit(1);
  }
  await ensureScriptdbCompras(pool);
  const r = await pool.request().query(`
    SELECT
      COL_LENGTH('OrdenCompra', 'tipo_orden') AS tipo_orden,
      COL_LENGTH('FacturaInternacional', 'id_orden_compra') AS fi_id_orden_compra,
      COL_LENGTH('FacturaInternacional', 'id_factura_prov') AS fi_id_factura_prov
  `);
  console.log(r.recordset[0]);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
