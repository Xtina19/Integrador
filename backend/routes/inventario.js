const express = require('express')
const router = express.Router()
const { sql, getConnection } = require('../db')

// ============================================================
// UTILIDADES GENERALES
// ============================================================
async function obtenerUsuarioOperacion(
  transaction,
  referencia,
) {
  if (!referencia) {
    return null
  }

  const result =
    await new sql.Request(transaction)
      .input(
        'referencia',
        sql.VarChar(100),
        String(referencia).trim(),
      )
      .query(`
        SELECT TOP 1
          id_usuario,
          nombre_usuario,
          correo
        FROM Usuario
        WHERE
          estado = 'Activo'
          AND (
            nombre_usuario = @referencia
            OR (
              TRY_CONVERT(INT, @referencia)
                IS NOT NULL
              AND id_usuario =
                TRY_CONVERT(
                  INT,
                  @referencia
                )
            )
          )
      `)

  return result.recordset[0] ?? null
}
function generarCodigoTransferencia() {
  const fecha = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')

  const secuencia = String(Date.now())
    .slice(-6)

  return `TRF-${fecha}-${secuencia}`
}

function generarCodigoConteo() {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const secuencia = String(Date.now()).slice(-6)
  return `CF-${fecha}-${secuencia}`
}

// ============================================================
// CONSULTAS REUTILIZABLES
// ============================================================

async function consultarTransferencias(
  pool,
  idTransferencia = null,
) {
  const headersResult = await pool
    .request()
    .input(
      'idTransferencia',
      sql.Int,
      idTransferencia,
    )
    .query(`
      SELECT
        t.id_transferencia,
        t.codigo,

        t.id_almacen_origen,
        ao.nombre AS almacen_origen_nombre,

        t.id_almacen_destino,
        ad.nombre AS almacen_destino_nombre,

        t.id_solicitante,

        COALESCE(
          u.correo,
          u.nombre_usuario,
          CAST(t.id_solicitante AS VARCHAR(20))
        ) AS solicitante_nombre,

        t.estado,
        t.observacion,
        t.version,
        t.fecha_registro

      FROM TransferenciaInventario t

      INNER JOIN Almacen ao
        ON ao.id_almacen =
           t.id_almacen_origen

      INNER JOIN Almacen ad
        ON ad.id_almacen =
           t.id_almacen_destino

      INNER JOIN Usuario u
        ON u.id_usuario =
           t.id_solicitante

      WHERE
        @idTransferencia IS NULL
        OR t.id_transferencia =
           @idTransferencia

      ORDER BY
        t.fecha_registro DESC,
        t.id_transferencia DESC
    `)

  if (headersResult.recordset.length === 0) {
    return []
  }

  const linesResult = await pool
    .request()
    .input(
      'idTransferencia',
      sql.Int,
      idTransferencia,
    )
    .query(`
      SELECT
        dt.id_detalle_transferencia,
        dt.id_transferencia,
        dt.id_producto,

        p.isbn,
        p.titulo,

        dt.cantidad_solicitada,
        dt.cantidad_despachada,
        dt.cantidad_recibida,
        dt.cantidad_faltante,
        dt.cantidad_danada,
        dt.observacion

      FROM DetalleTransferenciaInventario dt

      INNER JOIN Producto p
        ON p.id_producto =
           dt.id_producto

      WHERE
        @idTransferencia IS NULL
        OR dt.id_transferencia =
           @idTransferencia

      ORDER BY
        dt.id_transferencia,
        p.titulo
    `)

  const lineasPorTransferencia = new Map()

  for (const row of linesResult.recordset) {
    const key = String(
      row.id_transferencia,
    )

    if (!lineasPorTransferencia.has(key)) {
      lineasPorTransferencia.set(key, [])
    }

    lineasPorTransferencia.get(key).push({
      id: String(
        row.id_detalle_transferencia,
      ),
      productoId: String(
        row.id_producto,
      ),
      isbn: row.isbn ?? '',
      titulo: row.titulo ?? '',
      cantidadSolicitada:
        Number(
          row.cantidad_solicitada,
        ) || 0,
      cantidadDespachada:
        Number(
          row.cantidad_despachada,
        ) || 0,
      cantidadRecibida:
        Number(
          row.cantidad_recibida,
        ) || 0,
      cantidadFaltante:
        Number(
          row.cantidad_faltante,
        ) || 0,
      cantidadDanada:
        Number(
          row.cantidad_danada,
        ) || 0,
      observacion:
        row.observacion ?? undefined,
    })
  }

  return headersResult.recordset.map(
    (row) => ({
      id: String(row.id_transferencia),
      codigo: row.codigo,

      almacenOrigenId: String(
        row.id_almacen_origen,
      ),
      almacenOrigenNombre:
        row.almacen_origen_nombre,

      almacenDestinoId: String(
        row.id_almacen_destino,
      ),
      almacenDestinoNombre:
        row.almacen_destino_nombre,

      estado: row.estado,

      solicitanteId: String(
        row.id_solicitante,
      ),
      solicitanteNombre:
        row.solicitante_nombre,

      version: Number(row.version),
      fecha: row.fecha_registro,
      observacion:
        row.observacion ?? undefined,

      lineas:
        lineasPorTransferencia.get(
          String(row.id_transferencia),
        ) ?? [],
    }),
  )
}
async function consultarMovimientos(
  pool,
  filtros = {},
) {
  const request = pool.request()

  request.input(
    'idMovimiento',
    sql.Int,
    filtros.idMovimiento ?? null,
  )

  request.input(
    'idProducto',
    sql.Int,
    filtros.productoId ?? null,
  )

  request.input(
    'idAlmacen',
    sql.Int,
    filtros.almacenId ?? null,
  )

  request.input(
    'documentoTipo',
    sql.VarChar(50),
    filtros.documentoTipo ?? null,
  )

  request.input(
    'documentoId',
    sql.Int,
    filtros.documentoId ?? null,
  )

  request.input(
    'tipoMovimiento',
    sql.VarChar(30),
    filtros.tipo ?? null,
  )

  request.input(
    'desde',
    sql.VarChar(10),
    filtros.desde ?? null,
  )

  request.input(
    'hasta',
    sql.VarChar(10),
    filtros.hasta ?? null,
  )

  const result = await request.query(`
    SELECT
      CAST(m.id_movimiento AS VARCHAR(20))
        AS id,

      CAST(m.id_movimiento AS VARCHAR(20))
        AS movimientoId,

      CAST(m.id_producto AS VARCHAR(20))
        AS productoId,

      p.titulo
        AS productoTitulo,

      p.isbn,

      CAST(m.id_almacen AS VARCHAR(20))
        AS almacenId,

      al.nombre
        AS almacenNombre,

      COALESCE(
        s.nombre,
        al.nombre
      ) AS sucursalNombre,

      m.tipo_movimiento
        AS tipoMovimiento,

      m.cantidad,

      m.saldo_anterior
        AS saldoAnterior,

      m.saldo_posterior
        AS saldoPosterior,

      m.documento_tipo
        AS documentoTipo,

      CAST(m.documento_id AS VARCHAR(20))
        AS documentoId,

      COALESCE(
        u.correo,
        u.nombre_usuario,
        CAST(m.id_usuario AS VARCHAR(20))
      ) AS usuarioId,

      m.fecha_movimiento
        AS fechaMovimiento,

      m.motivo_codigo
        AS motivoCodigo,

      m.observacion

    FROM MovimientoInventario m

    INNER JOIN Producto p
      ON p.id_producto = m.id_producto

    INNER JOIN Almacen al
      ON al.id_almacen = m.id_almacen

    LEFT JOIN Sucursal s
      ON s.id_sucursal = al.id_sucursal

    LEFT JOIN Usuario u
      ON u.id_usuario = m.id_usuario

    WHERE
      (
        @idMovimiento IS NULL
        OR m.id_movimiento = @idMovimiento
      )

      AND (
        @idProducto IS NULL
        OR m.id_producto = @idProducto
      )

      AND (
        @idAlmacen IS NULL
        OR m.id_almacen = @idAlmacen
      )

      AND (
        @documentoTipo IS NULL
        OR m.documento_tipo = @documentoTipo
      )

      AND (
        @documentoId IS NULL
        OR m.documento_id = @documentoId
      )

      AND (
        @tipoMovimiento IS NULL
        OR m.tipo_movimiento = @tipoMovimiento
      )

      AND (
        @desde IS NULL
        OR m.fecha_movimiento >=
          TRY_CONVERT(DATE, @desde)
      )

      AND (
        @hasta IS NULL
        OR m.fecha_movimiento <
          DATEADD(
            DAY,
            1,
            TRY_CONVERT(DATE, @hasta)
          )
      )

    ORDER BY
      m.fecha_movimiento DESC,
      m.id_movimiento DESC
  `)

  return result.recordset
}

async function consultarProductosInventario(
  pool,
  idProducto = null,
) {
  const result = await pool
    .request()
    .input('idProducto', sql.Int, idProducto)
    .query(`
      SELECT
        p.id_producto,
        p.codigo_producto,
        p.isbn,
        p.titulo,
        p.costo_referencia,
        p.estado AS estado_producto,

        au.nombre AS autor,
        ca.nombre_categoria AS categoria,
        ed.nombre AS editorial,

        i.id_inventario,
        i.stock_actual,
        i.stock_minimo,
        i.ubicacion,
        i.version,
        i.fecha_actualizacion,

        al.id_almacen,
        al.nombre AS almacen_nombre,
        al.bloqueado AS almacen_bloqueado,

        s.id_sucursal,
        s.nombre AS sucursal_nombre,

        ISNULL(tr.transferencias_activas, 0)
          AS transferencias_activas,

        ISNULL(co.conteos_abiertos, 0)
          AS conteos_abiertos,

        ISNULL(aj.ajustes_pendientes, 0)
          AS ajustes_pendientes,

        ISNULL(de.descartes_relacionados, 0)
          AS descartes_relacionados,

        um.id_movimiento
          AS ultimo_movimiento_id,

        um.fecha_movimiento
          AS ultimo_movimiento_fecha,

        ua.fecha
          AS ultima_auditoria_fecha

      FROM Producto p

      INNER JOIN Inventario i
        ON i.id_producto = p.id_producto

      INNER JOIN Almacen al
        ON al.id_almacen = i.id_almacen

      LEFT JOIN Sucursal s
        ON s.id_sucursal = al.id_sucursal

      LEFT JOIN Autor au
        ON au.id_autor = p.id_autor

      LEFT JOIN CategoriaProducto ca
        ON ca.id_categoria = p.id_categoria

      LEFT JOIN Editorial ed
        ON ed.id_editorial = p.id_editorial

      OUTER APPLY (
        SELECT
          COUNT(DISTINCT t.id_transferencia)
            AS transferencias_activas
        FROM DetalleTransferenciaInventario dt
        INNER JOIN TransferenciaInventario t
          ON t.id_transferencia =
             dt.id_transferencia
        WHERE
          dt.id_producto = p.id_producto
          AND t.estado IN (
            'borrador',
            'solicitada',
            'en_transito',
            'recibida_parcial'
          )
      ) tr

      OUTER APPLY (
        SELECT
          COUNT(DISTINCT c.id_conteo)
            AS conteos_abiertos
        FROM DetalleConteoInventario dc
        INNER JOIN ConteoInventario c
          ON c.id_conteo = dc.id_conteo
        WHERE
          dc.id_producto = p.id_producto
          AND c.estado IN (
            'borrador',
            'abierto',
            'en_conteo',
            'en_revision'
          )
      ) co

      OUTER APPLY (
        SELECT
          COUNT(DISTINCT a.id_ajuste)
            AS ajustes_pendientes
        FROM DetalleAjusteInventario da
        INNER JOIN AjusteInventario a
          ON a.id_ajuste = da.id_ajuste
        WHERE
          da.id_producto = p.id_producto
          AND a.estado IN (
            'borrador',
            'solicitado',
            'aprobado'
          )
      ) aj

      OUTER APPLY (
        SELECT
          COUNT(DISTINCT d.id_descarte)
            AS descartes_relacionados
        FROM DetalleDescarteInventario dd
        INNER JOIN DescarteInventario d
          ON d.id_descarte = dd.id_descarte
        WHERE
          dd.id_producto = p.id_producto
          AND d.estado NOT IN (
            'cancelado',
            'rechazado'
          )
      ) de

      OUTER APPLY (
        SELECT TOP 1
          m.id_movimiento,
          m.fecha_movimiento
        FROM MovimientoInventario m
        WHERE m.id_producto = p.id_producto
        ORDER BY
          m.fecha_movimiento DESC,
          m.id_movimiento DESC
      ) um

      OUTER APPLY (
        SELECT TOP 1
          a.fecha
        FROM AuditoriaInventario a
        WHERE a.id_producto = p.id_producto
        ORDER BY
          a.fecha DESC,
          a.id_auditoria DESC
      ) ua

      WHERE
        p.estado = 'Activo'
        AND (
          @idProducto IS NULL
          OR p.id_producto = @idProducto
        )

      ORDER BY
        p.titulo,
        al.nombre
    `)

  return result.recordset
}

function agruparProductosInventario(rows) {
  const productos = new Map()

  for (const row of rows) {
    const key = String(row.id_producto)

    if (!productos.has(key)) {
      productos.set(key, {
        productoId: key,
        codigo: row.codigo_producto ?? '',
        isbn: row.isbn ?? '',
        titulo: row.titulo,
        autor: row.autor ?? '',
        categoria: row.categoria ?? '',
        editorial: row.editorial ?? '',
        costoReferencia:
          Number(row.costo_referencia) || 0,
        activo: row.estado_producto === 'Activo',
        existenciaTotal: 0,
        stockMinimo: 0,
        existencias: [],
        transferenciasActivas:
          Number(row.transferencias_activas) || 0,
        conteosAbiertos:
          Number(row.conteos_abiertos) || 0,
        ajustesPendientes:
          Number(row.ajustes_pendientes) || 0,
        descartesRelacionados:
          Number(row.descartes_relacionados) || 0,
        ultimoMovimientoId:
          row.ultimo_movimiento_id !== null
            ? String(row.ultimo_movimiento_id)
            : null,
        ultimoMovimientoFecha:
          row.ultimo_movimiento_fecha ?? null,
        ultimaAuditoriaFecha:
          row.ultima_auditoria_fecha ?? null,
      })
    }

    const producto = productos.get(key)

    producto.existenciaTotal +=
      Number(row.stock_actual) || 0

    producto.stockMinimo +=
      Number(row.stock_minimo) || 0

    producto.existencias.push({
      inventarioId: String(row.id_inventario),
      almacenId: String(row.id_almacen),
      almacenNombre: row.almacen_nombre,
      sucursalId:
        row.id_sucursal !== null
          ? String(row.id_sucursal)
          : null,
      sucursalNombre:
        row.sucursal_nombre ??
        row.almacen_nombre,
      saldo: Number(row.stock_actual) || 0,
      stockMinimo:
        Number(row.stock_minimo) || 0,
      ubicacion: row.ubicacion ?? '',
      version: Number(row.version) || 1,
      bloqueado: Boolean(
        row.almacen_bloqueado,
      ),
      fechaActualizacion:
        row.fecha_actualizacion,
    })
  }

  return Array.from(productos.values())
}

async function consultarConteos(pool, idConteo = null) {
  const headersResult = await pool
    .request()
    .input('idConteo', sql.Int, idConteo)
    .query(`
      SELECT
        c.id_conteo,
        c.codigo,
        c.nombre,
        c.id_sucursal,
        s.nombre AS sucursal_nombre,
        c.id_almacen,
        a.nombre AS almacen_nombre,
        c.tipo_conteo,
        c.alcance_tipo,
        c.alcance_valor,
        c.fecha_programada,
        c.hora_programada,
        c.id_responsable,
        COALESCE(
          c.responsable_nombre,
          u.correo,
          u.nombre_usuario
        ) AS responsable_nombre,
        c.observaciones,
        c.bloquear_almacen_al_abrir,
        c.permitir_reconteo,
        c.diferencia_minima_reconteo,
        c.estado,
        c.fase,
        c.bloqueo_activo,
        c.version,
        c.fecha_registro,
        c.fecha_apertura,
        c.fecha_cierre,
        (
          SELECT COUNT(*)
          FROM ProductoAlcanceConteoInventario pac
          WHERE pac.id_conteo = c.id_conteo
        ) AS productos_alcance,
        (
          SELECT COUNT(*)
          FROM DetalleConteoInventario dc
          WHERE
            dc.id_conteo = c.id_conteo
            AND ISNULL(dc.diferencia, 0) <> 0
        ) AS diferencias
      FROM ConteoInventario c
      INNER JOIN Sucursal s
        ON s.id_sucursal = c.id_sucursal
      INNER JOIN Almacen a
        ON a.id_almacen = c.id_almacen
      LEFT JOIN Usuario u
        ON u.id_usuario = c.id_responsable
      WHERE
        @idConteo IS NULL
        OR c.id_conteo = @idConteo
      ORDER BY
        c.fecha_registro DESC,
        c.id_conteo DESC
    `)

  if (headersResult.recordset.length === 0) return []

  const linesResult = await pool
    .request()
    .input('idConteo', sql.Int, idConteo)
    .query(`
      SELECT
        dc.id_detalle_conteo,
        dc.id_conteo,
        dc.id_snapshot,
        dc.id_producto,
        p.isbn,
        p.titulo,
        sc.cantidad_teorica,
        sc.costo_referencia,
        dc.cantidad_contada,
        dc.cantidad_reconteo,
        dc.cantidad_aceptada,
        dc.diferencia,
        dc.clasificacion,
        dc.estado_linea,
        dc.regularizacion_tipo,
        dc.regularizacion_id,
        dc.observacion
      FROM DetalleConteoInventario dc
      INNER JOIN SnapshotConteoInventario sc
        ON sc.id_snapshot = dc.id_snapshot
      INNER JOIN Producto p
        ON p.id_producto = dc.id_producto
      WHERE
        @idConteo IS NULL
        OR dc.id_conteo = @idConteo
      ORDER BY dc.id_conteo, p.titulo
    `)

  const lineasPorConteo = new Map()

  for (const row of linesResult.recordset) {
    const key = String(row.id_conteo)
    if (!lineasPorConteo.has(key)) lineasPorConteo.set(key, [])

    lineasPorConteo.get(key).push({
      id: String(row.id_detalle_conteo),
      productoId: String(row.id_producto),
      isbn: row.isbn ?? '',
      titulo: row.titulo ?? '',
      snapshotId: String(row.id_snapshot),
      cantidadTeorica: Number(row.cantidad_teorica) || 0,
      cantidadContada:
        row.cantidad_contada === null ? undefined : Number(row.cantidad_contada),
      cantidadReconteo:
        row.cantidad_reconteo === null ? undefined : Number(row.cantidad_reconteo),
      cantidadAceptada:
        row.cantidad_aceptada === null ? undefined : Number(row.cantidad_aceptada),
      diferencia:
        row.diferencia === null ? undefined : Number(row.diferencia),
      clasificacion: row.clasificacion ?? undefined,
      estadoLinea: row.estado_linea,
      regularizacionTipo: row.regularizacion_tipo ?? undefined,
      regularizacionId:
        row.regularizacion_id === null
          ? undefined
          : String(row.regularizacion_id),
      observacion: row.observacion ?? undefined,
    })
  }

  return headersResult.recordset.map((row) => ({
    id: String(row.id_conteo),
    codigo: row.codigo,
    nombre: row.nombre,
    almacenId: String(row.id_almacen),
    almacenNombre: row.almacen_nombre,
    sucursalId: String(row.id_sucursal),
    sucursalNombre: row.sucursal_nombre,
    tipoConteo: row.tipo_conteo,
    alcanceTipo: row.alcance_tipo,
    alcanceValor: row.alcance_valor ?? undefined,
    estado: row.estado,
    fase: row.fase,
    responsableId:
      row.id_responsable === null ? '' : String(row.id_responsable),
    responsableNombre: row.responsable_nombre ?? undefined,
    productosAlcance: Number(row.productos_alcance) || 0,
    diferencias: Number(row.diferencias) || 0,
    bloqueoActivo: Boolean(row.bloqueo_activo),
    fecha: row.fecha_registro,
    fechaProgramada: row.fecha_programada ?? undefined,
    horaProgramada: row.hora_programada ?? undefined,
    bloquearAlmacenAlAbrir: Boolean(row.bloquear_almacen_al_abrir),
    permitirReconteo: Boolean(row.permitir_reconteo),
    diferenciaMinimaReconteo: Number(row.diferencia_minima_reconteo) || 0,
    version: Number(row.version),
    lineas: lineasPorConteo.get(String(row.id_conteo)) ?? [],
    observaciones: row.observaciones ?? undefined,
  }))
}

// ============================================================
// DASHBOARD Y PRODUCTOS
// ============================================================
// ============================================================
// GET /api/inventario/dashboard
// Indicadores generales del inventario
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      ;WITH ProductoResumen AS (
        SELECT
          p.id_producto,

          SUM(i.stock_actual)
            AS stock_total,

          SUM(i.stock_minimo)
            AS stock_minimo,

          MAX(p.costo_referencia)
            AS costo_referencia

        FROM Producto p

        INNER JOIN Inventario i
          ON i.id_producto = p.id_producto

        WHERE p.estado = 'Activo'

        GROUP BY p.id_producto
      )

      SELECT
        COUNT(*)
          AS total_productos,

        ISNULL(SUM(stock_total), 0)
          AS total_existencias,

        SUM(
          CASE
            WHEN stock_total > 0
              AND stock_total <= stock_minimo
            THEN 1
            ELSE 0
          END
        ) AS productos_bajo_stock,

        SUM(
          CASE
            WHEN stock_total = 0
            THEN 1
            ELSE 0
          END
        ) AS productos_sin_stock,

        CASE
          WHEN SUM(
            CASE
              WHEN costo_referencia > 0
              THEN 1
              ELSE 0
            END
          ) = 0
          THEN NULL

          ELSE SUM(
            stock_total * costo_referencia
          )
        END AS valor_inventario,

        (
          SELECT COUNT(*)
          FROM Almacen
          WHERE
            estado = 'Activo'
            AND bloqueado = 1
        ) AS almacenes_bloqueados,

        (
          SELECT COUNT(*)
          FROM TransferenciaInventario
          WHERE estado IN (
            'borrador',
            'solicitada',
            'en_transito',
            'recibida_parcial'
          )
        ) AS transferencias_pendientes,

        (
          SELECT COUNT(*)
          FROM AjusteInventario
          WHERE estado IN (
            'borrador',
            'solicitado',
            'aprobado'
          )
        ) AS ajustes_pendientes,

        (
          SELECT COUNT(*)
          FROM DescarteInventario
          WHERE estado IN (
            'borrador',
            'solicitado',
            'aprobado'
          )
        ) AS descartes_pendientes,

        (
          SELECT COUNT(*)
          FROM ConteoInventario
          WHERE estado IN (
            'borrador',
            'abierto',
            'en_conteo',
            'en_revision'
          )
        ) AS conteos_activos,

        (
          SELECT COUNT(*)
          FROM MovimientoInventario
          WHERE fecha_movimiento >=
            DATEADD(
              HOUR,
              -24,
              SYSDATETIME()
            )
        ) AS movimientos_ultimas_24h

      FROM ProductoResumen;

      SELECT
        al.id_almacen,
        al.nombre AS almacen_nombre,

        ISNULL(SUM(i.stock_actual), 0)
          AS existencias,

        CASE
          WHEN SUM(
            CASE
              WHEN p.costo_referencia > 0
              THEN 1
              ELSE 0
            END
          ) = 0
          THEN NULL

          ELSE SUM(
            i.stock_actual *
            p.costo_referencia
          )
        END AS valor

      FROM Almacen al

      LEFT JOIN Inventario i
        ON i.id_almacen = al.id_almacen

      LEFT JOIN Producto p
        ON p.id_producto = i.id_producto
        AND p.estado = 'Activo'

      WHERE al.estado = 'Activo'

      GROUP BY
        al.id_almacen,
        al.nombre

      ORDER BY al.nombre;
    `)

    const resumen =
      result.recordsets[0]?.[0] ?? {}

    const porAlmacen =
      result.recordsets[1] ?? []

    return res.json({
      success: true,
      data: {
        totalProductos:
          Number(resumen.total_productos) || 0,

        totalExistencias:
          Number(resumen.total_existencias) || 0,

        productosBajoStock:
          Number(
            resumen.productos_bajo_stock,
          ) || 0,

        productosSinStock:
          Number(
            resumen.productos_sin_stock,
          ) || 0,

        valorInventario:
          resumen.valor_inventario === null ||
            resumen.valor_inventario === undefined
            ? null
            : Number(
              resumen.valor_inventario,
            ),

        almacenesBloqueados:
          Number(
            resumen.almacenes_bloqueados,
          ) || 0,

        transferenciasPendientes:
          Number(
            resumen.transferencias_pendientes,
          ) || 0,

        ajustesPendientes:
          Number(
            resumen.ajustes_pendientes,
          ) || 0,

        descartesPendientes:
          Number(
            resumen.descartes_pendientes,
          ) || 0,

        conteosActivos:
          Number(
            resumen.conteos_activos,
          ) || 0,

        movimientosUltimas24h:
          Number(
            resumen.movimientos_ultimas_24h,
          ) || 0,

        porAlmacen: porAlmacen.map(
          (row) => ({
            almacenId: String(
              row.id_almacen,
            ),
            almacenNombre:
              row.almacen_nombre,
            existencias:
              Number(row.existencias) || 0,
            valor:
              row.valor === null
                ? null
                : Number(row.valor),
          }),
        ),
      },
    })
  } catch (err) {
    console.error(
      'Error obteniendo dashboard de inventario:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_DASHBOARD_ERROR',
        message:
          'No se pudieron cargar los indicadores del inventario.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})
// GET /api/inventario/productos
router.get('/productos', async (req, res) => {
  try {
    const pool = await getConnection()

    const rows =
      await consultarProductosInventario(pool)

    return res.json({
      success: true,
      data: agruparProductosInventario(rows),
      total: new Set(
        rows.map((row) => row.id_producto),
      ).size,
    })
  } catch (err) {
    console.error(
      'Error obteniendo productos de inventario:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_PRODUCTS_ERROR',
        message:
          'No se pudieron cargar las existencias.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})

// GET /api/inventario/productos/:id
router.get('/productos/:id', async (req, res) => {
  const idProducto = Number(req.params.id)

  if (
    !Number.isInteger(idProducto) ||
    idProducto <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message:
          'El identificador del producto no es válido.',
      },
    })
  }

  try {
    const pool = await getConnection()

    const rows =
      await consultarProductosInventario(
        pool,
        idProducto,
      )

    const productos =
      agruparProductosInventario(rows)

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVENTORY_PRODUCT_NOT_FOUND',
          message:
            'El producto no tiene existencias registradas.',
        },
      })
    }

    return res.json({
      success: true,
      data: productos[0],
    })
  } catch (err) {
    console.error(
      'Error obteniendo ficha de inventario:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'INVENTORY_PRODUCT_ERROR',
        message:
          'No se pudo cargar la ficha del producto.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})
// ============================================================
// EXISTENCIAS
// POST /api/inventario/existencias
// ============================================================
router.post('/existencias', async (req, res) => {
  const {
    productoId,
    almacenId,
    stockInicial,
    stockMinimo,
    ubicacion,
  } = req.body

  const idProducto = Number(productoId)
  const idAlmacen = Number(almacenId)
  const stock = Number(stockInicial)
  const minimo = Number(stockMinimo)
  const ubicacionNormalizada =
    typeof ubicacion === 'string'
      ? ubicacion.trim()
      : ''

  if (
    !Number.isInteger(idProducto) ||
    idProducto <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message: 'El producto seleccionado no es válido.',
      },
    })
  }

  if (
    !Number.isInteger(idAlmacen) ||
    idAlmacen <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_WAREHOUSE_ID',
        message: 'El almacén seleccionado no es válido.',
      },
    })
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INITIAL_STOCK',
        message:
          'El stock inicial debe ser un entero mayor o igual que cero.',
      },
    })
  }

  if (!Number.isInteger(minimo) || minimo < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MINIMUM_STOCK',
        message:
          'El stock mínimo debe ser un entero mayor o igual que cero.',
      },
    })
  }

  if (ubicacionNormalizada.length < 2) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_LOCATION',
        message:
          'La ubicación es obligatoria y debe tener al menos 2 caracteres.',
      },
    })
  }

  const usuarioReferencia = String(
    req.headers['x-user-id'] ?? '',
  ).trim()

  if (!usuarioReferencia) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'USER_REQUIRED',
        message:
          'No se pudo identificar al usuario que realiza la operación.',
      },
    })
  }

  let transaction

  try {
    const pool = await getConnection()

    transaction = new sql.Transaction(pool)

    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE,
    )

    const requestUsuario = new sql.Request(transaction)

    requestUsuario.input(
      'usuarioReferencia',
      sql.VarChar(100),
      usuarioReferencia,
    )

    const usuarioResult = await requestUsuario.query(`
      SELECT TOP 1
        id_usuario,
        nombre_usuario
      FROM Usuario
      WHERE
        estado = 'Activo'
        AND (
          nombre_usuario = @usuarioReferencia
          OR (
            TRY_CONVERT(INT, @usuarioReferencia)
              IS NOT NULL
            AND id_usuario =
              TRY_CONVERT(INT, @usuarioReferencia)
          )
        )
    `)

    if (usuarioResult.recordset.length === 0) {
      await transaction.rollback()
      transaction = null

      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message:
            'El usuario de inventario no existe o está inactivo.',
        },
      })
    }

    const usuario =
      usuarioResult.recordset[0]

    const productoResult =
      await new sql.Request(transaction)
        .input(
          'idProducto',
          sql.Int,
          idProducto,
        )
        .query(`
          SELECT
            id_producto,
            titulo,
            estado
          FROM Producto
          WHERE id_producto = @idProducto
        `)

    if (productoResult.recordset.length === 0) {
      await transaction.rollback()
      transaction = null

      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message:
            'El producto seleccionado no existe.',
        },
      })
    }

    if (
      productoResult.recordset[0].estado !== 'Activo'
    ) {
      await transaction.rollback()
      transaction = null

      return res.status(409).json({
        success: false,
        error: {
          code: 'PRODUCT_INACTIVE',
          message:
            'No se puede registrar existencia para un producto inactivo.',
        },
      })
    }

    const almacenResult =
      await new sql.Request(transaction)
        .input(
          'idAlmacen',
          sql.Int,
          idAlmacen,
        )
        .query(`
          SELECT
            id_almacen,
            nombre,
            estado,
            bloqueado
          FROM Almacen
          WHERE id_almacen = @idAlmacen
        `)

    if (almacenResult.recordset.length === 0) {
      await transaction.rollback()
      transaction = null

      return res.status(404).json({
        success: false,
        error: {
          code: 'WAREHOUSE_NOT_FOUND',
          message:
            'El almacén seleccionado no existe.',
        },
      })
    }

    const almacen = almacenResult.recordset[0]

    if (almacen.estado !== 'Activo') {
      await transaction.rollback()
      transaction = null

      return res.status(409).json({
        success: false,
        error: {
          code: 'WAREHOUSE_INACTIVE',
          message:
            'No se puede registrar existencia en un almacén inactivo.',
        },
      })
    }

    if (almacen.bloqueado) {
      await transaction.rollback()
      transaction = null

      return res.status(409).json({
        success: false,
        error: {
          code: 'WAREHOUSE_BLOCKED',
          message:
            'El almacén está bloqueado por un proceso de inventario.',
        },
      })
    }

    const duplicateResult =
      await new sql.Request(transaction)
        .input(
          'idProducto',
          sql.Int,
          idProducto,
        )
        .input(
          'idAlmacen',
          sql.Int,
          idAlmacen,
        )
        .query(`
          SELECT id_inventario
          FROM Inventario WITH (
            UPDLOCK,
            HOLDLOCK
          )
          WHERE
            id_producto = @idProducto
            AND id_almacen = @idAlmacen
        `)

    if (duplicateResult.recordset.length > 0) {
      await transaction.rollback()
      transaction = null

      return res.status(409).json({
        success: false,
        error: {
          code: 'INVENTORY_ALREADY_EXISTS',
          message:
            'Este producto ya tiene una existencia registrada en el almacén seleccionado.',
        },
      })
    }

    const inventarioResult =
      await new sql.Request(transaction)
        .input(
          'idProducto',
          sql.Int,
          idProducto,
        )
        .input(
          'idAlmacen',
          sql.Int,
          idAlmacen,
        )
        .input(
          'stockInicial',
          sql.Int,
          stock,
        )
        .input(
          'stockMinimo',
          sql.Int,
          minimo,
        )
        .input(
          'ubicacion',
          sql.VarChar(150),
          ubicacionNormalizada,
        )
        .query(`
          INSERT INTO Inventario (
            id_producto,
            id_almacen,
            stock_actual,
            stock_minimo,
            ubicacion
          )
          OUTPUT
            INSERTED.id_inventario,
            INSERTED.id_producto,
            INSERTED.id_almacen,
            INSERTED.stock_actual,
            INSERTED.stock_minimo,
            INSERTED.ubicacion,
            INSERTED.version
          VALUES (
            @idProducto,
            @idAlmacen,
            @stockInicial,
            @stockMinimo,
            @ubicacion
          )
        `)

    const existencia =
      inventarioResult.recordset[0]

    let idMovimiento = null

    if (stock > 0) {
      const movimientoResult =
        await new sql.Request(transaction)
          .input(
            'idInventario',
            sql.Int,
            existencia.id_inventario,
          )
          .input(
            'idProducto',
            sql.Int,
            idProducto,
          )
          .input(
            'idAlmacen',
            sql.Int,
            idAlmacen,
          )
          .input(
            'idUsuario',
            sql.Int,
            usuario.id_usuario,
          )
          .input(
            'cantidad',
            sql.Int,
            stock,
          )
          .query(`
            INSERT INTO MovimientoInventario (
              id_inventario,
              id_producto,
              id_almacen,
              id_usuario,
              tipo_movimiento,
              cantidad,
              saldo_anterior,
              saldo_posterior,
              documento_tipo,
              documento_id,
              motivo_codigo,
              observacion
            )
            OUTPUT INSERTED.id_movimiento
            VALUES (
              @idInventario,
              @idProducto,
              @idAlmacen,
              @idUsuario,
              'entrada',
              @cantidad,
              0,
              @cantidad,
              'existencia_inicial',
              @idInventario,
              'ALTA_EXISTENCIA',
              'Registro inicial de existencia'
            )
          `)

      idMovimiento =
        movimientoResult.recordset[0].id_movimiento
    }

    await new sql.Request(transaction)
      .input(
        'idUsuario',
        sql.Int,
        usuario.id_usuario,
      )
      .input(
        'idMovimiento',
        sql.Int,
        idMovimiento,
      )
      .input(
        'idInventario',
        sql.Int,
        existencia.id_inventario,
      )
      .input(
        'idProducto',
        sql.Int,
        idProducto,
      )
      .input(
        'idAlmacen',
        sql.Int,
        idAlmacen,
      )
      .input(
        'direccionIp',
        sql.VarChar(45),
        req.ip ?? null,
      )
      .query(`
        INSERT INTO AuditoriaInventario (
          id_usuario,
          tipo_accion,
          id_movimiento,
          documento_tipo,
          documento_id,
          id_producto,
          id_almacen,
          direccion_ip,
          resultado,
          detalle
        )
        VALUES (
          @idUsuario,
          'REGISTRAR_EXISTENCIA',
          @idMovimiento,
          'existencia',
          @idInventario,
          @idProducto,
          @idAlmacen,
          @direccionIp,
          'OK',
          'Existencia inicial registrada'
        )
      `)

    await transaction.commit()
    transaction = null

    return res.status(201).json({
      success: true,
      message:
        'Existencia registrada correctamente.',
      data: {
        id: String(existencia.id_inventario),
        productoId: String(
          existencia.id_producto,
        ),
        almacenId: String(
          existencia.id_almacen,
        ),
        saldo: existencia.stock_actual,
        stockMinimo:
          existencia.stock_minimo,
        ubicacion: existencia.ubicacion,
        version: existencia.version,
      },
    })
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback()
      } catch (rollbackError) {
        console.error(
          'Error revirtiendo la transacción:',
          rollbackError,
        )
      }
    }

    console.error(
      'Error registrando existencia:',
      err,
    )

    const duplicate =
      err.number === 2601 ||
      err.number === 2627

    return res.status(duplicate ? 409 : 500).json({
      success: false,
      error: {
        code: duplicate
          ? 'INVENTORY_ALREADY_EXISTS'
          : 'INVENTORY_CREATE_ERROR',
        message: duplicate
          ? 'Este producto ya existe en el almacén seleccionado.'
          : 'No se pudo registrar la existencia.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})
// ============================================================
// MOVIMIENTOS Y KARDEX
// ============================================================

// GET /api/inventario/movimientos
router.get('/movimientos', async (req, res) => {
  try {
    const pool = await getConnection()

    const productoId = req.query.productoId
      ? Number(req.query.productoId)
      : null

    const almacenId = req.query.almacenId
      ? Number(req.query.almacenId)
      : null

    const documentoId = req.query.documentoId
      ? Number(req.query.documentoId)
      : null

    const rows = await consultarMovimientos(
      pool,
      {
        productoId,
        almacenId,
        documentoTipo:
          req.query.documentoTipo || null,
        documentoId,
        tipo: req.query.tipo || null,
        desde: req.query.desde || null,
        hasta: req.query.hasta || null,
      },
    )

    return res.json({
      success: true,
      data: rows,
      total: rows.length,
    })
  } catch (err) {
    console.error(
      'Error cargando movimientos:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'MOVEMENT_LIST_ERROR',
        message:
          'No se pudieron cargar los movimientos.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})

// GET /api/inventario/movimientos/:id
router.get('/movimientos/:id', async (req, res) => {
  const idMovimiento = Number(req.params.id)

  if (
    !Number.isInteger(idMovimiento) ||
    idMovimiento <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MOVEMENT_ID',
        message:
          'El identificador del movimiento no es válido.',
      },
    })
  }

  try {
    const pool = await getConnection()

    const rows = await consultarMovimientos(
      pool,
      {
        idMovimiento,
      },
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOVEMENT_NOT_FOUND',
          message:
            'Movimiento no encontrado.',
        },
      })
    }

    return res.json({
      success: true,
      data: rows[0],
    })
  } catch (err) {
    console.error(
      'Error obteniendo movimiento:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'MOVEMENT_GET_ERROR',
        message:
          'No se pudo cargar el movimiento.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})

// GET /api/inventario/kardex
router.get('/kardex', async (req, res) => {
  const productoId = req.query.productoId
    ? Number(req.query.productoId)
    : null

  if (
    productoId !== null &&
    (
      !Number.isInteger(productoId) ||
      productoId <= 0
    )
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_ID',
        message:
          'El producto utilizado para filtrar el Kardex no es válido.',
      },
    })
  }

  try {
    const pool = await getConnection()

    const rows = await consultarMovimientos(
      pool,
      {
        productoId,
      },
    )

    return res.json({
      success: true,
      data: rows,
      total: rows.length,
    })
  } catch (err) {
    console.error(
      'Error cargando Kardex:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'KARDEX_LIST_ERROR',
        message:
          'No se pudo cargar el Kardex.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})
// ============================================================
// CONTEOS FISICOS
// ============================================================

// POST /api/inventario/conteos
router.post('/conteos', async (req, res) => {
  const nombre = String(req.body.nombre ?? '').trim()
  const codigo =
    typeof req.body.codigo === 'string' && req.body.codigo.trim()
      ? req.body.codigo.trim().toUpperCase()
      : generarCodigoConteo()
  const tipoConteo = String(req.body.tipoConteo ?? '')
  const idSucursal = Number(req.body.sucursalId)
  const idAlmacen = Number(req.body.almacenId)
  const alcanceTipo = String(req.body.alcanceTipo ?? '')
  const alcanceValor =
    typeof req.body.alcanceValor === 'string'
      ? req.body.alcanceValor.trim() || null
      : null
  const fechaProgramada = req.body.fechaProgramada || null
  const horaProgramada = req.body.horaProgramada || null
  const diferenciaMinima = Number(req.body.diferenciaMinimaReconteo ?? 1)
  const productos = Array.isArray(req.body.productos) ? req.body.productos : []
  const tiposValidos = ['general', 'parcial', 'ciclico', 'extraordinario']
  const alcancesValidos = [
    'todo_almacen',
    'categoria',
    'editorial',
    'ubicacion',
    'productos',
  ]

  if (!nombre || nombre.length > 150) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_COUNT_NAME', message: 'El nombre del conteo no es válido.' },
    })
  }

  if (!tiposValidos.includes(tipoConteo)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_COUNT_TYPE', message: 'El tipo de conteo no es válido.' },
    })
  }

  if (
    !Number.isInteger(idSucursal) ||
    idSucursal <= 0 ||
    !Number.isInteger(idAlmacen) ||
    idAlmacen <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COUNT_LOCATION',
        message: 'La sucursal o el almacén no son válidos.',
      },
    })
  }

  if (!alcancesValidos.includes(alcanceTipo)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_COUNT_SCOPE', message: 'El alcance del conteo no es válido.' },
    })
  }

  if (
    ['categoria', 'editorial', 'ubicacion'].includes(alcanceTipo) &&
    !alcanceValor
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'COUNT_SCOPE_VALUE_REQUIRED',
        message: 'Debe indicar el valor del alcance.',
      },
    })
  }

  if (!Number.isInteger(diferenciaMinima) || diferenciaMinima < 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_RECOUNT_DIFFERENCE',
        message: 'La diferencia mínima de reconteo no es válida.',
      },
    })
  }

  const productosNormalizados = []
  const productosUtilizados = new Set()

  for (const producto of productos) {
    const idProducto = Number(producto.productoId)
    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COUNT_PRODUCT', message: 'Uno de los productos no es válido.' },
      })
    }
    if (!productosUtilizados.has(idProducto)) {
      productosUtilizados.add(idProducto)
      productosNormalizados.push(idProducto)
    }
  }

  if (productosNormalizados.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'COUNT_PRODUCTS_REQUIRED',
        message: 'El conteo debe incluir al menos un producto.',
      },
    })
  }

  const usuarioReferencia = String(req.headers['x-user-id'] ?? '').trim()
  let transaction

  try {
    const pool = await getConnection()
    transaction = new sql.Transaction(pool)
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

    const usuario = await obtenerUsuarioOperacion(transaction, usuarioReferencia)
    if (!usuario) {
      await transaction.rollback()
      transaction = null
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No se pudo identificar al usuario.' },
      })
    }

    let responsable = usuario
    const responsableReferencia = String(req.body.responsableId ?? '').trim()
    if (responsableReferencia && responsableReferencia !== usuarioReferencia) {
      responsable = await obtenerUsuarioOperacion(transaction, responsableReferencia)
      if (!responsable) {
        await transaction.rollback()
        transaction = null
        return res.status(404).json({
          success: false,
          error: {
            code: 'COUNT_RESPONSIBLE_NOT_FOUND',
            message: 'El responsable seleccionado no existe o está inactivo.',
          },
        })
      }
    }

    const almacenResult = await new sql.Request(transaction)
      .input('idAlmacen', sql.Int, idAlmacen)
      .input('idSucursal', sql.Int, idSucursal)
      .query(`
        SELECT id_almacen, nombre, estado, bloqueado
        FROM Almacen
        WHERE
          id_almacen = @idAlmacen
          AND id_sucursal = @idSucursal
      `)

    if (almacenResult.recordset.length === 0) {
      await transaction.rollback()
      transaction = null
      return res.status(404).json({
        success: false,
        error: {
          code: 'WAREHOUSE_BRANCH_MISMATCH',
          message: 'El almacén no pertenece a la sucursal seleccionada.',
        },
      })
    }

    const almacen = almacenResult.recordset[0]
    if (almacen.estado !== 'Activo' || almacen.bloqueado) {
      await transaction.rollback()
      transaction = null
      return res.status(409).json({
        success: false,
        error: {
          code: 'WAREHOUSE_NOT_AVAILABLE',
          message: `El almacén "${almacen.nombre}" está inactivo o bloqueado.`,
        },
      })
    }

    const codigoResult = await new sql.Request(transaction)
      .input('codigo', sql.VarChar(30), codigo)
      .query(`
        SELECT id_conteo
        FROM ConteoInventario WITH (UPDLOCK, HOLDLOCK)
        WHERE codigo = @codigo
      `)

    if (codigoResult.recordset.length > 0) {
      await transaction.rollback()
      transaction = null
      return res.status(409).json({
        success: false,
        error: { code: 'COUNT_CODE_EXISTS', message: 'Ya existe un conteo con ese código.' },
      })
    }

    for (const idProducto of productosNormalizados) {
      const existenciaResult = await new sql.Request(transaction)
        .input('idProducto', sql.Int, idProducto)
        .input('idAlmacen', sql.Int, idAlmacen)
        .query(`
          SELECT p.titulo
          FROM Producto p
          INNER JOIN Inventario i
            ON i.id_producto = p.id_producto
            AND i.id_almacen = @idAlmacen
          WHERE
            p.id_producto = @idProducto
            AND p.estado = 'Activo'
        `)

      if (existenciaResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null
        return res.status(409).json({
          success: false,
          error: {
            code: 'COUNT_PRODUCT_NOT_IN_WAREHOUSE',
            message: 'Uno de los productos no tiene existencia registrada en el almacén.',
          },
        })
      }
    }

    const conteoResult = await new sql.Request(transaction)
      .input('codigo', sql.VarChar(30), codigo)
      .input('nombre', sql.VarChar(150), nombre)
      .input('idSucursal', sql.Int, idSucursal)
      .input('idAlmacen', sql.Int, idAlmacen)
      .input('tipoConteo', sql.VarChar(30), tipoConteo)
      .input('alcanceTipo', sql.VarChar(30), alcanceTipo)
      .input('alcanceValor', sql.VarChar(200), alcanceValor)
      .input('fechaProgramada', sql.VarChar(10), fechaProgramada)
      .input('horaProgramada', sql.VarChar(8), horaProgramada)
      .input('idResponsable', sql.Int, responsable.id_usuario)
      .input(
        'responsableNombre',
        sql.VarChar(150),
        String(req.body.responsableNombre ?? responsable.nombre_usuario).trim(),
      )
      .input(
        'observaciones',
        sql.VarChar(255),
        typeof req.body.observaciones === 'string'
          ? req.body.observaciones.trim() || null
          : null,
      )
      .input('bloquear', sql.Bit, Boolean(req.body.bloquearAlmacenAlAbrir))
      .input('permitirReconteo', sql.Bit, req.body.permitirReconteo !== false)
      .input('diferenciaMinima', sql.Int, diferenciaMinima)
      .query(`
        INSERT INTO ConteoInventario (
          codigo,
          nombre,
          id_sucursal,
          id_almacen,
          tipo_conteo,
          alcance_tipo,
          alcance_valor,
          fecha_programada,
          hora_programada,
          id_responsable,
          responsable_nombre,
          observaciones,
          bloquear_almacen_al_abrir,
          permitir_reconteo,
          diferencia_minima_reconteo
        )
        OUTPUT
          INSERTED.id_conteo,
          INSERTED.codigo,
          INSERTED.nombre,
          INSERTED.estado,
          INSERTED.fase,
          INSERTED.version
        VALUES (
          @codigo,
          @nombre,
          @idSucursal,
          @idAlmacen,
          @tipoConteo,
          @alcanceTipo,
          @alcanceValor,
          TRY_CONVERT(DATE, @fechaProgramada),
          TRY_CONVERT(TIME(0), @horaProgramada),
          @idResponsable,
          @responsableNombre,
          @observaciones,
          @bloquear,
          @permitirReconteo,
          @diferenciaMinima
        )
      `)

    const conteo = conteoResult.recordset[0]

    for (const idProducto of productosNormalizados) {
      await new sql.Request(transaction)
        .input('idConteo', sql.Int, conteo.id_conteo)
        .input('idProducto', sql.Int, idProducto)
        .query(`
          INSERT INTO ProductoAlcanceConteoInventario (
            id_conteo,
            id_producto
          )
          VALUES (@idConteo, @idProducto)
        `)
    }

    await new sql.Request(transaction)
      .input('idUsuario', sql.Int, usuario.id_usuario)
      .input('idConteo', sql.Int, conteo.id_conteo)
      .input('idAlmacen', sql.Int, idAlmacen)
      .input('direccionIp', sql.VarChar(45), req.ip ?? null)
      .query(`
        INSERT INTO AuditoriaInventario (
          id_usuario,
          tipo_accion,
          documento_tipo,
          documento_id,
          id_almacen,
          direccion_ip,
          resultado,
          detalle
        )
        VALUES (
          @idUsuario,
          'CREAR_CONTEO',
          'conteo',
          @idConteo,
          @idAlmacen,
          @direccionIp,
          'OK',
          'Conteo físico creado en borrador'
        )
      `)

    await transaction.commit()
    transaction = null

    return res.status(201).json({
      success: true,
      data: {
        id: String(conteo.id_conteo),
        codigo: conteo.codigo,
        estado: conteo.estado,
        version: Number(conteo.version),
        nombre: conteo.nombre,
        fase: conteo.fase,
        productosAlcance: productosNormalizados.length,
      },
    })
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback()
      } catch { }
    }

    console.error('Error creando conteo:', err)
    const duplicate = err.number === 2601 || err.number === 2627

    return res.status(duplicate ? 409 : 500).json({
      success: false,
      error: {
        code: duplicate ? 'COUNT_CODE_EXISTS' : 'COUNT_CREATE_ERROR',
        message: duplicate
          ? 'Ya existe un conteo con ese código.'
          : 'No se pudo crear el conteo.',
        details: err.message,
      },
    })
  }
})

// GET /api/inventario/conteos
router.get('/conteos', async (req, res) => {
  try {
    const pool = await getConnection()
    const conteos = await consultarConteos(pool)
    return res.json({ success: true, data: conteos, total: conteos.length })
  } catch (err) {
    console.error('Error listando conteos:', err)
    return res.status(500).json({
      success: false,
      error: {
        code: 'COUNT_LIST_ERROR',
        message: 'No se pudieron cargar los conteos.',
        details:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    })
  }
})

// GET /api/inventario/conteos/:id
router.get('/conteos/:id', async (req, res) => {
  const idConteo = Number(req.params.id)
  if (!Number.isInteger(idConteo) || idConteo <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_COUNT_ID', message: 'El conteo no es válido.' },
    })
  }

  try {
    const pool = await getConnection()
    const conteos = await consultarConteos(pool, idConteo)
    if (conteos.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUNT_NOT_FOUND', message: 'Conteo no encontrado.' },
      })
    }
    return res.json({ success: true, data: conteos[0] })
  } catch (err) {
    console.error('Error obteniendo conteo:', err)
    return res.status(500).json({
      success: false,
      error: {
        code: 'COUNT_GET_ERROR',
        message: 'No se pudo cargar el conteo.',
        details:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    })
  }
})

// ============================================================
// TRANSFERENCIAS
// ============================================================

// POST /api/inventario/transferencias
router.post(
  '/transferencias',
  async (req, res) => {
    const {
      almacenOrigenId,
      almacenDestinoId,
      lineas,
      observacion,
    } = req.body

    const idOrigen =
      Number(almacenOrigenId)

    const idDestino =
      Number(almacenDestinoId)

    const codigo =
      typeof req.body.codigo === 'string' &&
        req.body.codigo.trim()
        ? req.body.codigo
          .trim()
          .toUpperCase()
        : generarCodigoTransferencia()

    if (
      !Number.isInteger(idOrigen) ||
      idOrigen <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORIGIN_WAREHOUSE',
          message:
            'El almacén origen no es válido.',
        },
      })
    }

    if (
      !Number.isInteger(idDestino) ||
      idDestino <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESTINATION_WAREHOUSE',
          message:
            'El almacén destino no es válido.',
        },
      })
    }

    if (idOrigen === idDestino) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SAME_WAREHOUSE',
          message:
            'El almacén origen y destino deben ser distintos.',
        },
      })
    }

    if (
      !Array.isArray(lineas) ||
      lineas.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TRANSFER_LINES_REQUIRED',
          message:
            'Debe agregar al menos un producto.',
        },
      })
    }

    const lineasNormalizadas = []
    const productosUtilizados = new Set()

    for (const linea of lineas) {
      const idProducto =
        Number(linea.productoId)

      const cantidad =
        Number(linea.cantidadSolicitada)

      if (
        !Number.isInteger(idProducto) ||
        idProducto <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_PRODUCT',
            message:
              'Uno de los productos no es válido.',
          },
        })
      }

      if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_QUANTITY',
            message:
              'Las cantidades solicitadas deben ser enteros mayores que cero.',
          },
        })
      }

      if (
        productosUtilizados.has(idProducto)
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_TRANSFER_PRODUCT',
            message:
              'Un producto no puede aparecer dos veces en la transferencia.',
          },
        })
      }

      productosUtilizados.add(idProducto)

      lineasNormalizadas.push({
        idProducto,
        cantidad,
      })
    }

    const usuarioReferencia = String(
      req.headers['x-user-id'] ?? '',
    ).trim()

    let transaction

    try {
      const pool = await getConnection()

      transaction =
        new sql.Transaction(pool)

      await transaction.begin(
        sql.ISOLATION_LEVEL.SERIALIZABLE,
      )

      const usuarioResult =
        await new sql.Request(transaction)
          .input(
            'usuarioReferencia',
            sql.VarChar(100),
            usuarioReferencia,
          )
          .query(`
            SELECT TOP 1
              id_usuario
            FROM Usuario
            WHERE
              estado = 'Activo'
              AND (
                nombre_usuario =
                  @usuarioReferencia
                OR (
                  TRY_CONVERT(
                    INT,
                    @usuarioReferencia
                  ) IS NOT NULL
                  AND id_usuario =
                    TRY_CONVERT(
                      INT,
                      @usuarioReferencia
                    )
                )
              )
          `)

      if (
        usuarioResult.recordset.length === 0
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message:
              'No se pudo identificar al usuario.',
          },
        })
      }

      const idUsuario =
        usuarioResult.recordset[0]
          .id_usuario

      const almacenesResult =
        await new sql.Request(transaction)
          .input(
            'idOrigen',
            sql.Int,
            idOrigen,
          )
          .input(
            'idDestino',
            sql.Int,
            idDestino,
          )
          .query(`
            SELECT
              id_almacen,
              nombre,
              estado,
              bloqueado
            FROM Almacen
            WHERE id_almacen IN (
              @idOrigen,
              @idDestino
            )
          `)

      if (
        almacenesResult.recordset.length !==
        2
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(404).json({
          success: false,
          error: {
            code: 'WAREHOUSE_NOT_FOUND',
            message:
              'Uno de los almacenes no existe.',
          },
        })
      }

      const almacenNoDisponible =
        almacenesResult.recordset.find(
          (almacen) =>
            almacen.estado !== 'Activo' ||
            almacen.bloqueado,
        )

      if (almacenNoDisponible) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'WAREHOUSE_NOT_AVAILABLE',
            message:
              `El almacén "${almacenNoDisponible.nombre}" no está disponible.`,
          },
        })
      }

      const codigoResult =
        await new sql.Request(transaction)
          .input(
            'codigo',
            sql.VarChar(30),
            codigo,
          )
          .query(`
            SELECT id_transferencia
            FROM TransferenciaInventario
              WITH (
                UPDLOCK,
                HOLDLOCK
              )
            WHERE codigo = @codigo
          `)

      if (codigoResult.recordset.length) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'TRANSFER_CODE_EXISTS',
            message:
              'Ya existe una transferencia con ese código.',
          },
        })
      }

      for (
        const linea of lineasNormalizadas
      ) {
        const existenciaResult =
          await new sql.Request(transaction)
            .input(
              'idProducto',
              sql.Int,
              linea.idProducto,
            )
            .input(
              'idOrigen',
              sql.Int,
              idOrigen,
            )
            .query(`
              SELECT
                p.titulo,
                p.estado,
                i.stock_actual
              FROM Producto p

              LEFT JOIN Inventario i
                ON i.id_producto =
                   p.id_producto
                AND i.id_almacen =
                    @idOrigen

              WHERE
                p.id_producto =
                  @idProducto
            `)

        if (
          existenciaResult.recordset
            .length === 0
        ) {
          await transaction.rollback()
          transaction = null

          return res.status(404).json({
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message:
                'Uno de los productos no existe.',
            },
          })
        }

        const existencia =
          existenciaResult.recordset[0]

        if (
          existencia.estado !== 'Activo' ||
          existencia.stock_actual === null
        ) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'PRODUCT_NOT_IN_ORIGIN',
              message:
                `El producto "${existencia.titulo}" no tiene existencia en el almacén origen.`,
            },
          })
        }

        if (
          Number(existencia.stock_actual) <
          linea.cantidad
        ) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message:
                `No hay existencia suficiente para "${existencia.titulo}".`,
            },
          })
        }
      }

      const transferenciaResult =
        await new sql.Request(transaction)
          .input(
            'codigo',
            sql.VarChar(30),
            codigo,
          )
          .input(
            'idOrigen',
            sql.Int,
            idOrigen,
          )
          .input(
            'idDestino',
            sql.Int,
            idDestino,
          )
          .input(
            'idUsuario',
            sql.Int,
            idUsuario,
          )
          .input(
            'observacion',
            sql.VarChar(255),
            typeof observacion === 'string'
              ? observacion.trim() || null
              : null,
          )
          .query(`
            INSERT INTO
              TransferenciaInventario (
                codigo,
                id_almacen_origen,
                id_almacen_destino,
                id_solicitante,
                observacion
              )
            OUTPUT
              INSERTED.id_transferencia,
              INSERTED.codigo,
              INSERTED.estado,
              INSERTED.version
            VALUES (
              @codigo,
              @idOrigen,
              @idDestino,
              @idUsuario,
              @observacion
            )
          `)

      const transferencia =
        transferenciaResult.recordset[0]

      for (
        const linea of lineasNormalizadas
      ) {
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            transferencia.id_transferencia,
          )
          .input(
            'idProducto',
            sql.Int,
            linea.idProducto,
          )
          .input(
            'cantidad',
            sql.Int,
            linea.cantidad,
          )
          .query(`
            INSERT INTO
              DetalleTransferenciaInventario (
                id_transferencia,
                id_producto,
                cantidad_solicitada
              )
            VALUES (
              @idTransferencia,
              @idProducto,
              @cantidad
            )
          `)
      }

      await new sql.Request(transaction)
        .input(
          'idUsuario',
          sql.Int,
          idUsuario,
        )
        .input(
          'idTransferencia',
          sql.Int,
          transferencia.id_transferencia,
        )
        .input(
          'direccionIp',
          sql.VarChar(45),
          req.ip ?? null,
        )
        .query(`
          INSERT INTO AuditoriaInventario (
            id_usuario,
            tipo_accion,
            documento_tipo,
            documento_id,
            direccion_ip,
            resultado,
            detalle
          )
          VALUES (
            @idUsuario,
            'CREAR_TRANSFERENCIA',
            'transferencia',
            @idTransferencia,
            @direccionIp,
            'OK',
            'Transferencia creada en borrador'
          )
        `)

      await transaction.commit()
      transaction = null

      return res.status(201).json({
        success: true,
        message:
          'Transferencia creada correctamente.',
        data: {
          id: String(
            transferencia.id_transferencia,
          ),
          codigo:
            transferencia.codigo,
          estado:
            transferencia.estado,
          version:
            Number(transferencia.version),
        },
      })
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch (rollbackError) {
          console.error(
            'Error revirtiendo transferencia:',
            rollbackError,
          )
        }
      }

      console.error(
        'Error creando transferencia:',
        err,
      )

      const duplicate =
        err.number === 2601 ||
        err.number === 2627

      return res
        .status(duplicate ? 409 : 500)
        .json({
          success: false,
          error: {
            code: duplicate
              ? 'TRANSFER_CODE_EXISTS'
              : 'TRANSFER_CREATE_ERROR',
            message: duplicate
              ? 'Ya existe una transferencia con ese código.'
              : 'No se pudo crear la transferencia.',
            details:
              process.env.NODE_ENV ===
                'development'
                ? err.message
                : undefined,
          },
        })
    }
  },
)

// GET /api/inventario/transferencias
router.get('/transferencias', async (req, res) => {
  try {
    const pool = await getConnection()

    const transferencias =
      await consultarTransferencias(pool)

    return res.json({
      success: true,
      data: transferencias,
      total: transferencias.length,
    })
  } catch (err) {
    console.error(
      'Error listando transferencias:',
      err,
    )

    return res.status(500).json({
      success: false,
      error: {
        code: 'TRANSFER_LIST_ERROR',
        message:
          'No se pudieron cargar las transferencias.',
        details:
          process.env.NODE_ENV === 'development'
            ? err.message
            : undefined,
      },
    })
  }
})

// GET /api/inventario/transferencias/:id
router.get(
  '/transferencias/:id',
  async (req, res) => {
    const idTransferencia =
      Number(req.params.id)

    if (
      !Number.isInteger(idTransferencia) ||
      idTransferencia <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message:
            'El identificador de la transferencia no es válido.',
        },
      })
    }

    try {
      const pool = await getConnection()

      const transferencias =
        await consultarTransferencias(
          pool,
          idTransferencia,
        )

      if (transferencias.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TRANSFER_NOT_FOUND',
            message:
              'Transferencia no encontrada.',
          },
        })
      }

      return res.json({
        success: true,
        data: transferencias[0],
      })
    } catch (err) {
      console.error(
        'Error obteniendo transferencia:',
        err,
      )

      return res.status(500).json({
        success: false,
        error: {
          code: 'TRANSFER_GET_ERROR',
          message:
            'No se pudo cargar la transferencia.',
          details:
            process.env.NODE_ENV ===
              'development'
              ? err.message
              : undefined,
        },
      })
    }
  },
)
// POST /api/inventario/transferencias/:id/solicitar
router.post(
  '/transferencias/:id/solicitar',
  async (req, res) => {
    const idTransferencia =
      Number(req.params.id)

    const expectedVersion =
      Number(req.body.expectedVersion)

    if (
      !Number.isInteger(idTransferencia) ||
      idTransferencia <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message:
            'La transferencia no es válida.',
        },
      })
    }

    if (
      !Number.isInteger(expectedVersion) ||
      expectedVersion < 1
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EXPECTED_VERSION',
          message:
            'La versión de la transferencia no es válida.',
        },
      })
    }

    const usuarioReferencia = String(
      req.headers['x-user-id'] ?? '',
    ).trim()

    let transaction

    try {
      const pool = await getConnection()

      transaction =
        new sql.Transaction(pool)

      await transaction.begin(
        sql.ISOLATION_LEVEL.SERIALIZABLE,
      )

      const usuario =
        await obtenerUsuarioOperacion(
          transaction,
          usuarioReferencia,
        )

      if (!usuario) {
        await transaction.rollback()
        transaction = null

        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message:
              'No se pudo identificar al usuario.',
          },
        })
      }

      const transferenciaResult =
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            idTransferencia,
          )
          .query(`
            SELECT
              id_transferencia,
              codigo,
              estado,
              version
            FROM TransferenciaInventario
              WITH (
                UPDLOCK,
                HOLDLOCK
              )
            WHERE
              id_transferencia =
                @idTransferencia
          `)

      if (
        transferenciaResult.recordset
          .length === 0
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(404).json({
          success: false,
          error: {
            code: 'TRANSFER_NOT_FOUND',
            message:
              'Transferencia no encontrada.',
          },
        })
      }

      const transferencia =
        transferenciaResult.recordset[0]

      if (
        Number(transferencia.version) !==
        expectedVersion
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'La transferencia fue modificada por otro usuario. Recargue la página.',
          },
        })
      }

      if (
        transferencia.estado !== 'borrador'
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_STATE',
            message:
              'Solo se puede solicitar una transferencia en borrador.',
          },
        })
      }

      const lineasResult =
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            idTransferencia,
          )
          .query(`
            SELECT COUNT(*) AS total
            FROM DetalleTransferenciaInventario
            WHERE
              id_transferencia =
                @idTransferencia
          `)

      if (
        Number(
          lineasResult.recordset[0].total,
        ) === 0
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'TRANSFER_WITHOUT_LINES',
            message:
              'La transferencia no contiene productos.',
          },
        })
      }

      const updateResult =
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            idTransferencia,
          )
          .input(
            'expectedVersion',
            sql.Int,
            expectedVersion,
          )
          .query(`
            UPDATE TransferenciaInventario
            SET
              estado = 'solicitada',
              version = version + 1,
              fecha_solicitud =
                SYSDATETIME()
            OUTPUT
              INSERTED.id_transferencia,
              INSERTED.estado,
              INSERTED.version
            WHERE
              id_transferencia =
                @idTransferencia
              AND version =
                @expectedVersion
          `)

      if (
        updateResult.recordset.length === 0
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'La transferencia cambió mientras se procesaba la solicitud.',
          },
        })
      }

      const updated =
        updateResult.recordset[0]

      await new sql.Request(transaction)
        .input(
          'idUsuario',
          sql.Int,
          usuario.id_usuario,
        )
        .input(
          'idTransferencia',
          sql.Int,
          idTransferencia,
        )
        .input(
          'direccionIp',
          sql.VarChar(45),
          req.ip ?? null,
        )
        .query(`
          INSERT INTO AuditoriaInventario (
            id_usuario,
            tipo_accion,
            documento_tipo,
            documento_id,
            direccion_ip,
            resultado,
            detalle
          )
          VALUES (
            @idUsuario,
            'SOLICITAR_TRANSFERENCIA',
            'transferencia',
            @idTransferencia,
            @direccionIp,
            'OK',
            'Transferencia enviada a solicitud'
          )
        `)

      await transaction.commit()
      transaction = null

      return res.json({
        success: true,
        data: {
          id: String(
            updated.id_transferencia,
          ),
          estado: updated.estado,
          version:
            Number(updated.version),
        },
      })
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch { }
      }

      console.error(
        'Error solicitando transferencia:',
        err,
      )

      return res.status(500).json({
        success: false,
        error: {
          code: 'TRANSFER_REQUEST_ERROR',
          message:
            'No se pudo solicitar la transferencia.',
          details:
            process.env.NODE_ENV ===
              'development'
              ? err.message
              : undefined,
        },
      })
    }
  },
)

// POST /api/inventario/transferencias/:id/despachar
router.post(
  '/transferencias/:id/despachar',
  async (req, res) => {
    const idTransferencia = Number(req.params.id)
    const expectedVersion = Number(req.body.expectedVersion)
    const idempotencyKey = String(req.body.idempotencyKey ?? '').trim()
    const usuarioReferencia = String(req.headers['x-user-id'] ?? '').trim()

    if (!Number.isInteger(idTransferencia) || idTransferencia <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message: 'La transferencia no es válida.',
        },
      })
    }

    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EXPECTED_VERSION',
          message: 'La versión de la transferencia no es válida.',
        },
      })
    }

    if (!idempotencyKey || idempotencyKey.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'La clave de idempotencia no es válida.',
        },
      })
    }

    let transaction

    try {
      const pool = await getConnection()
      transaction = new sql.Transaction(pool)

      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

      const usuario = await obtenerUsuarioOperacion(
        transaction,
        usuarioReferencia,
      )

      if (!usuario) {
        await transaction.rollback()
        transaction = null

        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No se pudo identificar al usuario.',
          },
        })
      }

      const operacionResult = await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .query(`
          SELECT
            tipo_operacion,
            documento_tipo,
            documento_id,
            estado,
            respuesta
          FROM OperacionIdempotenteInventario WITH (
            UPDLOCK,
            HOLDLOCK
          )
          WHERE clave_idempotencia = @idempotencyKey
        `)

      if (operacionResult.recordset.length > 0) {
        const operacion = operacionResult.recordset[0]

        if (
          operacion.tipo_operacion !== 'despachar_transferencia' ||
          operacion.documento_tipo !== 'transferencia' ||
          Number(operacion.documento_id) !== idTransferencia
        ) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'La clave de idempotencia ya fue utilizada en otra operación.',
            },
          })
        }

        if (operacion.estado === 'procesada' && operacion.respuesta) {
          let respuestaAnterior

          try {
            respuestaAnterior = JSON.parse(operacion.respuesta)
          } catch {
            respuestaAnterior = null
          }

          await transaction.commit()
          transaction = null

          if (respuestaAnterior) {
            return res.json(respuestaAnterior)
          }

          return res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_RESPONSE_INVALID',
              message: 'La operación ya fue procesada, pero no se pudo recuperar su respuesta.',
            },
          })
        }

        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'OPERATION_IN_PROGRESS',
            message: 'Esta operación ya se está procesando.',
          },
        })
      }

      await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('idUsuario', sql.Int, usuario.id_usuario)
        .query(`
          INSERT INTO OperacionIdempotenteInventario (
            clave_idempotencia,
            tipo_operacion,
            documento_tipo,
            documento_id,
            id_usuario,
            estado
          )
          VALUES (
            @idempotencyKey,
            'despachar_transferencia',
            'transferencia',
            @idTransferencia,
            @idUsuario,
            'procesando'
          )
        `)

      const transferenciaResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .query(`
          SELECT
            t.id_transferencia,
            t.codigo,
            t.id_almacen_origen,
            t.id_almacen_destino,
            t.estado,
            t.version,
            ao.nombre AS almacen_origen_nombre,
            ao.estado AS almacen_origen_estado,
            ao.bloqueado AS almacen_origen_bloqueado,
            ad.nombre AS almacen_destino_nombre,
            ad.estado AS almacen_destino_estado,
            ad.bloqueado AS almacen_destino_bloqueado
          FROM TransferenciaInventario t WITH (
            UPDLOCK,
            HOLDLOCK
          )
          INNER JOIN Almacen ao
            ON ao.id_almacen = t.id_almacen_origen
          INNER JOIN Almacen ad
            ON ad.id_almacen = t.id_almacen_destino
          WHERE t.id_transferencia = @idTransferencia
        `)

      if (transferenciaResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null

        return res.status(404).json({
          success: false,
          error: {
            code: 'TRANSFER_NOT_FOUND',
            message: 'Transferencia no encontrada.',
          },
        })
      }

      const transferencia = transferenciaResult.recordset[0]

      if (Number(transferencia.version) !== expectedVersion) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'La transferencia fue modificada por otro usuario. Recargue la página.',
          },
        })
      }

      if (transferencia.estado !== 'solicitada') {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_STATE',
            message: 'Solo se puede despachar una transferencia solicitada.',
          },
        })
      }

      const almacenNoDisponible =
        transferencia.almacen_origen_estado !== 'Activo' ||
        transferencia.almacen_origen_bloqueado ||
        transferencia.almacen_destino_estado !== 'Activo' ||
        transferencia.almacen_destino_bloqueado

      if (almacenNoDisponible) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'WAREHOUSE_NOT_AVAILABLE',
            message: 'El almacén origen o destino está inactivo o bloqueado.',
          },
        })
      }

      const lineasResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .query(`
          SELECT
            dt.id_detalle_transferencia,
            dt.id_producto,
            dt.cantidad_solicitada,
            dt.cantidad_despachada,
            p.titulo
          FROM DetalleTransferenciaInventario dt WITH (
            UPDLOCK,
            HOLDLOCK
          )
          INNER JOIN Producto p
            ON p.id_producto = dt.id_producto
          WHERE dt.id_transferencia = @idTransferencia
          ORDER BY dt.id_detalle_transferencia
        `)

      if (lineasResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'TRANSFER_WITHOUT_LINES',
            message: 'La transferencia no contiene productos.',
          },
        })
      }

      for (const linea of lineasResult.recordset) {
        const cantidad = Number(linea.cantidad_solicitada)

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'INVALID_TRANSFER_QUANTITY',
              message: `La cantidad solicitada de "${linea.titulo}" no es válida.`,
            },
          })
        }

        if (Number(linea.cantidad_despachada) > 0) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'TRANSFER_LINE_ALREADY_DISPATCHED',
              message: `El producto "${linea.titulo}" ya fue despachado.`,
            },
          })
        }

        const inventarioResult = await new sql.Request(transaction)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idOrigen', sql.Int, transferencia.id_almacen_origen)
          .query(`
            SELECT
              id_inventario,
              stock_actual,
              version
            FROM Inventario WITH (
              UPDLOCK,
              HOLDLOCK
            )
            WHERE
              id_producto = @idProducto
              AND id_almacen = @idOrigen
          `)

        if (inventarioResult.recordset.length === 0) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'PRODUCT_NOT_IN_ORIGIN',
              message: `El producto "${linea.titulo}" no tiene existencia en el almacén origen.`,
            },
          })
        }

        const inventario = inventarioResult.recordset[0]
        const saldoAnterior = Number(inventario.stock_actual)

        if (saldoAnterior < cantidad) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `No hay existencia suficiente para "${linea.titulo}". Disponible: ${saldoAnterior}.`,
            },
          })
        }

        const saldoPosterior = saldoAnterior - cantidad

        await new sql.Request(transaction)
          .input('idInventario', sql.Int, inventario.id_inventario)
          .input('saldoPosterior', sql.Int, saldoPosterior)
          .query(`
            UPDATE Inventario
            SET
              stock_actual = @saldoPosterior,
              version = version + 1,
              fecha_actualizacion = SYSDATETIME()
            WHERE id_inventario = @idInventario
          `)

        const movimientoResult = await new sql.Request(transaction)
          .input('idInventario', sql.Int, inventario.id_inventario)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idOrigen', sql.Int, transferencia.id_almacen_origen)
          .input('idUsuario', sql.Int, usuario.id_usuario)
          .input('cantidad', sql.Int, -cantidad)
          .input('saldoAnterior', sql.Int, saldoAnterior)
          .input('saldoPosterior', sql.Int, saldoPosterior)
          .input('idTransferencia', sql.Int, idTransferencia)
          .query(`
            INSERT INTO MovimientoInventario (
              id_inventario,
              id_producto,
              id_almacen,
              id_usuario,
              tipo_movimiento,
              cantidad,
              saldo_anterior,
              saldo_posterior,
              documento_tipo,
              documento_id,
              motivo_codigo,
              observacion
            )
            OUTPUT INSERTED.id_movimiento
            VALUES (
              @idInventario,
              @idProducto,
              @idOrigen,
              @idUsuario,
              'transferencia_salida',
              @cantidad,
              @saldoAnterior,
              @saldoPosterior,
              'transferencia',
              @idTransferencia,
              'DESPACHO_TRANSFERENCIA',
              'Salida por despacho de transferencia'
            )
          `)

        const idMovimiento = movimientoResult.recordset[0].id_movimiento

        await new sql.Request(transaction)
          .input('idDetalle', sql.Int, linea.id_detalle_transferencia)
          .input('cantidad', sql.Int, cantidad)
          .query(`
            UPDATE DetalleTransferenciaInventario
            SET cantidad_despachada = @cantidad
            WHERE id_detalle_transferencia = @idDetalle
          `)

        await new sql.Request(transaction)
          .input('idUsuario', sql.Int, usuario.id_usuario)
          .input('idMovimiento', sql.Int, idMovimiento)
          .input('idTransferencia', sql.Int, idTransferencia)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idAlmacen', sql.Int, transferencia.id_almacen_origen)
          .input('direccionIp', sql.VarChar(45), req.ip ?? null)
          .query(`
            INSERT INTO AuditoriaInventario (
              id_usuario,
              tipo_accion,
              id_movimiento,
              documento_tipo,
              documento_id,
              id_producto,
              id_almacen,
              direccion_ip,
              resultado,
              detalle
            )
            VALUES (
              @idUsuario,
              'DESPACHAR_TRANSFERENCIA_LINEA',
              @idMovimiento,
              'transferencia',
              @idTransferencia,
              @idProducto,
              @idAlmacen,
              @direccionIp,
              'OK',
              'Producto descontado del almacén origen'
            )
          `)
      }

      const updateResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('expectedVersion', sql.Int, expectedVersion)
        .query(`
          UPDATE TransferenciaInventario
          SET
            estado = 'en_transito',
            version = version + 1,
            fecha_despacho = SYSDATETIME()
          OUTPUT
            INSERTED.id_transferencia,
            INSERTED.estado,
            INSERTED.version
          WHERE
            id_transferencia = @idTransferencia
            AND version = @expectedVersion
            AND estado = 'solicitada'
        `)

      if (updateResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'La transferencia cambió mientras se procesaba el despacho.',
          },
        })
      }

      const updated = updateResult.recordset[0]

      await new sql.Request(transaction)
        .input('idUsuario', sql.Int, usuario.id_usuario)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('direccionIp', sql.VarChar(45), req.ip ?? null)
        .query(`
          INSERT INTO AuditoriaInventario (
            id_usuario,
            tipo_accion,
            documento_tipo,
            documento_id,
            direccion_ip,
            resultado,
            detalle
          )
          VALUES (
            @idUsuario,
            'DESPACHAR_TRANSFERENCIA',
            'transferencia',
            @idTransferencia,
            @direccionIp,
            'OK',
            'Transferencia despachada y enviada a tránsito'
          )
        `)

      const respuesta = {
        success: true,
        data: {
          id: String(updated.id_transferencia),
          estado: updated.estado,
          version: Number(updated.version),
        },
      }

      await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .input('respuesta', sql.NVarChar(sql.MAX), JSON.stringify(respuesta))
        .query(`
          UPDATE OperacionIdempotenteInventario
          SET
            estado = 'procesada',
            respuesta = @respuesta
          WHERE clave_idempotencia = @idempotencyKey
        `)

      await transaction.commit()
      transaction = null

      return res.json(respuesta)
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch (rollbackError) {
          console.error('Error revirtiendo el despacho:', rollbackError)
        }
      }

      console.error('Error despachando transferencia:', err)

      const duplicate = err.number === 2601 || err.number === 2627

      return res.status(duplicate ? 409 : 500).json({
        success: false,
        error: {
          code: duplicate
            ? 'IDEMPOTENCY_KEY_REUSED'
            : 'TRANSFER_DISPATCH_ERROR',
          message: duplicate
            ? 'La clave de idempotencia ya fue utilizada.'
            : 'No se pudo despachar la transferencia.',
          details:
            process.env.NODE_ENV === 'development'
              ? err.message
              : undefined,
        },
      })
    }
  },
)

// POST /api/inventario/transferencias/:id/recibir
router.post(
  '/transferencias/:id/recibir',
  async (req, res) => {
    const idTransferencia = Number(req.params.id)
    const expectedVersion = Number(req.body.expectedVersion)
    const idempotencyKey = String(req.body.idempotencyKey ?? '').trim()
    const recepciones = req.body.recepciones
    const observacion =
      typeof req.body.observacion === 'string'
        ? req.body.observacion.trim() || null
        : null
    const usuarioReferencia = String(req.headers['x-user-id'] ?? '').trim()

    if (!Number.isInteger(idTransferencia) || idTransferencia <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_ID',
          message: 'La transferencia no es válida.',
        },
      })
    }

    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EXPECTED_VERSION',
          message: 'La versión de la transferencia no es válida.',
        },
      })
    }

    if (!idempotencyKey || idempotencyKey.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'La clave de idempotencia no es válida.',
        },
      })
    }

    if (!Array.isArray(recepciones) || recepciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECEPTION_LINES_REQUIRED',
          message: 'Debe registrar al menos una línea de recepción.',
        },
      })
    }

    const lineasNormalizadas = []
    const idsUtilizados = new Set()
    let cantidadTotalProcesada = 0

    for (const linea of recepciones) {
      const lineaId = Number(linea.lineaId)
      const cantidadRecibida = Number(linea.cantidadRecibida ?? 0)
      const cantidadFaltante = Number(linea.cantidadFaltante ?? 0)
      const cantidadDanada = Number(linea.cantidadDanada ?? 0)

      if (!Number.isInteger(lineaId) || lineaId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RECEPTION_LINE',
            message: 'Una de las líneas de recepción no es válida.',
          },
        })
      }

      if (
        !Number.isInteger(cantidadRecibida) ||
        !Number.isInteger(cantidadFaltante) ||
        !Number.isInteger(cantidadDanada) ||
        cantidadRecibida < 0 ||
        cantidadFaltante < 0 ||
        cantidadDanada < 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RECEPTION_QUANTITY',
            message: 'Las cantidades recibidas, faltantes y dañadas deben ser enteros mayores o iguales que cero.',
          },
        })
      }

      if (idsUtilizados.has(lineaId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_RECEPTION_LINE',
            message: 'Una línea de transferencia no puede aparecer dos veces en la recepción.',
          },
        })
      }

      const totalLinea =
        cantidadRecibida + cantidadFaltante + cantidadDanada

      if (totalLinea === 0) {
        continue
      }

      idsUtilizados.add(lineaId)
      cantidadTotalProcesada += totalLinea
      lineasNormalizadas.push({
        lineaId,
        cantidadRecibida,
        cantidadFaltante,
        cantidadDanada,
        totalLinea,
      })
    }

    if (cantidadTotalProcesada === 0 || lineasNormalizadas.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_RECEPTION',
          message: 'Debe registrar al menos una cantidad recibida, faltante o dañada.',
        },
      })
    }

    let transaction

    try {
      const pool = await getConnection()
      transaction = new sql.Transaction(pool)

      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

      const usuario = await obtenerUsuarioOperacion(
        transaction,
        usuarioReferencia,
      )

      if (!usuario) {
        await transaction.rollback()
        transaction = null

        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No se pudo identificar al usuario.',
          },
        })
      }

      const operacionResult = await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .query(`
          SELECT
            tipo_operacion,
            documento_tipo,
            documento_id,
            estado,
            respuesta
          FROM OperacionIdempotenteInventario WITH (
            UPDLOCK,
            HOLDLOCK
          )
          WHERE clave_idempotencia = @idempotencyKey
        `)

      if (operacionResult.recordset.length > 0) {
        const operacion = operacionResult.recordset[0]

        if (
          operacion.tipo_operacion !== 'recibir_transferencia' ||
          operacion.documento_tipo !== 'transferencia' ||
          Number(operacion.documento_id) !== idTransferencia
        ) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'La clave de idempotencia ya fue utilizada en otra operación.',
            },
          })
        }

        if (operacion.estado === 'procesada' && operacion.respuesta) {
          let respuestaAnterior

          try {
            respuestaAnterior = JSON.parse(operacion.respuesta)
          } catch {
            respuestaAnterior = null
          }

          await transaction.commit()
          transaction = null

          if (respuestaAnterior) {
            return res.json(respuestaAnterior)
          }

          return res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_RESPONSE_INVALID',
              message: 'La recepción ya fue procesada, pero no se pudo recuperar su respuesta.',
            },
          })
        }

        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'OPERATION_IN_PROGRESS',
            message: 'Esta recepción ya se está procesando.',
          },
        })
      }

      await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('idUsuario', sql.Int, usuario.id_usuario)
        .query(`
          INSERT INTO OperacionIdempotenteInventario (
            clave_idempotencia,
            tipo_operacion,
            documento_tipo,
            documento_id,
            id_usuario,
            estado
          )
          VALUES (
            @idempotencyKey,
            'recibir_transferencia',
            'transferencia',
            @idTransferencia,
            @idUsuario,
            'procesando'
          )
        `)

      const transferenciaResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .query(`
          SELECT
            t.id_transferencia,
            t.codigo,
            t.id_almacen_origen,
            t.id_almacen_destino,
            t.estado,
            t.version,
            ad.nombre AS almacen_destino_nombre,
            ad.estado AS almacen_destino_estado,
            ad.bloqueado AS almacen_destino_bloqueado
          FROM TransferenciaInventario t WITH (
            UPDLOCK,
            HOLDLOCK
          )
          INNER JOIN Almacen ad
            ON ad.id_almacen = t.id_almacen_destino
          WHERE t.id_transferencia = @idTransferencia
        `)

      if (transferenciaResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null

        return res.status(404).json({
          success: false,
          error: {
            code: 'TRANSFER_NOT_FOUND',
            message: 'Transferencia no encontrada.',
          },
        })
      }

      const transferencia = transferenciaResult.recordset[0]

      if (Number(transferencia.version) !== expectedVersion) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'La transferencia fue modificada por otro usuario. Recargue la página.',
          },
        })
      }

      if (!['en_transito', 'recibida_parcial'].includes(transferencia.estado)) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_STATE',
            message: 'Solo se pueden recibir transferencias en tránsito o recibidas parcialmente.',
          },
        })
      }

      if (
        transferencia.almacen_destino_estado !== 'Activo' ||
        transferencia.almacen_destino_bloqueado
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'DESTINATION_WAREHOUSE_NOT_AVAILABLE',
            message: `El almacén destino "${transferencia.almacen_destino_nombre}" está inactivo o bloqueado.`,
          },
        })
      }

      const lineasResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .query(`
          SELECT
            dt.id_detalle_transferencia,
            dt.id_producto,
            dt.cantidad_despachada,
            dt.cantidad_recibida,
            dt.cantidad_faltante,
            dt.cantidad_danada,
            p.titulo
          FROM DetalleTransferenciaInventario dt WITH (
            UPDLOCK,
            HOLDLOCK
          )
          INNER JOIN Producto p
            ON p.id_producto = dt.id_producto
          WHERE dt.id_transferencia = @idTransferencia
        `)

      const lineasPorId = new Map(
        lineasResult.recordset.map((linea) => [
          Number(linea.id_detalle_transferencia),
          linea,
        ]),
      )

      for (const recepcion of lineasNormalizadas) {
        const linea = lineasPorId.get(recepcion.lineaId)

        if (!linea) {
          await transaction.rollback()
          transaction = null

          return res.status(404).json({
            success: false,
            error: {
              code: 'TRANSFER_LINE_NOT_FOUND',
              message: 'Una línea no pertenece a la transferencia indicada.',
            },
          })
        }

        const pendiente =
          Number(linea.cantidad_despachada) -
          Number(linea.cantidad_recibida) -
          Number(linea.cantidad_faltante) -
          Number(linea.cantidad_danada)

        if (recepcion.totalLinea > pendiente) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'RECEPTION_EXCEEDS_PENDING',
              message: `La recepción de "${linea.titulo}" supera la cantidad pendiente (${pendiente}).`,
            },
          })
        }

        if (pendiente <= 0) {
          await transaction.rollback()
          transaction = null

          return res.status(409).json({
            success: false,
            error: {
              code: 'TRANSFER_LINE_ALREADY_RESOLVED',
              message: `La línea de "${linea.titulo}" ya fue recibida completamente.`,
            },
          })
        }
      }

      const recepcionResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('idUsuario', sql.Int, usuario.id_usuario)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .input('observacion', sql.VarChar(255), observacion)
        .query(`
          INSERT INTO RecepcionTransferencia (
            id_transferencia,
            id_usuario,
            clave_idempotencia,
            observacion
          )
          OUTPUT
            INSERTED.id_recepcion,
            INSERTED.fecha_recepcion
          VALUES (
            @idTransferencia,
            @idUsuario,
            @idempotencyKey,
            @observacion
          )
        `)

      const recepcionCreada = recepcionResult.recordset[0]

      for (const recepcion of lineasNormalizadas) {
        const linea = lineasPorId.get(recepcion.lineaId)

        await new sql.Request(transaction)
          .input('idRecepcion', sql.Int, recepcionCreada.id_recepcion)
          .input('idDetalle', sql.Int, recepcion.lineaId)
          .input('cantidadRecibida', sql.Int, recepcion.cantidadRecibida)
          .input('cantidadFaltante', sql.Int, recepcion.cantidadFaltante)
          .input('cantidadDanada', sql.Int, recepcion.cantidadDanada)
          .query(`
            INSERT INTO DetalleRecepcionTransferencia (
              id_recepcion,
              id_detalle_transferencia,
              cantidad_recibida,
              cantidad_faltante,
              cantidad_danada
            )
            VALUES (
              @idRecepcion,
              @idDetalle,
              @cantidadRecibida,
              @cantidadFaltante,
              @cantidadDanada
            )
          `)

        await new sql.Request(transaction)
          .input('idDetalle', sql.Int, recepcion.lineaId)
          .input('cantidadRecibida', sql.Int, recepcion.cantidadRecibida)
          .input('cantidadFaltante', sql.Int, recepcion.cantidadFaltante)
          .input('cantidadDanada', sql.Int, recepcion.cantidadDanada)
          .query(`
            UPDATE DetalleTransferenciaInventario
            SET
              cantidad_recibida = cantidad_recibida + @cantidadRecibida,
              cantidad_faltante = cantidad_faltante + @cantidadFaltante,
              cantidad_danada = cantidad_danada + @cantidadDanada
            WHERE id_detalle_transferencia = @idDetalle
          `)

        if (recepcion.cantidadRecibida <= 0) {
          continue
        }

        let inventarioResult = await new sql.Request(transaction)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idDestino', sql.Int, transferencia.id_almacen_destino)
          .query(`
            SELECT
              id_inventario,
              stock_actual
            FROM Inventario WITH (
              UPDLOCK,
              HOLDLOCK
            )
            WHERE
              id_producto = @idProducto
              AND id_almacen = @idDestino
          `)

        let idInventario
        let saldoAnterior
        let saldoPosterior

        if (inventarioResult.recordset.length === 0) {
          saldoAnterior = 0
          saldoPosterior = recepcion.cantidadRecibida

          inventarioResult = await new sql.Request(transaction)
            .input('idProducto', sql.Int, linea.id_producto)
            .input('idDestino', sql.Int, transferencia.id_almacen_destino)
            .input('stockInicial', sql.Int, saldoPosterior)
            .query(`
              INSERT INTO Inventario (
                id_producto,
                id_almacen,
                stock_actual,
                stock_minimo,
                ubicacion
              )
              OUTPUT INSERTED.id_inventario
              VALUES (
                @idProducto,
                @idDestino,
                @stockInicial,
                0,
                'Pendiente de ubicación'
              )
            `)

          idInventario = inventarioResult.recordset[0].id_inventario
        } else {
          const inventario = inventarioResult.recordset[0]
          idInventario = inventario.id_inventario
          saldoAnterior = Number(inventario.stock_actual)
          saldoPosterior = saldoAnterior + recepcion.cantidadRecibida

          await new sql.Request(transaction)
            .input('idInventario', sql.Int, idInventario)
            .input('saldoPosterior', sql.Int, saldoPosterior)
            .query(`
              UPDATE Inventario
              SET
                stock_actual = @saldoPosterior,
                version = version + 1,
                fecha_actualizacion = SYSDATETIME()
              WHERE id_inventario = @idInventario
            `)
        }

        const movimientoResult = await new sql.Request(transaction)
          .input('idInventario', sql.Int, idInventario)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idDestino', sql.Int, transferencia.id_almacen_destino)
          .input('idUsuario', sql.Int, usuario.id_usuario)
          .input('cantidad', sql.Int, recepcion.cantidadRecibida)
          .input('saldoAnterior', sql.Int, saldoAnterior)
          .input('saldoPosterior', sql.Int, saldoPosterior)
          .input('idTransferencia', sql.Int, idTransferencia)
          .query(`
            INSERT INTO MovimientoInventario (
              id_inventario,
              id_producto,
              id_almacen,
              id_usuario,
              tipo_movimiento,
              cantidad,
              saldo_anterior,
              saldo_posterior,
              documento_tipo,
              documento_id,
              motivo_codigo,
              observacion
            )
            OUTPUT INSERTED.id_movimiento
            VALUES (
              @idInventario,
              @idProducto,
              @idDestino,
              @idUsuario,
              'transferencia_entrada',
              @cantidad,
              @saldoAnterior,
              @saldoPosterior,
              'transferencia',
              @idTransferencia,
              'RECEPCION_TRANSFERENCIA',
              'Entrada por recepción de transferencia'
            )
          `)

        await new sql.Request(transaction)
          .input('idUsuario', sql.Int, usuario.id_usuario)
          .input('idMovimiento', sql.Int, movimientoResult.recordset[0].id_movimiento)
          .input('idTransferencia', sql.Int, idTransferencia)
          .input('idProducto', sql.Int, linea.id_producto)
          .input('idAlmacen', sql.Int, transferencia.id_almacen_destino)
          .input('direccionIp', sql.VarChar(45), req.ip ?? null)
          .query(`
            INSERT INTO AuditoriaInventario (
              id_usuario,
              tipo_accion,
              id_movimiento,
              documento_tipo,
              documento_id,
              id_producto,
              id_almacen,
              direccion_ip,
              resultado,
              detalle
            )
            VALUES (
              @idUsuario,
              'RECIBIR_TRANSFERENCIA_LINEA',
              @idMovimiento,
              'transferencia',
              @idTransferencia,
              @idProducto,
              @idAlmacen,
              @direccionIp,
              'OK',
              'Producto agregado al inventario destino'
            )
          `)
      }

      const pendientesResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .query(`
          SELECT COUNT(*) AS pendientes
          FROM DetalleTransferenciaInventario
          WHERE
            id_transferencia = @idTransferencia
            AND (
              cantidad_recibida +
              cantidad_faltante +
              cantidad_danada
            ) < cantidad_despachada
        `)

      const finalizada = Number(pendientesResult.recordset[0].pendientes) === 0
      const nuevoEstado = finalizada ? 'recibida' : 'recibida_parcial'

      const updateResult = await new sql.Request(transaction)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('expectedVersion', sql.Int, expectedVersion)
        .input('nuevoEstado', sql.VarChar(30), nuevoEstado)
        .query(`
          UPDATE TransferenciaInventario
          SET
            estado = @nuevoEstado,
            version = version + 1,
            fecha_recepcion = CASE
              WHEN @nuevoEstado = 'recibida'
                THEN SYSDATETIME()
              ELSE fecha_recepcion
            END
          OUTPUT
            INSERTED.id_transferencia,
            INSERTED.estado,
            INSERTED.version
          WHERE
            id_transferencia = @idTransferencia
            AND version = @expectedVersion
            AND estado IN ('en_transito', 'recibida_parcial')
        `)

      if (updateResult.recordset.length === 0) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message: 'La transferencia cambió mientras se procesaba la recepción.',
          },
        })
      }

      const updated = updateResult.recordset[0]

      await new sql.Request(transaction)
        .input('idUsuario', sql.Int, usuario.id_usuario)
        .input('idTransferencia', sql.Int, idTransferencia)
        .input('direccionIp', sql.VarChar(45), req.ip ?? null)
        .input(
          'detalle',
          sql.VarChar(255),
          finalizada
            ? 'Transferencia recibida completamente'
            : 'Recepción parcial registrada',
        )
        .query(`
          INSERT INTO AuditoriaInventario (
            id_usuario,
            tipo_accion,
            documento_tipo,
            documento_id,
            direccion_ip,
            resultado,
            detalle
          )
          VALUES (
            @idUsuario,
            'RECIBIR_TRANSFERENCIA',
            'transferencia',
            @idTransferencia,
            @direccionIp,
            'OK',
            @detalle
          )
        `)

      const respuesta = {
        success: true,
        data: {
          id: String(updated.id_transferencia),
          recepcionId: String(recepcionCreada.id_recepcion),
          estado: updated.estado,
          version: Number(updated.version),
        },
      }

      await new sql.Request(transaction)
        .input('idempotencyKey', sql.VarChar(100), idempotencyKey)
        .input('respuesta', sql.NVarChar(sql.MAX), JSON.stringify(respuesta))
        .query(`
          UPDATE OperacionIdempotenteInventario
          SET
            estado = 'procesada',
            respuesta = @respuesta
          WHERE clave_idempotencia = @idempotencyKey
        `)

      await transaction.commit()
      transaction = null

      return res.json(respuesta)
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch (rollbackError) {
          console.error('Error revirtiendo la recepción:', rollbackError)
        }
      }

      console.error('Error recibiendo transferencia:', err)

      const duplicate = err.number === 2601 || err.number === 2627

      return res.status(duplicate ? 409 : 500).json({
        success: false,
        error: {
          code: duplicate
            ? 'IDEMPOTENCY_KEY_REUSED'
            : 'TRANSFER_RECEPTION_ERROR',
          message: duplicate
            ? 'La clave de idempotencia ya fue utilizada.'
            : 'No se pudo registrar la recepción.',
          details:
            process.env.NODE_ENV === 'development'
              ? err.message
              : undefined,
        },
      })
    }
  },
)

// POST /api/inventario/transferencias/:id/cancelar
router.post(
  '/transferencias/:id/cancelar',
  async (req, res) => {
    const idTransferencia =
      Number(req.params.id)

    const expectedVersion =
      Number(req.body.expectedVersion)

    if (
      !Number.isInteger(idTransferencia) ||
      idTransferencia <= 0 ||
      !Number.isInteger(expectedVersion) ||
      expectedVersion < 1
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSFER_REQUEST',
          message:
            'El identificador o la versión no son válidos.',
        },
      })
    }

    const usuarioReferencia = String(
      req.headers['x-user-id'] ?? '',
    ).trim()

    let transaction

    try {
      const pool = await getConnection()

      transaction =
        new sql.Transaction(pool)

      await transaction.begin(
        sql.ISOLATION_LEVEL.SERIALIZABLE,
      )

      const usuario =
        await obtenerUsuarioOperacion(
          transaction,
          usuarioReferencia,
        )

      if (!usuario) {
        await transaction.rollback()
        transaction = null

        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message:
              'No se pudo identificar al usuario.',
          },
        })
      }

      const transferenciaResult =
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            idTransferencia,
          )
          .query(`
            SELECT
              estado,
              version
            FROM TransferenciaInventario
              WITH (
                UPDLOCK,
                HOLDLOCK
              )
            WHERE
              id_transferencia =
                @idTransferencia
          `)

      if (
        transferenciaResult.recordset
          .length === 0
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(404).json({
          success: false,
          error: {
            code: 'TRANSFER_NOT_FOUND',
            message:
              'Transferencia no encontrada.',
          },
        })
      }

      const transferencia =
        transferenciaResult.recordset[0]

      if (
        Number(transferencia.version) !==
        expectedVersion
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'La transferencia fue modificada. Recargue la página.',
          },
        })
      }

      if (
        ![
          'borrador',
          'solicitada',
        ].includes(
          transferencia.estado,
        )
      ) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'INVALID_TRANSFER_STATE',
            message:
              'Solo se puede cancelar una transferencia en borrador o solicitada.',
          },
        })
      }

      const updateResult =
        await new sql.Request(transaction)
          .input(
            'idTransferencia',
            sql.Int,
            idTransferencia,
          )
          .input(
            'expectedVersion',
            sql.Int,
            expectedVersion,
          )
          .query(`
            UPDATE TransferenciaInventario
            SET
              estado = 'cancelada',
              version = version + 1
            OUTPUT
              INSERTED.id_transferencia,
              INSERTED.estado,
              INSERTED.version
            WHERE
              id_transferencia =
                @idTransferencia
              AND version =
                @expectedVersion
          `)

      const updated =
        updateResult.recordset[0]

      if (!updated) {
        await transaction.rollback()
        transaction = null

        return res.status(409).json({
          success: false,
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'La transferencia cambió mientras se cancelaba.',
          },
        })
      }

      await new sql.Request(transaction)
        .input(
          'idUsuario',
          sql.Int,
          usuario.id_usuario,
        )
        .input(
          'idTransferencia',
          sql.Int,
          idTransferencia,
        )
        .input(
          'direccionIp',
          sql.VarChar(45),
          req.ip ?? null,
        )
        .query(`
          INSERT INTO AuditoriaInventario (
            id_usuario,
            tipo_accion,
            documento_tipo,
            documento_id,
            direccion_ip,
            resultado,
            detalle
          )
          VALUES (
            @idUsuario,
            'CANCELAR_TRANSFERENCIA',
            'transferencia',
            @idTransferencia,
            @direccionIp,
            'OK',
            'Transferencia cancelada'
          )
        `)

      await transaction.commit()
      transaction = null

      return res.json({
        success: true,
        data: {
          id: String(
            updated.id_transferencia,
          ),
          estado: updated.estado,
          version:
            Number(updated.version),
        },
      })
    } catch (err) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch { }
      }

      console.error(
        'Error cancelando transferencia:',
        err,
      )

      return res.status(500).json({
        success: false,
        error: {
          code: 'TRANSFER_CANCEL_ERROR',
          message:
            'No se pudo cancelar la transferencia.',
          details:
            process.env.NODE_ENV ===
              'development'
              ? err.message
              : undefined,
        },
      })
    }
  },
)

module.exports = router
