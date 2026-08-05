/**
 * API Compras — adaptada exclusivamente a public/scriptdb
 * Tablas: OrdenCompra, DetalleOrdenCompra, RecepcionOrdenCompra,
 *         DetalleRecepcionOrdenCompra, FacturaProveedores, CuentasPorPagar
 * Contrato FE: DTOs en comprasApi.ts (OrdenCompraDto, RecepcionDto, FacturaProveedorDto)
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { sendPaginated, sendSuccess } = require('../middlewares/successResponse');

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'UNEXPECTED', message },
  });
}

function mapOrdenEstadoToDto(estado) {
  const e = String(estado || '').trim();
  switch (e) {
    case 'Pendiente':
      return 'pendiente_aprobacion';
    case 'Aprobada':
      return 'aprobada';
    case 'Recibida':
      return 'recibida';
    case 'Cancelada':
      return 'cancelada';
    default:
      return 'borrador';
  }
}

function inferTipoCompra(row) {
  const obs = String(row.observacion || '').toLowerCase();
  const cod = String(row.codigo_orden || '').toUpperCase();
  if (obs.includes('import') || cod.includes('INT')) return 'internacional';
  return 'nacional';
}

function inferMonedaId(row) {
  return inferTipoCompra(row) === 'internacional' ? 3 : 1;
}

function mapRecepcionEstadoToDto(estado) {
  const e = String(estado || '').trim();
  if (e === 'Recibido') return 'confirmada';
  return 'borrador';
}

function mapFacturaEstadoPago(estado) {
  const e = String(estado || '').trim();
  if (e === 'Pagada') return 'pagada';
  if (e === 'Vencida') return 'pendiente';
  if (e === 'Anulada') return 'anulada';
  return 'pendiente';
}

function mapOrdenRow(row, detalles = []) {
  const subtotal = Number(row.subtotal ?? 0);
  const impuestos = Number(row.impuestos ?? 0);
  const total = Number(row.total ?? 0);
  return {
    id: row.id_orden_compra,
    codigo: row.codigo_orden,
    proveedorId: row.id_orden_compra,
    proveedorNombre: row.proveedor,
    sucursalId: row.id_almacen,
    monedaId: inferMonedaId(row),
    tasaCambio: 1,
    condicionPagoId: 1,
    tipoCompra: inferTipoCompra(row),
    fechaOrden: row.fecha_emision,
    fechaEntregaEstimada: row.fecha_entrega_est ?? null,
    subtotal,
    descuento: 0,
    impuestos,
    total,
    estado: mapOrdenEstadoToDto(row.estado),
    activo: row.estado !== 'Cancelada',
    observaciones: row.observacion ?? null,
    detalles: detalles.map((d, idx) => ({
      id: d.id_detalle_oc,
      linea: idx + 1,
      productoId: d.id_producto,
      cantidadSolicitada: Number(d.cantidad),
      costoUnitario: Number(d.precio_unitario),
      descuento: 0,
      impuesto: 0,
      subtotal: Number(d.subtotal),
    })),
  };
}

function mapRecepcionRow(row) {
  const tipoRow = { ...row, observacion: row.oc_observacion ?? row.observacion };
  return {
    id: row.id_recepcion,
    codigo: `REC-${String(row.id_recepcion).padStart(3, '0')}`,
    ordenCompraId: row.id_orden_compra,
    almacenId: row.id_almacen,
    fechaRecepcion: row.fecha_recepcion,
    usuarioReceptor: row.id_usuario_recibe,
    observaciones: row.observacion ?? null,
    estado: mapRecepcionEstadoToDto(row.estado),
    activo: row.estado !== 'Rechazado',
    ordenCodigo: row.codigo_orden,
    proveedorNombre: row.proveedor,
    tipoCompra: inferTipoCompra(tipoRow),
  };
}

function mapFacturaRow(row) {
  const tipoRow = { ...row, observacion: row.oc_observacion ?? row.observacion, codigo_orden: row.codigo_orden };
  const subtotal = Number(row.subtotal ?? 0);
  const impuestos = Number(row.impuestos ?? 0);
  const total = Number(row.total ?? 0);
  const estadoDoc = String(row.estado || 'Pendiente');
  return {
    id: row.id_factura_prov,
    codigo: row.numero_factura,
    ordenCompraId: row.id_orden_compra,
    proveedorId: row.id_factura_prov,
    proveedorNombre: row.proveedor,
    numeroFactura: row.numero_factura,
    ncf: null,
    monedaId: inferMonedaId(tipoRow),
    tasaCambio: 1,
    condicionPagoId: 1,
    fechaEmision: row.fecha_emision,
    fechaVencimiento: row.fecha_vencimiento ?? null,
    subtotal,
    descuento: 0,
    impuestos,
    total,
    estado: estadoDoc,
    estadoPago: mapFacturaEstadoPago(estadoDoc),
    activo: estadoDoc !== 'Anulada',
    observaciones: row.observacion ?? null,
    ordenCodigo: row.codigo_orden,
  };
}

async function fetchOrdenDetalles(pool, ordenId) {
  const detResult = await pool.request().input('id', sql.Int, ordenId).query(`
    SELECT
      id_detalle_oc,
      id_orden_compra,
      id_producto,
      cantidad,
      precio_unitario,
      subtotal
    FROM DetalleOrdenCompra
    WHERE id_orden_compra = @id
    ORDER BY id_detalle_oc
  `);
  return detResult.recordset;
}

async function fetchOrdenById(pool, id) {
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      id_orden_compra,
      codigo_orden,
      id_almacen,
      proveedor,
      fecha_emision,
      fecha_entrega_est,
      subtotal,
      impuestos,
      total,
      estado,
      observacion
    FROM OrdenCompra
    WHERE id_orden_compra = @id
  `);
  const row = result.recordset[0];
  if (!row) return null;
  const detalles = await fetchOrdenDetalles(pool, id);
  return { row, detalles };
}

async function fetchRecepcionById(pool, id) {
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      r.id_recepcion,
      r.id_orden_compra,
      r.id_almacen,
      r.id_usuario_recibe,
      r.estado,
      r.observacion,
      r.fecha_recepcion,
      oc.codigo_orden,
      oc.proveedor,
      oc.observacion AS oc_observacion
    FROM RecepcionOrdenCompra r
    INNER JOIN OrdenCompra oc ON oc.id_orden_compra = r.id_orden_compra
    WHERE r.id_recepcion = @id
  `);
  return result.recordset[0] || null;
}

function mapResultadoToEstadoScriptdb(resultado) {
  const r = String(resultado || 'aceptada').toLowerCase();
  if (r.includes('rechaz')) return 'Rechazado';
  if (r.includes('parcial')) return 'Recibido Parcial';
  return 'Recibido';
}

async function fetchFacturaById(pool, id) {
  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      fp.id_factura_prov,
      fp.id_orden_compra,
      fp.numero_factura,
      fp.proveedor,
      fp.fecha_emision,
      fp.fecha_vencimiento,
      fp.subtotal,
      fp.impuestos,
      fp.total,
      fp.estado,
      fp.observacion,
      oc.codigo_orden,
      oc.observacion AS oc_observacion
    FROM FacturaProveedores fp
    INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
    WHERE fp.id_factura_prov = @id
  `);
  return result.recordset[0] || null;
}

/** GET /api/compras/ordenes */
router.get('/ordenes', async (req, res) => {
  try {
    const pool = await getConnection();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 200));
    const offset = (page - 1) * pageSize;

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM OrdenCompra
    `);
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const ordenesResult = await pool.request().query(`
      SELECT
        id_orden_compra,
        codigo_orden,
        id_almacen,
        proveedor,
        fecha_emision,
        fecha_entrega_est,
        subtotal,
        impuestos,
        total,
        estado,
        observacion
      FROM OrdenCompra
      ORDER BY fecha_emision DESC, id_orden_compra DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `);

    const ids = ordenesResult.recordset.map((r) => r.id_orden_compra);
    let detallesByOrden = new Map();
    if (ids.length) {
      const detResult = await pool.request().query(`
        SELECT
          id_detalle_oc,
          id_orden_compra,
          id_producto,
          cantidad,
          precio_unitario,
          subtotal
        FROM DetalleOrdenCompra
        WHERE id_orden_compra IN (${ids.join(',')})
        ORDER BY id_detalle_oc
      `);
      for (const d of detResult.recordset) {
        const list = detallesByOrden.get(d.id_orden_compra) ?? [];
        list.push(d);
        detallesByOrden.set(d.id_orden_compra, list);
      }
    }

    const data = ordenesResult.recordset.map((row) =>
      mapOrdenRow(row, detallesByOrden.get(row.id_orden_compra) ?? [])
    );

    return sendPaginated(res, data, { page, pageSize, total }, 'Órdenes de compra listadas correctamente.');
  } catch (err) {
    console.error('[compras] list ordenes', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/ordenes/:id/aprobar — OrdenCompra (scriptdb) */
router.post('/ordenes/:id/aprobar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de orden inválido');

    const pool = await getConnection();
    const orden = await fetchOrdenById(pool, id);
    if (!orden) return fail(res, 404, 'Orden no encontrada');

    const estado = String(orden.row.estado || '').trim();
    if (estado === 'Aprobada') return fail(res, 409, 'La orden ya está aprobada.');
    if (estado === 'Cancelada') return fail(res, 409, 'No se puede aprobar una orden cancelada.');
    if (estado === 'Recibida') return fail(res, 409, 'La orden ya fue recibida.');
    if (estado !== 'Pendiente') return fail(res, 409, 'No se puede aprobar en el estado actual.');

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE OrdenCompra SET estado = 'Aprobada' WHERE id_orden_compra = @id
    `);

    const updated = await fetchOrdenById(pool, id);
    return sendSuccess(res, mapOrdenRow(updated.row, updated.detalles), {
      message: 'Orden de compra aprobada correctamente.',
    });
  } catch (err) {
    console.error('[compras] aprobar orden', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /api/compras/recepciones */
router.get('/recepciones', async (req, res) => {
  try {
    const pool = await getConnection();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 200));
    const offset = (page - 1) * pageSize;

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM RecepcionOrdenCompra
    `);
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const result = await pool.request().query(`
      SELECT
        r.id_recepcion,
        r.id_orden_compra,
        r.id_almacen,
        r.id_usuario_recibe,
        r.estado,
        r.observacion,
        r.fecha_recepcion,
        oc.codigo_orden,
        oc.proveedor,
        oc.observacion AS oc_observacion
      FROM RecepcionOrdenCompra r
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = r.id_orden_compra
      ORDER BY r.fecha_recepcion DESC, r.id_recepcion DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `);

    const data = result.recordset.map((row) => mapRecepcionRow(row));

    return sendPaginated(res, data, { page, pageSize, total }, 'Recepciones listadas correctamente.');
  } catch (err) {
    console.error('[compras] list recepciones', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/recepciones/:id/confirmar — RecepcionOrdenCompra (scriptdb) */
router.post('/recepciones/:id/confirmar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de recepción inválido');

    const pool = await getConnection();
    const row = await fetchRecepcionById(pool, id);
    if (!row) return fail(res, 404, 'Recepción no encontrada');
    if (String(row.estado) === 'Recibido') {
      return fail(res, 409, 'La recepción ya está confirmada.');
    }

    const nuevoEstado = mapResultadoToEstadoScriptdb(req.body?.resultadoInspeccion);

    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.VarChar(50), nuevoEstado)
      .query(`UPDATE RecepcionOrdenCompra SET estado = @estado WHERE id_recepcion = @id`);

    if (nuevoEstado === 'Recibido') {
      await pool.request()
        .input('ordenId', sql.Int, row.id_orden_compra)
        .query(`
          UPDATE OrdenCompra
          SET estado = 'Recibida'
          WHERE id_orden_compra = @ordenId AND estado NOT IN ('Cancelada', 'Recibida')
        `);
    }

    const updated = await fetchRecepcionById(pool, id);
    return sendSuccess(res, mapRecepcionRow(updated), {
      message: 'Recepción confirmada correctamente.',
    });
  } catch (err) {
    console.error('[compras] confirmar recepcion', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /api/compras/facturas */
router.get('/facturas', async (req, res) => {
  try {
    const pool = await getConnection();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 200));
    const offset = (page - 1) * pageSize;

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM FacturaProveedores
    `);
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const result = await pool.request().query(`
      SELECT
        fp.id_factura_prov,
        fp.id_orden_compra,
        fp.numero_factura,
        fp.proveedor,
        fp.fecha_emision,
        fp.fecha_vencimiento,
        fp.subtotal,
        fp.impuestos,
        fp.total,
        fp.estado,
        fp.observacion,
        oc.codigo_orden,
        oc.observacion AS oc_observacion
      FROM FacturaProveedores fp
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
      ORDER BY fp.fecha_emision DESC, fp.id_factura_prov DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `);

    const data = result.recordset.map((row) => mapFacturaRow(row));

    return sendPaginated(res, data, { page, pageSize, total }, 'Facturas de proveedor listadas correctamente.');
  } catch (err) {
    console.error('[compras] list facturas', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/facturas/:id/registrar-pago — FacturaProveedores + CuentasPorPagar (scriptdb) */
router.post('/facturas/:id/registrar-pago', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de factura inválido');

    const pool = await getConnection();
    const row = await fetchFacturaById(pool, id);
    if (!row) return fail(res, 404, 'Factura no encontrada');
    if (String(row.estado) === 'Anulada') {
      return fail(res, 409, 'No se puede registrar pago en una factura anulada.');
    }
    if (String(row.estado) === 'Pagada') {
      return fail(res, 409, 'La factura ya está pagada.');
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('id', sql.Int, id)
        .query(`UPDATE FacturaProveedores SET estado = 'Pagada' WHERE id_factura_prov = @id`);

      const cxpCheck = await new sql.Request(tx)
        .input('id', sql.Int, id)
        .query(`SELECT id_cuenta_pagar, monto_total FROM CuentasPorPagar WHERE id_factura_prov = @id`);

      if (cxpCheck.recordset.length) {
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .query(`
            UPDATE CuentasPorPagar
            SET monto_pagado = monto_total,
                estado = 'Pagado',
                fecha_ultimo_pago = GETDATE()
            WHERE id_factura_prov = @id
          `);
      } else {
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .input('total', sql.Decimal(12, 2), Number(row.total))
          .input('venc', sql.Date, row.fecha_vencimiento || new Date())
          .query(`
            INSERT INTO CuentasPorPagar (
              id_factura_prov, monto_total, monto_pagado,
              fecha_vencimiento, estado, fecha_ultimo_pago, observacion
            )
            VALUES (@id, @total, @total, @venc, 'Pagado', GETDATE(), 'Pago registrado')
          `);
      }
      await tx.commit();
    } catch (inner) {
      await tx.rollback();
      throw inner;
    }

    const updated = await fetchFacturaById(pool, id);
    return sendSuccess(res, mapFacturaRow(updated), {
      message: 'Pago de factura registrado correctamente.',
    });
  } catch (err) {
    console.error('[compras] registrar-pago', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/facturas/:id/anular */
router.post('/facturas/:id/anular', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de factura inválido');

    const pool = await getConnection();
    const row = await fetchFacturaById(pool, id);
    if (!row) return fail(res, 404, 'Factura no encontrada');
    if (String(row.estado) === 'Anulada') {
      return fail(res, 409, 'La factura ya está anulada.');
    }
    if (String(row.estado) === 'Pagada') {
      return fail(res, 409, 'Las facturas pagadas no se pueden anular.');
    }

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE FacturaProveedores SET estado = 'Anulada' WHERE id_factura_prov = @id
    `);

    const updated = await fetchFacturaById(pool, id);
    return sendSuccess(res, mapFacturaRow(updated), {
      message: 'Factura anulada correctamente.',
    });
  } catch (err) {
    console.error('[compras] anular factura', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

module.exports = router;
