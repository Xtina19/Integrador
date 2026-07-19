-- =============================================================================
-- LibroSys — Vistas para dashboards
-- Archivo: 13_views.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- Dashboard Inventario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_inventario AS
SELECT
  COUNT(DISTINCT p.id)                                              AS total_productos,
  COUNT(DISTINCT i.id)                                              AS registros_inventario,
  COALESCE(SUM(i.stock), 0)                                         AS stock_total_unidades,
  SUM(CASE WHEN i.estado_stock = 'bajo'    THEN 1 ELSE 0 END)       AS productos_stock_bajo,
  SUM(CASE WHEN i.estado_stock = 'agotado' THEN 1 ELSE 0 END)       AS productos_agotados,
  COUNT(DISTINCT i.almacen_id)                                      AS almacenes_con_stock,
  (
    SELECT COUNT(*)
    FROM ajuste_inventario aj
    WHERE aj.estado = 'pendiente'
  )                                                                 AS ajustes_pendientes,
  (
    SELECT COUNT(*)
    FROM movimiento_inventario mi
    WHERE mi.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  )                                                                 AS movimientos_ultimos_30_dias
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
WHERE p.estado = 'activo';

-- -----------------------------------------------------------------------------
-- Dashboard Compras (DEPRECATED FASE 7 — KPIs vía API / FE)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_dashboard_compras;

-- -----------------------------------------------------------------------------
-- Dashboard Importaciones
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_importaciones AS
SELECT
  (
    SELECT COUNT(*)
    FROM embarque e
    WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana')
  )                                                                 AS embarques_activos,
  (
    SELECT COALESCE(SUM(e.cantidad_cajas), 0)
    FROM embarque e
    WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana')
  )                                                                 AS cajas_en_transito,
  (
    SELECT COALESCE(ROUND(AVG(cl.costo_final), 2), 0)
    FROM costeo_libro cl
  )                                                                 AS costo_promedio_libro,
  (
    SELECT COUNT(*)
    FROM embarque e
    WHERE YEAR(e.created_at) = YEAR(CURDATE())
  )                                                                 AS importaciones_anio,
  (
    SELECT COUNT(*) FROM factura_internacional fi
    WHERE fi.estado_pago = 'pendiente'
  )                                                                 AS facturas_int_pendientes,
  (
    SELECT COUNT(*) FROM consolidacion c WHERE c.estado = 'activa'
  )                                                                 AS consolidaciones_activas,
  (
    SELECT COALESCE(SUM(ce.total_costos), 0)
    FROM costos_embarque ce
  )                                                                 AS total_costos_flete_registrados;

-- -----------------------------------------------------------------------------
-- Dashboard Eventos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_eventos AS
SELECT
  COUNT(*)                                                          AS total_eventos,
  SUM(CASE WHEN ev.estado IN ('programado','personal_asignado') THEN 1 ELSE 0 END) AS eventos_proximos,
  SUM(CASE WHEN ev.estado = 'en_curso' THEN 1 ELSE 0 END)           AS eventos_en_curso,
  COALESCE(SUM(ev.participantes_estimados), 0)                      AS participantes_estimados_total,
  COALESCE(SUM(ev.reservas), 0)                                     AS reservas_total,
  (
    SELECT COALESCE(SUM(pe.monto_presupuestado), 0)
    FROM presupuestos_evento pe
  )                                                                 AS presupuesto_total,
  (
    SELECT COALESCE(SUM(pe.monto_utilizado), 0)
    FROM presupuestos_evento pe
  )                                                                 AS presupuesto_utilizado,
  (
    SELECT COUNT(DISTINCT ae.usuario_id)
    FROM asignacion_evento ae
    WHERE ae.estado IN ('asignado','confirmado')
  )                                                                 AS personal_asignado_activo
FROM eventos ev;

-- -----------------------------------------------------------------------------
-- Dashboard Ventas
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_ventas AS
SELECT
  COUNT(*)                                                          AS total_ventas,
  SUM(CASE WHEN v.estado = 'confirmada' THEN 1 ELSE 0 END)          AS ventas_confirmadas,
  COALESCE(SUM(CASE WHEN v.estado = 'confirmada' THEN v.total ELSE 0 END), 0) AS monto_total_ventas,
  COALESCE(ROUND(AVG(CASE WHEN v.estado = 'confirmada' THEN v.total END), 2), 0) AS ticket_promedio,
  (
    SELECT COALESCE(SUM(dv.cantidad), 0)
    FROM detalle_venta dv
    INNER JOIN venta vx ON vx.id = dv.venta_id AND vx.estado = 'confirmada'
  )                                                                 AS unidades_vendidas,
  (
    SELECT COUNT(*)
    FROM venta v2
    WHERE v2.estado = 'confirmada'
      AND v2.fecha_venta >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  )                                                                 AS ventas_mes_actual,
  (
    SELECT COALESCE(SUM(v3.total), 0)
    FROM venta v3
    WHERE v3.estado = 'confirmada'
      AND v3.fecha_venta >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  )                                                                 AS monto_ventas_mes_actual
FROM venta v;

-- -----------------------------------------------------------------------------
-- Vista auxiliar: embarques en tránsito (detalle)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_embarques_en_transito AS
SELECT
  e.id,
  e.codigo,
  e.tipo_transporte,
  e.origen,
  e.destino,
  e.fecha_llegada_estimada,
  e.cantidad_cajas,
  e.estado,
  fi.codigo AS factura_codigo,
  oc.codigo AS orden_compra_codigo,
  p.nombre  AS proveedor
FROM embarque e
INNER JOIN factura_internacional fi ON fi.id = e.factura_internacional_id
INNER JOIN orden_compra oc ON oc.id = e.orden_compra_id
INNER JOIN proveedores p ON p.id = e.proveedor_id
WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana');
