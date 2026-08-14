/**
 * Entrada de stock desde RecepcionOrdenCompra — public/scriptdb
 * Tablas: RecepcionOrdenCompra, DetalleRecepcionOrdenCompra, DetalleOrdenCompra,
 *         Inventario, MovimientoInventario, AuditoriaInventario
 *
 * Puente oficial: MovimientoInventario.documento_tipo = 'recepcion'
 *                 MovimientoInventario.documento_id   = RecepcionOrdenCompra.id_recepcion
 */
const { sql } = require('../db');

function makeRequest(pool, tx) {
  return () => (tx ? new sql.Request(tx) : pool.request());
}

/**
 * Copia DetalleOrdenCompra → DetalleRecepcionOrdenCompra si la recepción no tiene líneas.
 * @param {{ setRecibida?: boolean }} [options] setRecibida=true deja cantidad_recibida = cantidad OC.
 */
async function ensureDetalleRecepcionFromOrden(pool, idRecepcion, options = {}) {
  const tx = options.tx;
  const req = makeRequest(pool, tx);
  const setRecibida = Boolean(options.setRecibida);

  const existing = await req().input('id', sql.Int, idRecepcion).query(`
    SELECT TOP 1 id_detalle_recepcion
    FROM DetalleRecepcionOrdenCompra
    WHERE id_recepcion = @id
  `);
  if (existing.recordset[0]) return;

  await req()
    .input('id', sql.Int, idRecepcion)
    .query(`
      INSERT INTO DetalleRecepcionOrdenCompra (
        id_recepcion, id_producto, cantidad_esperada, cantidad_recibida,
        cantidad_con_dano, precio_unitario, observacion
      )
      SELECT
        r.id_recepcion,
        d.id_producto,
        d.cantidad,
        CASE WHEN ${setRecibida ? 1 : 0} = 1 THEN d.cantidad ELSE 0 END,
        0,
        d.precio_unitario,
        NULL
      FROM RecepcionOrdenCompra r
      INNER JOIN DetalleOrdenCompra d ON d.id_orden_compra = r.id_orden_compra
      WHERE r.id_recepcion = @id
        AND NOT EXISTS (
          SELECT 1
          FROM DetalleRecepcionOrdenCompra x
          WHERE x.id_recepcion = r.id_recepcion AND x.id_producto = d.id_producto
        )
    `);
}

/**
 * Crea recepción pendiente (nacional) al aprobar la OC. No mueve stock.
 */
async function ensureRecepcionPendienteFromOrden(pool, idOrden, idAlmacen, idUsuario = 1, options = {}) {
  const tx = options.tx;
  const req = makeRequest(pool, tx);

  const existing = await req().input('idOrden', sql.Int, idOrden).query(`
    SELECT TOP 1 id_recepcion
    FROM RecepcionOrdenCompra
    WHERE id_orden_compra = @idOrden
    ORDER BY id_recepcion DESC
  `);
  if (existing.recordset[0]) return existing.recordset[0];

  const ins = await req()
    .input('idOrden', sql.Int, idOrden)
    .input('idAlm', sql.Int, idAlmacen)
    .input('idUsr', sql.Int, idUsuario || 1)
    .query(`
      INSERT INTO RecepcionOrdenCompra (
        id_orden_compra, id_almacen, id_usuario_recibe, estado, observacion
      )
      OUTPUT INSERTED.*
      VALUES (@idOrden, @idAlm, @idUsr, 'Pendiente', NULL)
    `);

  const rec = ins.recordset[0];
  if (rec?.id_recepcion) {
    await ensureDetalleRecepcionFromOrden(pool, rec.id_recepcion, { tx, setRecibida: false });
  }
  return rec;
}

/**
 * Acepta líneas pendientes (cantidad_recibida = esperada) al confirmar recepción completa.
 */
async function aceptarLineasRecepcionPendientes(pool, idRecepcion, options = {}) {
  const tx = options.tx;
  const req = makeRequest(pool, tx);
  await req().input('id', sql.Int, idRecepcion).query(`
    UPDATE DetalleRecepcionOrdenCompra
    SET cantidad_recibida = cantidad_esperada
    WHERE id_recepcion = @id
      AND ISNULL(cantidad_recibida, 0) = 0
      AND cantidad_esperada > 0
  `);
}

/**
 * Incrementa Inventario y registra MovimientoInventario (idempotente por documento recepción).
 */
async function aplicarEntradaInventarioRecepcion(pool, idRecepcion, options = {}) {
  const tx = options.tx;
  const req = makeRequest(pool, tx);
  const idUsuarioFallback = Number(options.idUsuario || 1);

  const header = await req().input('id', sql.Int, idRecepcion).query(`
    SELECT id_recepcion, id_orden_compra, id_almacen, id_usuario_recibe, estado
    FROM RecepcionOrdenCompra
    WHERE id_recepcion = @id
  `);
  const rec = header.recordset[0];
  if (!rec) return { applied: false, reason: 'not_found' };

  const estado = String(rec.estado || '').trim();
  if (estado !== 'Recibido' && estado !== 'Recibido Parcial') {
    return { applied: false, reason: 'estado' };
  }

  const yaMov = await req()
    .input('idRec', sql.Int, idRecepcion)
    .input('idOrden', sql.Int, rec.id_orden_compra)
    .query(`
      SELECT TOP 1 id_movimiento
      FROM MovimientoInventario
      WHERE (documento_tipo = 'recepcion' AND documento_id = @idRec)
         OR (documento_tipo = 'OrdenCompra' AND documento_id = @idOrden)
    `);
  if (yaMov.recordset[0]) return { applied: false, reason: 'already' };

  await ensureDetalleRecepcionFromOrden(pool, idRecepcion, { tx, setRecibida: true });

  const detalles = await req().input('id', sql.Int, idRecepcion).query(`
    SELECT id_producto, cantidad_recibida, cantidad_con_dano
    FROM DetalleRecepcionOrdenCompra
    WHERE id_recepcion = @id
  `);

  const idAlmacen = rec.id_almacen;
  const idUsuario = rec.id_usuario_recibe || idUsuarioFallback;
  let lineas = 0;

  for (const line of detalles.recordset) {
    const qty = Math.max(
      0,
      Number(line.cantidad_recibida || 0) - Number(line.cantidad_con_dano || 0),
    );
    if (qty <= 0) continue;

    const invRes = await req()
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .query(`
        SELECT id_inventario, stock_actual
        FROM Inventario WITH (UPDLOCK, HOLDLOCK)
        WHERE id_producto = @prod AND id_almacen = @alm
      `);

    let idInventario;
    let saldoAnterior;
    if (invRes.recordset[0]) {
      idInventario = invRes.recordset[0].id_inventario;
      saldoAnterior = Number(invRes.recordset[0].stock_actual || 0);
      const saldoPosterior = saldoAnterior + qty;
      await req()
        .input('idInv', sql.Int, idInventario)
        .input('stock', sql.Int, saldoPosterior)
        .query(`
          UPDATE Inventario
          SET stock_actual = @stock,
              version = version + 1,
              fecha_actualizacion = SYSDATETIME()
          WHERE id_inventario = @idInv
        `);
    } else {
      saldoAnterior = 0;
      const insInv = await req()
        .input('prod', sql.Int, line.id_producto)
        .input('alm', sql.Int, idAlmacen)
        .input('stock', sql.Int, qty)
        .query(`
          INSERT INTO Inventario (
            id_producto, id_almacen, stock_actual, stock_minimo, ubicacion
          )
          OUTPUT INSERTED.id_inventario
          VALUES (@prod, @alm, @stock, 0, 'Recepción OC')
        `);
      idInventario = insInv.recordset[0].id_inventario;
    }

    const saldoPosterior = saldoAnterior + qty;
    const mov = await req()
      .input('idInv', sql.Int, idInventario)
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .input('usr', sql.Int, idUsuario)
      .input('qty', sql.Int, qty)
      .input('ant', sql.Int, saldoAnterior)
      .input('post', sql.Int, saldoPosterior)
      .input('docId', sql.Int, idRecepcion)
      .query(`
        INSERT INTO MovimientoInventario (
          id_inventario, id_producto, id_almacen, id_usuario,
          tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
          documento_tipo, documento_id, motivo_codigo, observacion
        )
        OUTPUT INSERTED.id_movimiento
        VALUES (
          @idInv, @prod, @alm, @usr,
          'entrada', @qty, @ant, @post,
          'recepcion', @docId, 'RECEPCION_OC', 'Entrada por recepción de compra'
        )
      `);

    const idMovimiento = mov.recordset[0]?.id_movimiento ?? null;
    await req()
      .input('usr', sql.Int, idUsuario)
      .input('idMov', sql.Int, idMovimiento)
      .input('docId', sql.Int, idRecepcion)
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .query(`
        INSERT INTO AuditoriaInventario (
          id_usuario, tipo_accion, id_movimiento, documento_tipo, documento_id,
          id_producto, id_almacen, resultado, detalle
        )
        VALUES (
          @usr, 'ENTRADA_RECEPCION', @idMov, 'recepcion', @docId,
          @prod, @alm, 'OK', 'Entrada de stock por RecepcionOrdenCompra'
        )
      `);

    lineas += 1;
  }

  return { applied: lineas > 0, lineas };
}

module.exports = {
  ensureDetalleRecepcionFromOrden,
  ensureRecepcionPendienteFromOrden,
  aceptarLineasRecepcionPendientes,
  aplicarEntradaInventarioRecepcion,
};
