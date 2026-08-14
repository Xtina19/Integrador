/**
 * API Compras — adaptada exclusivamente a public/scriptdb
 * Tablas: OrdenCompra, DetalleOrdenCompra, RecepcionOrdenCompra,
 *         DetalleRecepcionOrdenCompra, FacturaProveedores, CuentasPorPagar,
 *         Inventario, MovimientoInventario
 * Contrato FE: DTOs en comprasApi.ts (OrdenCompraDto, RecepcionDto, FacturaProveedorDto)
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { sendPaginated, sendSuccess } = require('../middlewares/successResponse');
const {
  addDaysIso,
  nextNumeroFacturaProveedor,
  ensureFacturaProveedorFromOrden,
  syncFacturaInternacionalPago,
  ensureCuentasPorPagar,
} = require('../lib/facturaProveedorScriptdb');
const { ensureScriptdbCompras } = require('../lib/ensureScriptdb');
const {
  ensureRecepcionPendienteFromOrden,
  ensureDetalleRecepcionFromOrden,
  aceptarLineasRecepcionPendientes,
  aplicarEntradaInventarioRecepcion,
} = require('../lib/entradaInventario');

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'UNEXPECTED', message },
  });
}

async function getPool() {
  const pool = await getConnection();
  await ensureScriptdbCompras(pool);
  return pool;
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
  const tipo = String(row.tipo_orden || '').trim();
  if (tipo === 'Internacional') return 'internacional';
  if (tipo === 'Nacional') return 'nacional';
  const codigo = String(row.codigo_orden || '').toUpperCase();
  const obs = String(row.observacion || row.oc_observacion || '');
  if (codigo.includes('INT') || /import/i.test(obs)) return 'internacional';
  return 'nacional';
}

function inferMonedaId(row) {
  return inferTipoCompra(row) === 'internacional' ? 3 : 1;
}

function mapRecepcionEstadoToDto(estado) {
  const e = String(estado || '').trim();
  if (e === 'Recibido') return 'confirmada';
  if (e === 'Recibido Parcial') return 'parcial';
  if (e === 'Rechazado') return 'rechazada';
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
    itemsRecibidos: Number(row.items_recibidos ?? 0),
  };
}

function mapFacturaRow(row) {
  const tipoRow = {
    ...row,
    observacion: row.oc_observacion ?? row.observacion,
    codigo_orden: row.codigo_orden,
    tipo_orden: row.tipo_orden,
  };
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
    tipoCompra: inferTipoCompra(tipoRow),
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
    cuentaPagarId: row.id_cuenta_pagar ?? null,
    montoPagado: Number(row.monto_pagado ?? 0),
    montoPendiente: Number(row.monto_pendiente ?? Math.max(0, total - Number(row.monto_pagado ?? 0))),
    estadoCxp: row.cxp_estado ?? null,
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
  await ensureScriptdbCompras(pool);
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
      observacion,
      tipo_orden
    FROM OrdenCompra
    WHERE id_orden_compra = @id
  `);
  const row = result.recordset[0];
  if (!row) return null;
  const detalles = await fetchOrdenDetalles(pool, id);
  return { row, detalles };
}

const RECEPCION_ITEMS_APPLY = `
      OUTER APPLY (
        SELECT ISNULL(SUM(d.cantidad_recibida), 0) AS items_recibidos
        FROM DetalleRecepcionOrdenCompra d
        WHERE d.id_recepcion = r.id_recepcion
      ) items
`;

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
      oc.observacion AS oc_observacion,
      items.items_recibidos
    FROM RecepcionOrdenCompra r
    INNER JOIN OrdenCompra oc ON oc.id_orden_compra = r.id_orden_compra
    ${RECEPCION_ITEMS_APPLY}
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

const FACTURA_CXP_APPLY = `
      OUTER APPLY (
        SELECT TOP 1
          c.id_cuenta_pagar,
          c.monto_pagado,
          c.monto_pendiente,
          c.estado AS cxp_estado
        FROM CuentasPorPagar c
        WHERE c.id_factura_prov = fp.id_factura_prov
        ORDER BY c.id_cuenta_pagar DESC
      ) cxp
`;

async function fetchFacturaById(pool, id) {
  await ensureScriptdbCompras(pool);
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
      oc.tipo_orden,
      oc.observacion AS oc_observacion,
      cxp.id_cuenta_pagar,
      cxp.monto_pagado,
      cxp.monto_pendiente,
      cxp.cxp_estado
    FROM FacturaProveedores fp
    INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
    ${FACTURA_CXP_APPLY}
    WHERE fp.id_factura_prov = @id
  `);
  return result.recordset[0] || null;
}

function totalsFromLineas(lineas, fallback) {
  if (!Array.isArray(lineas) || !lineas.length) {
    return {
      subtotal: Number(fallback?.subtotal ?? 0),
      impuestos: Number(fallback?.impuestos ?? 0),
      total: Number(fallback?.total ?? 0),
    };
  }
  let subtotal = 0;
  let impuestos = 0;
  for (const raw of lineas) {
    const qty = Number(raw.cantidad ?? raw.cantidadSolicitada ?? 0);
    const cost = Number(raw.costoUnitario ?? raw.precio_unitario ?? 0);
    const desc = Number(raw.descuento ?? 0);
    const imp = Number(raw.impuesto ?? 0);
    const lineSub = Math.max(0, qty * cost - desc);
    subtotal += lineSub;
    impuestos += imp;
  }
  return { subtotal, impuestos, total: subtotal + impuestos };
}

async function nextCodigoOrden(pool, tipoOrden) {
  const isInt = String(tipoOrden || '').trim() === 'Internacional';
  const pattern = isInt ? 'OC-INT-%' : 'OC-%';
  const result = await pool.request().input('pat', sql.VarChar(20), pattern).query(`
    SELECT MAX(TRY_CAST(
      CASE
        WHEN @pat LIKE 'OC-INT-%'
          THEN SUBSTRING(codigo_orden, 9, 10)
        ELSE SUBSTRING(codigo_orden, 4, 10)
      END AS INT)) AS max_num
    FROM OrdenCompra
    WHERE codigo_orden LIKE @pat
  `);
  const next = Number(result.recordset[0]?.max_num || 0) + 1;
  return isInt ? `OC-INT-${String(next).padStart(3, '0')}` : `OC-${String(next).padStart(3, '0')}`;
}

function mapEstadoOrdenFromBody(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'aprobada') return 'Aprobada';
  if (e === 'borrador') return 'Pendiente';
  if (e === 'pendiente_aprobacion' || e === 'pendiente') return 'Pendiente';
  return 'Pendiente';
}

function mapTipoOrdenFromBody(body) {
  const t = String(body.tipoCompra || body.tipo_orden || 'nacional').trim().toLowerCase();
  return t === 'internacional' ? 'Internacional' : 'Nacional';
}

/** POST /api/compras/ordenes — OrdenCompra + DetalleOrdenCompra (scriptdb) */
router.post('/ordenes', async (req, res) => {
  try {
    const body = req.body ?? {};
    const lineas = Array.isArray(body.lineas) ? body.lineas : [];
    if (!lineas.length) return fail(res, 400, 'La orden debe incluir al menos una línea de producto.');

    const proveedor = String(body.proveedorNombre || body.proveedor || '').trim();
    if (!proveedor) return fail(res, 400, 'El proveedor es obligatorio.');

    const idAlmacen = Number(body.sucursalId ?? body.id_almacen ?? body.almacenId ?? 1);
    if (!Number.isInteger(idAlmacen) || idAlmacen <= 0) {
      return fail(res, 400, 'Almacén destino inválido.');
    }

    const tipoOrden = mapTipoOrdenFromBody(body);
    const fechaEmision = body.fechaOrden || body.fecha_emision || new Date().toISOString().slice(0, 10);
    const fechaEntrega = body.fechaEntregaEstimada || body.fecha_entrega_est || null;
    const estado = mapEstadoOrdenFromBody(body.estado);
    const idUsuario = Number(body.id_usuario ?? body.usuarioId ?? 1) || 1;
    const observacion = body.observaciones ? String(body.observaciones).trim().slice(0, 255) : null;

    const pool = await getPool();
    const codigo = await nextCodigoOrden(pool, tipoOrden);

    const tx = new sql.Transaction(pool);
    await tx.begin();
    let newId;
    try {
      const ins = await new sql.Request(tx)
        .input('codigo', sql.VarChar(50), codigo)
        .input('almacen', sql.Int, idAlmacen)
        .input('prov', sql.VarChar(150), proveedor)
        .input('fechaEm', sql.Date, fechaEmision)
        .input('fechaEnt', sql.Date, fechaEntrega)
        .input('estado', sql.VarChar(50), estado)
        .input('tipo', sql.VarChar(50), tipoOrden)
        .input('obs', sql.VarChar(255), observacion)
        .input('usuario', sql.Int, idUsuario)
        .query(`
          INSERT INTO OrdenCompra (
            codigo_orden, id_almacen, proveedor, fecha_emision, fecha_entrega_est,
            subtotal, impuestos, total, estado, tipo_orden, observacion, id_usuario
          )
          OUTPUT INSERTED.id_orden_compra
          VALUES (
            @codigo, @almacen, @prov, @fechaEm, @fechaEnt,
            0, 0, 0, @estado, @tipo, @obs, @usuario
          )
        `);
      newId = ins.recordset[0].id_orden_compra;

      for (const raw of lineas) {
        const productoId = Number(raw.productoId ?? raw.id_producto);
        const cantidad = Math.round(Number(raw.cantidadSolicitada ?? raw.cantidad ?? 0));
        if (!Number.isInteger(productoId) || productoId <= 0) {
          throw new Error('Cada línea debe tener un producto válido.');
        }
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          throw new Error('Cada línea debe tener cantidad mayor a cero.');
        }
        await new sql.Request(tx)
          .input('ordenId', sql.Int, newId)
          .input('productoId', sql.Int, productoId)
          .input('cantidad', sql.Int, cantidad)
          .query(`
            INSERT INTO DetalleOrdenCompra (
              id_orden_compra, id_producto, cantidad, precio_unitario, subtotal
            )
            VALUES (@ordenId, @productoId, @cantidad, 0, 0)
          `);
      }
      await tx.commit();
    } catch (inner) {
      await tx.rollback();
      throw inner;
    }

    const orden = await fetchOrdenById(pool, newId);
    return sendSuccess(res, mapOrdenRow(orden.row, orden.detalles), {
      status: 201,
      message: 'Orden de compra registrada correctamente.',
    });
  } catch (err) {
    console.error('[compras] crear orden', err);
    const msg = err?.message?.includes('producto') || err?.message?.includes('cantidad')
      ? err.message
      : 'Error de base de datos';
    return fail(res, 500, msg);
  }
});

/** GET /api/compras/ordenes */
router.get('/ordenes', async (req, res) => {
  try {
    const pool = await getPool();
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
        observacion,
        tipo_orden
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

/** GET /api/compras/ordenes/:id */
router.get('/ordenes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de orden inválido');

    const pool = await getPool();
    const orden = await fetchOrdenById(pool, id);
    if (!orden) return fail(res, 404, 'Orden no encontrada');

    return sendSuccess(res, mapOrdenRow(orden.row, orden.detalles), {
      message: 'Orden de compra obtenida correctamente.',
    });
  } catch (err) {
    console.error('[compras] get orden', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/ordenes/:id/aprobar — OrdenCompra (scriptdb) */
router.post('/ordenes/:id/aprobar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de orden inválido');

    const pool = await getPool();
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

    if (inferTipoCompra(orden.row) === 'internacional') {
      await ensureFacturaProveedorFromOrden(pool, id);
    } else {
      const idUsuario = Number(req.user?.id ?? req.user?.userId ?? 1) || 1;
      await ensureRecepcionPendienteFromOrden(
        pool,
        id,
        orden.row.id_almacen,
        idUsuario,
      );
    }

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
    const pool = await getPool();
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
        oc.observacion AS oc_observacion,
        items.items_recibidos
      FROM RecepcionOrdenCompra r
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = r.id_orden_compra
      ${RECEPCION_ITEMS_APPLY}
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

/** POST /api/compras/recepciones/:id/confirmar — RecepcionOrdenCompra + Inventario (scriptdb) */
router.post('/recepciones/:id/confirmar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de recepción inválido');

    const pool = await getPool();
    const row = await fetchRecepcionById(pool, id);
    if (!row) return fail(res, 404, 'Recepción no encontrada');
    if (String(row.estado) === 'Recibido' || String(row.estado) === 'Recibido Parcial') {
      return fail(res, 409, 'La recepción ya está confirmada.');
    }
    if (String(row.estado) === 'Rechazado') {
      return fail(res, 409, 'No se puede confirmar una recepción rechazada.');
    }

    const nuevoEstado = mapResultadoToEstadoScriptdb(req.body?.resultadoInspeccion);
    const idUsuario = Number(req.user?.id ?? req.user?.userId ?? row.id_usuario_recibe ?? 1) || 1;

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('id', sql.Int, id)
        .input('estado', sql.VarChar(50), nuevoEstado)
        .query(`UPDATE RecepcionOrdenCompra SET estado = @estado WHERE id_recepcion = @id`);

      if (nuevoEstado === 'Recibido' || nuevoEstado === 'Recibido Parcial') {
        await ensureDetalleRecepcionFromOrden(pool, id, { tx, setRecibida: false });
        await aceptarLineasRecepcionPendientes(pool, id, { tx });
        await aplicarEntradaInventarioRecepcion(pool, id, { tx, idUsuario });
      }

      if (nuevoEstado === 'Recibido') {
        await new sql.Request(tx)
          .input('ordenId', sql.Int, row.id_orden_compra)
          .query(`
            UPDATE OrdenCompra
            SET estado = 'Recibida'
            WHERE id_orden_compra = @ordenId AND estado NOT IN ('Cancelada', 'Recibida')
          `);
      }

      await tx.commit();
    } catch (inner) {
      try { await tx.rollback(); } catch { /* noop */ }
      throw inner;
    }

    const updated = await fetchRecepcionById(pool, id);
    return sendSuccess(res, mapRecepcionRow(updated), {
      message: 'Recepción confirmada. El stock se actualizó en inventario.',
    });
  } catch (err) {
    console.error('[compras] confirmar recepcion', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /api/compras/facturas */
router.get('/facturas', async (req, res) => {
  try {
    const pool = await getPool();
    await ensureCuentasPorPagar(pool);
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
        oc.tipo_orden,
        oc.observacion AS oc_observacion,
        cxp.id_cuenta_pagar,
        cxp.monto_pagado,
        cxp.monto_pendiente,
        cxp.cxp_estado
      FROM FacturaProveedores fp
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
      ${FACTURA_CXP_APPLY}
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

/** POST /api/compras/facturas — FacturaProveedores + CuentasPorPagar (scriptdb) */
router.post('/facturas', async (req, res) => {
  try {
    const body = req.body ?? {};
    const ordenCompraId = Number(body.ordenCompraId);
    if (!Number.isInteger(ordenCompraId) || ordenCompraId <= 0) {
      return fail(res, 400, 'ordenCompraId es obligatorio.');
    }

    const pool = await getPool();
    const orden = await fetchOrdenById(pool, ordenCompraId);
    if (!orden) return fail(res, 404, 'Orden de compra no encontrada.');

    const isInternacional = inferTipoCompra(orden.row) === 'internacional';

    if (!isInternacional) {
      const recepcionOk = await pool.request().input('ordenId', sql.Int, ordenCompraId).query(`
        SELECT TOP 1 id_recepcion
        FROM RecepcionOrdenCompra
        WHERE id_orden_compra = @ordenId AND estado = 'Recibido'
      `);
      if (!recepcionOk.recordset[0]) {
        return fail(res, 409, 'La orden debe tener una recepción confirmada antes de facturar.');
      }
    } else if (!['Aprobada', 'Recibida'].includes(String(orden.row.estado || '').trim())) {
      return fail(res, 409, 'La orden internacional debe estar aprobada para registrar la factura.');
    }

    const dup = await pool.request().input('ordenId', sql.Int, ordenCompraId).query(`
      SELECT TOP 1 id_factura_prov
      FROM FacturaProveedores
      WHERE id_orden_compra = @ordenId AND estado <> 'Anulada'
    `);
    if (dup.recordset[0]) {
      return fail(res, 409, 'Esta orden ya tiene una factura registrada.');
    }

    const fechaEmision = body.fechaEmision || new Date().toISOString().slice(0, 10);
    const fechaVencimiento = body.fechaVencimiento || addDaysIso(fechaEmision, 30);
    const totals = { subtotal: 0, impuestos: 0, total: 0 };
    const numeroFactura = await nextNumeroFacturaProveedor(pool);
    const ncf = body.ncf ? String(body.ncf).trim() : '';
    const obsParts = [];
    if (ncf) obsParts.push(`NCF: ${ncf}`);
    if (body.fechaRecepcionDocumento) {
      obsParts.push(`Recep. doc: ${String(body.fechaRecepcionDocumento).slice(0, 10)}`);
    }
    if (body.observaciones) obsParts.push(String(body.observaciones).trim());
    const observacion = obsParts.join(' | ').slice(0, 255) || null;

    const tx = new sql.Transaction(pool);
    await tx.begin();
    let newId;
    try {
      const ins = await new sql.Request(tx)
        .input('ordenId', sql.Int, ordenCompraId)
        .input('numero', sql.VarChar(100), numeroFactura)
        .input('prov', sql.VarChar(150), orden.row.proveedor)
        .input('fechaEm', sql.Date, fechaEmision)
        .input('fechaVen', sql.Date, fechaVencimiento)
        .input('subtotal', sql.Decimal(12, 2), totals.subtotal)
        .input('impuestos', sql.Decimal(12, 2), totals.impuestos)
        .input('total', sql.Decimal(12, 2), totals.total)
        .input('obs', sql.VarChar(255), observacion)
        .query(`
          INSERT INTO FacturaProveedores (
            id_orden_compra, numero_factura, proveedor, fecha_emision, fecha_vencimiento,
            subtotal, impuestos, total, estado, observacion
          )
          OUTPUT INSERTED.id_factura_prov
          VALUES (
            @ordenId, @numero, @prov, @fechaEm, @fechaVen,
            @subtotal, @impuestos, @total, 'Pendiente', @obs
          )
        `);
      newId = ins.recordset[0].id_factura_prov;

      await new sql.Request(tx)
        .input('id', sql.Int, newId)
        .input('total', sql.Decimal(12, 2), totals.total)
        .input('venc', sql.Date, fechaVencimiento)
        .input('obs', sql.VarChar(255), observacion)
        .query(`
          INSERT INTO CuentasPorPagar (
            id_factura_prov, monto_total, monto_pagado, fecha_vencimiento, estado, observacion
          )
          VALUES (@id, @total, 0, @venc, 'Pendiente', @obs)
        `);

      await tx.commit();
    } catch (inner) {
      await tx.rollback();
      throw inner;
    }

    const created = await fetchFacturaById(pool, newId);
    return sendSuccess(res, mapFacturaRow(created), {
      status: 201,
      message: 'Factura de proveedor registrada correctamente.',
    });
  } catch (err) {
    console.error('[compras] registrar factura', err);
    if (String(err?.message || '').includes('UNIQUE')) {
      return fail(res, 409, 'Ese número de factura ya existe.');
    }
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /api/compras/facturas/por-orden/:ordenId */
router.get('/facturas/por-orden/:ordenId', async (req, res) => {
  try {
    const ordenId = Number(req.params.ordenId);
    if (!Number.isInteger(ordenId) || ordenId <= 0) return fail(res, 400, 'Id de orden inválido');

    const pool = await getPool();
    const result = await pool.request().input('ordenId', sql.Int, ordenId).query(`
      SELECT TOP 1
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
        oc.tipo_orden,
        oc.observacion AS oc_observacion
      FROM FacturaProveedores fp
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
      WHERE fp.id_orden_compra = @ordenId AND fp.estado <> 'Anulada'
      ORDER BY fp.id_factura_prov DESC
    `);

    const row = result.recordset[0];
    return sendSuccess(res, row ? mapFacturaRow(row) : null, {
      message: row ? 'Factura encontrada.' : 'Sin factura activa para la orden.',
    });
  } catch (err) {
    console.error('[compras] get factura por orden', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /api/compras/facturas/:id */
router.get('/facturas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de factura inválido');

    const pool = await getPool();
    const row = await fetchFacturaById(pool, id);
    if (!row) return fail(res, 404, 'Factura no encontrada');

    return sendSuccess(res, mapFacturaRow(row), { message: 'Factura obtenida correctamente.' });
  } catch (err) {
    console.error('[compras] get factura', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /api/compras/facturas/:id/registrar-pago — FacturaProveedores + CuentasPorPagar (scriptdb) */
router.post('/facturas/:id/registrar-pago', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de factura inválido');

    const body = req.body ?? {};
    const montoTotal = Number(body.total ?? body.monto ?? body.montoTotal);
    if (!montoTotal || Number.isNaN(montoTotal) || montoTotal <= 0) {
      return fail(res, 400, 'Indique el monto total de la factura al registrar el pago.');
    }
    const subtotal = Number(body.subtotal ?? montoTotal);
    const impuestos = Number(body.impuestos ?? 0);

    const pool = await getPool();
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
        .input('subtotal', sql.Decimal(12, 2), subtotal)
        .input('impuestos', sql.Decimal(12, 2), impuestos)
        .input('total', sql.Decimal(12, 2), montoTotal)
        .query(`
          UPDATE FacturaProveedores
          SET subtotal = @subtotal,
              impuestos = @impuestos,
              total = @total,
              estado = 'Pagada'
          WHERE id_factura_prov = @id
        `);

      const cxpCheck = await new sql.Request(tx)
        .input('id', sql.Int, id)
        .query(`SELECT id_cuenta_pagar, monto_total FROM CuentasPorPagar WHERE id_factura_prov = @id`);

      if (cxpCheck.recordset.length) {
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .input('total', sql.Decimal(12, 2), montoTotal)
          .query(`
            UPDATE CuentasPorPagar
            SET monto_total = @total,
                monto_pagado = @total,
                estado = 'Pagado',
                fecha_ultimo_pago = GETDATE()
            WHERE id_factura_prov = @id
          `);
      } else {
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .input('total', sql.Decimal(12, 2), montoTotal)
          .input('venc', sql.Date, row.fecha_vencimiento || new Date())
          .query(`
            INSERT INTO CuentasPorPagar (
              id_factura_prov, monto_total, monto_pagado,
              fecha_vencimiento, estado, fecha_ultimo_pago, observacion
            )
            VALUES (@id, @total, @total, @venc, 'Pagado', GETDATE(), 'Pago registrado')
          `);
      }

      await syncFacturaInternacionalPago(pool, id, montoTotal, tx);

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

    const pool = await getPool();
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
    await pool.request().input('id', sql.Int, id).query(`
      UPDATE CuentasPorPagar
      SET observacion = LEFT(CONCAT(ISNULL(observacion, ''), ' | Factura anulada'), 255)
      WHERE id_factura_prov = @id
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

/** GET /api/compras/cuentas-por-pagar — CuentasPorPagar + FacturaProveedores (scriptdb) */
router.get('/cuentas-por-pagar', async (req, res) => {
  try {
    const pool = await getPool();
    await ensureCuentasPorPagar(pool);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 200));
    const offset = (page - 1) * pageSize;
    const estado = req.query.estado ? String(req.query.estado).trim() : '';

    const ESTADOS_CXP = ['Pendiente', 'Pagado Parcial', 'Pagado', 'Vencido'];
    const estadoFiltro = ESTADOS_CXP.includes(estado) ? estado : '';

    const countResult = await pool.request().input('estado', sql.VarChar(50), estadoFiltro).query(`
      SELECT COUNT(*) AS total
      FROM CuentasPorPagar cxp
      INNER JOIN FacturaProveedores fp ON fp.id_factura_prov = cxp.id_factura_prov
      WHERE fp.estado <> 'Anulada'
        AND (@estado = '' OR cxp.estado = @estado)
    `);
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const result = await pool.request().input('estado', sql.VarChar(50), estadoFiltro).query(`
      SELECT
        cxp.id_cuenta_pagar,
        cxp.id_factura_prov,
        cxp.monto_total,
        cxp.monto_pagado,
        cxp.monto_pendiente,
        cxp.fecha_vencimiento,
        cxp.estado,
        cxp.fecha_ultimo_pago,
        cxp.observacion,
        fp.numero_factura,
        fp.proveedor,
        fp.estado AS factura_estado,
        fp.fecha_emision,
        oc.codigo_orden,
        oc.tipo_orden,
        oc.observacion AS oc_observacion
      FROM CuentasPorPagar cxp
      INNER JOIN FacturaProveedores fp ON fp.id_factura_prov = cxp.id_factura_prov
      INNER JOIN OrdenCompra oc ON oc.id_orden_compra = fp.id_orden_compra
      WHERE fp.estado <> 'Anulada'
        AND (@estado = '' OR cxp.estado = @estado)
      ORDER BY
        CASE cxp.estado WHEN 'Pendiente' THEN 0 WHEN 'Pagado Parcial' THEN 1 WHEN 'Vencido' THEN 2 ELSE 3 END,
        cxp.fecha_vencimiento ASC,
        cxp.id_cuenta_pagar DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `);

    const data = result.recordset.map((row) => ({
      id: row.id_cuenta_pagar,
      facturaId: row.id_factura_prov,
      numeroFactura: row.numero_factura,
      proveedor: row.proveedor,
      ordenCodigo: row.codigo_orden,
      tipoCompra: inferTipoCompra(row),
      fechaEmision: row.fecha_emision,
      fechaVencimiento: row.fecha_vencimiento,
      fechaUltimoPago: row.fecha_ultimo_pago,
      montoTotal: Number(row.monto_total ?? 0),
      montoPagado: Number(row.monto_pagado ?? 0),
      montoPendiente: Number(row.monto_pendiente ?? 0),
      estado: row.estado,
      facturaEstado: row.factura_estado,
      observacion: row.observacion ?? null,
    }));

    return sendPaginated(res, data, { page, pageSize, total }, 'Cuentas por pagar listadas correctamente.');
  } catch (err) {
    console.error('[compras] list cuentas por pagar', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

module.exports = router;
