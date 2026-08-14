/**
 * FacturaProveedores — helpers compartidos Compras / Importaciones (public/scriptdb)
 */
const { sql } = require('../db');

function addDaysIso(dateStr, days) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function nextNumeroFacturaProveedor(pool) {
  const result = await pool.request().query(`
    SELECT MAX(TRY_CAST(SUBSTRING(numero_factura, 4, 10) AS INT)) AS max_num
    FROM FacturaProveedores
    WHERE numero_factura LIKE 'FP-[0-9]%'
  `);
  const next = Number(result.recordset[0]?.max_num || 0) + 1;
  return `FP-${String(next).padStart(3, '0')}`;
}

async function fetchFacturaProveedorByOrden(pool, ordenCompraId, tx) {
  const req = tx ? new sql.Request(tx) : pool.request();
  const result = await req.input('ordenId', sql.Int, ordenCompraId).query(`
    SELECT TOP 1 *
    FROM FacturaProveedores
    WHERE id_orden_compra = @ordenId AND estado <> 'Anulada'
    ORDER BY id_factura_prov DESC
  `);
  return result.recordset[0] || null;
}

async function createFacturaProveedorFromOrden(pool, ordenRow, tx) {
  const insReq = tx ? new sql.Request(tx) : pool.request();
  const numeroFactura = await nextNumeroFacturaProveedor(pool);
  const fechaEmision = ordenRow.fecha_emision || new Date().toISOString().slice(0, 10);
  const fechaVencimiento = addDaysIso(fechaEmision, 30);

  const ins = await insReq
    .input('ordenId', sql.Int, ordenRow.id_orden_compra)
    .input('numero', sql.VarChar(100), numeroFactura)
    .input('prov', sql.VarChar(150), ordenRow.proveedor)
    .input('fechaEm', sql.Date, fechaEmision)
    .input('fechaVen', sql.Date, fechaVencimiento)
    .query(`
      INSERT INTO FacturaProveedores (
        id_orden_compra, numero_factura, proveedor, fecha_emision, fecha_vencimiento,
        subtotal, impuestos, total, estado, observacion
      )
      OUTPUT INSERTED.*
      VALUES (
        @ordenId, @numero, @prov, @fechaEm, @fechaVen,
        0, 0, 0, 'Pendiente', NULL
      )
    `);

  const fp = ins.recordset[0];
  const cxpReq = tx ? new sql.Request(tx) : pool.request();
  await cxpReq
    .input('idFp', sql.Int, fp.id_factura_prov)
    .input('total', sql.Decimal(12, 2), 0)
    .input('venc', sql.Date, fechaVencimiento)
    .query(`
      INSERT INTO CuentasPorPagar (
        id_factura_prov, monto_total, monto_pagado,
        fecha_vencimiento, estado, observacion
      )
      VALUES (@idFp, @total, 0, @venc, 'Pendiente', NULL)
    `);
  return fp;
}

async function ensureFacturaProveedorFromOrden(pool, ordenCompraId, tx) {
  const existing = await fetchFacturaProveedorByOrden(pool, ordenCompraId, tx);
  if (existing) return existing;

  const req = tx ? new sql.Request(tx) : pool.request();
  const orden = await req.input('id', sql.Int, ordenCompraId).query(`
    SELECT id_orden_compra, proveedor, fecha_emision
    FROM OrdenCompra
    WHERE id_orden_compra = @id
  `);
  const row = orden.recordset[0];
  if (!row) throw new Error('Orden de compra no encontrada.');
  return createFacturaProveedorFromOrden(pool, row, tx);
}

async function syncFacturaInternacionalPago(pool, idFacturaProv, montoTotal, tx) {
  const req = tx ? new sql.Request(tx) : pool.request();
  await req
    .input('idFp', sql.Int, idFacturaProv)
    .input('total', sql.Decimal(12, 2), montoTotal)
    .query(`
      UPDATE FacturaInternacional
      SET subtotal = @total,
          impuestos = 0,
          total = @total,
          total_local = @total,
          estado = 'Pagada'
      WHERE id_factura_prov = @idFp
    `);
}

/** Crea CuentasPorPagar para facturas que aún no tienen cuenta (scriptdb). */
async function ensureCuentasPorPagar(pool) {
  await pool.request().query(`
    INSERT INTO CuentasPorPagar (
      id_factura_prov, monto_total, monto_pagado, fecha_vencimiento, estado, observacion
    )
    SELECT
      fp.id_factura_prov,
      fp.total,
      CASE WHEN fp.estado = 'Pagada' THEN fp.total ELSE 0 END,
      fp.fecha_vencimiento,
      CASE WHEN fp.estado = 'Pagada' THEN 'Pagado' ELSE 'Pendiente' END,
      fp.observacion
    FROM FacturaProveedores fp
    WHERE fp.estado <> 'Anulada'
      AND NOT EXISTS (
        SELECT 1 FROM CuentasPorPagar cxp WHERE cxp.id_factura_prov = fp.id_factura_prov
      )
  `);
}

module.exports = {
  addDaysIso,
  nextNumeroFacturaProveedor,
  fetchFacturaProveedorByOrden,
  createFacturaProveedorFromOrden,
  ensureFacturaProveedorFromOrden,
  syncFacturaInternacionalPago,
  ensureCuentasPorPagar,
};
