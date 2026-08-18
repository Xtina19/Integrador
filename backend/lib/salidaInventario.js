/**
 * Salida de stock desde FacturaVenta — public/scriptdb
 * Tablas: FacturaVenta, DetalleFacturaVenta, Inventario, MovimientoInventario, AuditoriaInventario
 *
 * Puente oficial: MovimientoInventario.documento_tipo = 'venta'
 *                 MovimientoInventario.documento_id   = FacturaVenta.id_factura
 *                 MovimientoInventario.id_factura_venta / id_detalle_factura
 */
const { sql } = require('../db')

function makeRequest(pool, tx) {
  return () => (tx ? new sql.Request(tx) : pool.request())
}

/**
 * Descuenta Inventario.stock_actual e inserta MovimientoInventario por cada línea de la factura.
 * Idempotente: si ya hay movimientos con id_factura_venta, no vuelve a descontar.
 *
 * @param {import('mssql').ConnectionPool} pool
 * @param {number} idFactura
 * @param {{ tx?: import('mssql').Transaction, idUsuario?: number }} [options]
 */
async function aplicarSalidaInventarioVenta(pool, idFactura, options = {}) {
  const tx = options.tx
  const req = makeRequest(pool, tx)
  const idUsuarioFallback = Number(options.idUsuario || 1)

  const header = await req().input('id', sql.Int, idFactura).query(`
    SELECT id_factura, id_almacen, id_usuario_emision, estado
    FROM FacturaVenta
    WHERE id_factura = @id
  `)
  const fac = header.recordset[0]
  if (!fac) return { applied: false, reason: 'not_found' }

  const estado = String(fac.estado || '').trim().toLowerCase()
  if (estado === 'anulada' || estado === 'anulado') {
    return { applied: false, reason: 'anulada' }
  }

  const yaMov = await req().input('idFac', sql.Int, idFactura).query(`
    SELECT TOP 1 id_movimiento
    FROM MovimientoInventario
    WHERE documento_tipo = 'venta' AND documento_id = @idFac
  `)
  if (yaMov.recordset[0]) return { applied: false, reason: 'already' }

  const detalles = await req().input('id', sql.Int, idFactura).query(`
    SELECT id_detalle, id_producto, id_inventario, cantidad, descripcion_snapshot
    FROM DetalleFacturaVenta
    WHERE id_factura = @id
    ORDER BY id_detalle
  `)

  const idAlmacen = fac.id_almacen
  const idUsuario = fac.id_usuario_emision || idUsuarioFallback
  let lineas = 0

  for (const line of detalles.recordset) {
    const qty = Math.max(0, Number(line.cantidad || 0))
    if (qty <= 0) continue

    const invRes = await req()
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .query(`
        SELECT id_inventario, stock_actual
        FROM Inventario WITH (UPDLOCK, HOLDLOCK)
        WHERE id_producto = @prod AND id_almacen = @alm
      `)

    if (!invRes.recordset[0]) {
      const titulo = line.descripcion_snapshot || `producto ${line.id_producto}`
      throw new Error(`Sin existencia en inventario para ${titulo} (almacén ${idAlmacen}).`)
    }

    const idInventario = invRes.recordset[0].id_inventario
    const saldoAnterior = Number(invRes.recordset[0].stock_actual || 0)
    if (saldoAnterior < qty) {
      const titulo = line.descripcion_snapshot || `producto ${line.id_producto}`
      throw new Error(
        `Stock insuficiente para ${titulo}. Disponible: ${saldoAnterior}, solicitado: ${qty}.`,
      )
    }

    const saldoPosterior = saldoAnterior - qty
    await req()
      .input('idInv', sql.Int, idInventario)
      .input('stock', sql.Int, saldoPosterior)
      .query(`
        UPDATE Inventario
        SET stock_actual = @stock,
            version = version + 1,
            fecha_actualizacion = SYSDATETIME()
        WHERE id_inventario = @idInv
      `)

    if (!line.id_inventario) {
      await req()
        .input('idDet', sql.Int, line.id_detalle)
        .input('idInv', sql.Int, idInventario)
        .query(`
          UPDATE DetalleFacturaVenta
          SET id_inventario = @idInv
          WHERE id_detalle = @idDet
        `)
    }

    const mov = await req()
      .input('idInv', sql.Int, idInventario)
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .input('usr', sql.Int, idUsuario)
      .input('qty', sql.Int, qty)
      .input('ant', sql.Int, saldoAnterior)
      .input('post', sql.Int, saldoPosterior)
      .input('docId', sql.Int, idFactura)
      .input('idFac', sql.Int, idFactura)
      .input('idDet', sql.Int, line.id_detalle)
      .query(`
        INSERT INTO MovimientoInventario (
          id_inventario, id_producto, id_almacen, id_usuario,
          tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
          documento_tipo, documento_id, id_factura_venta, id_detalle_factura,
          motivo_codigo, observacion
        )
        OUTPUT INSERTED.id_movimiento
        VALUES (
          @idInv, @prod, @alm, @usr,
          'salida', @qty, @ant, @post,
          'venta', @docId, @idFac, @idDet,
          'VENTA', 'Salida por FacturaVenta'
        )
      `)

    const idMovimiento = mov.recordset[0]?.id_movimiento ?? null
    await req()
      .input('usr', sql.Int, idUsuario)
      .input('idMov', sql.Int, idMovimiento)
      .input('docId', sql.Int, idFactura)
      .input('prod', sql.Int, line.id_producto)
      .input('alm', sql.Int, idAlmacen)
      .query(`
        INSERT INTO AuditoriaInventario (
          id_usuario, tipo_accion, id_movimiento, documento_tipo, documento_id,
          id_producto, id_almacen, resultado, detalle
        )
        VALUES (
          @usr, 'SALIDA_VENTA', @idMov, 'venta', @docId,
          @prod, @alm, 'OK', 'Salida de stock por FacturaVenta'
        )
      `)

    lineas += 1
  }

  return { applied: lineas > 0, lineas }
}

/**
 * Misma lógica usando SqlExecutor de Ventas (?, misma transacción de save).
 * @param {{ query: Function }} sqlExec
 * @param {number} idFactura
 * @param {{ idUsuario?: number }} [options]
 */
async function aplicarSalidaInventarioVentaSql(sqlExec, idFactura, options = {}) {
  const idUsuarioFallback = Number(options.idUsuario || 1)

  const header = await sqlExec.query(
    `SELECT id_factura, id_almacen, id_usuario_emision, estado
     FROM FacturaVenta WHERE id_factura = ?`,
    [idFactura],
  )
  const fac = header.rows[0]
  if (!fac) return { applied: false, reason: 'not_found' }

  const estado = String(fac.estado || '').trim().toLowerCase()
  if (estado === 'anulada' || estado === 'anulado') {
    return { applied: false, reason: 'anulada' }
  }

  const yaMov = await sqlExec.query(
    `SELECT TOP 1 id_movimiento
     FROM MovimientoInventario
     WHERE documento_tipo = 'venta' AND documento_id = ?`,
    [idFactura],
  )
  if (yaMov.rows[0]) return { applied: false, reason: 'already' }

  const detalles = await sqlExec.query(
    `SELECT id_detalle, id_producto, id_inventario, cantidad, descripcion_snapshot
     FROM DetalleFacturaVenta
     WHERE id_factura = ?
     ORDER BY id_detalle`,
    [idFactura],
  )

  const idAlmacen = Number(fac.id_almacen)
  const idUsuario = Number(fac.id_usuario_emision || idUsuarioFallback)
  let lineas = 0

  for (const line of detalles.rows) {
    const qty = Math.max(0, Number(line.cantidad || 0))
    if (qty <= 0) continue

    const invRes = await sqlExec.query(
      `SELECT id_inventario, stock_actual
       FROM Inventario WITH (UPDLOCK, HOLDLOCK)
       WHERE id_producto = ? AND id_almacen = ?`,
      [Number(line.id_producto), idAlmacen],
    )

    if (!invRes.rows[0]) {
      const titulo = line.descripcion_snapshot || `producto ${line.id_producto}`
      throw new Error(`Sin existencia en inventario para ${titulo} (almacén ${idAlmacen}).`)
    }

    const idInventario = Number(invRes.rows[0].id_inventario)
    const saldoAnterior = Number(invRes.rows[0].stock_actual || 0)
    if (saldoAnterior < qty) {
      const titulo = line.descripcion_snapshot || `producto ${line.id_producto}`
      throw new Error(
        `Stock insuficiente para ${titulo}. Disponible: ${saldoAnterior}, solicitado: ${qty}.`,
      )
    }

    const saldoPosterior = saldoAnterior - qty
    await sqlExec.query(
      `UPDATE Inventario
       SET stock_actual = ?,
           version = version + 1,
           fecha_actualizacion = SYSDATETIME()
       WHERE id_inventario = ?`,
      [saldoPosterior, idInventario],
    )

    if (!line.id_inventario) {
      await sqlExec.query(
        `UPDATE DetalleFacturaVenta SET id_inventario = ? WHERE id_detalle = ?`,
        [idInventario, Number(line.id_detalle)],
      )
    }

    const mov = await sqlExec.query(
      `INSERT INTO MovimientoInventario (
          id_inventario, id_producto, id_almacen, id_usuario,
          tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
          documento_tipo, documento_id, id_factura_venta, id_detalle_factura,
          motivo_codigo, observacion
        )
        OUTPUT INSERTED.id_movimiento
        VALUES (?, ?, ?, ?, 'salida', ?, ?, ?, 'venta', ?, ?, ?, 'VENTA', 'Salida por FacturaVenta')`,
      [
        idInventario,
        Number(line.id_producto),
        idAlmacen,
        idUsuario,
        qty,
        saldoAnterior,
        saldoPosterior,
        idFactura,
        idFactura,
        Number(line.id_detalle),
      ],
    )

    const idMovimiento = mov.insertId || Number(mov.rows[0]?.id_movimiento) || null
    await sqlExec.query(
      `INSERT INTO AuditoriaInventario (
          id_usuario, tipo_accion, id_movimiento, documento_tipo, documento_id,
          id_producto, id_almacen, resultado, detalle
        )
        VALUES (?, 'SALIDA_VENTA', ?, 'venta', ?, ?, ?, 'OK', 'Salida de stock por FacturaVenta')`,
      [idUsuario, idMovimiento, idFactura, Number(line.id_producto), idAlmacen],
    )

    lineas += 1
  }

  return { applied: lineas > 0, lineas }
}

module.exports = {
  aplicarSalidaInventarioVenta,
  aplicarSalidaInventarioVentaSql,
}
