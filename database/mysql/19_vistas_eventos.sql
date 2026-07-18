-- =============================================================================
-- LibroSys — Vistas Eventos y Facturación
-- Archivo: 19_vistas_eventos.sql
-- =============================================================================

USE librosys;

CREATE OR REPLACE VIEW vw_dashboard_evento_facturacion AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  e.estado AS evento_estado,
  e.presupuesto_asignado,
  e.total_ingresos,
  e.total_gastos,
  e.presupuesto_disponible,
  e.estado_presupuesto,
  COUNT(DISTINCT ce.id) AS cajas_abiertas,
  COUNT(DISTINCT fe.id) AS facturas_emitidas,
  COALESCE(SUM(CASE WHEN fe.estado = 'emitida' THEN fe.total END), 0) AS total_facturado
FROM eventos e
LEFT JOIN caja_evento ce ON ce.evento_id = e.id AND ce.estado = 'abierta'
LEFT JOIN factura_evento fe ON fe.evento_id = e.id
GROUP BY e.id;

CREATE OR REPLACE VIEW vw_ventas_por_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  v.id AS venta_id,
  v.codigo AS venta_codigo,
  v.tipo_venta,
  v.fecha_venta,
  v.cliente_nombre,
  v.subtotal,
  v.impuestos AS itbis,
  v.total,
  v.estado AS estado_venta,
  u.nombre AS cajero,
  fe.codigo AS factura_evento_codigo
FROM venta v
INNER JOIN eventos e ON e.id = v.evento_id
LEFT JOIN factura_evento fe ON fe.venta_id = v.id
LEFT JOIN usuarios u ON u.id = v.usuario_id
WHERE v.tipo_venta IN ('evento', 'feria');

CREATE OR REPLACE VIEW vw_ventas_por_editorial_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  ed.id AS editorial_id,
  ed.nombre AS editorial_nombre,
  COUNT(DISTINCT v.id) AS cantidad_ventas,
  COALESCE(SUM(dv.cantidad), 0) AS unidades_vendidas,
  COALESCE(SUM(dv.subtotal), 0) AS subtotal_vendido
FROM eventos e
INNER JOIN venta v ON v.evento_id = e.id AND v.estado = 'confirmada'
INNER JOIN detalle_venta dv ON dv.venta_id = v.id
INNER JOIN productos p ON p.id = dv.producto_id
INNER JOIN editoriales ed ON ed.id = p.editorial_id
GROUP BY e.id, ed.id;

CREATE OR REPLACE VIEW vw_productos_mas_vendidos_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  p.id AS producto_id,
  p.codigo AS producto_codigo,
  p.titulo AS producto_titulo,
  SUM(dv.cantidad) AS cantidad_vendida,
  SUM(dv.subtotal) AS monto_vendido
FROM eventos e
INNER JOIN venta v ON v.evento_id = e.id AND v.estado = 'confirmada'
INNER JOIN detalle_venta dv ON dv.venta_id = v.id
INNER JOIN productos p ON p.id = dv.producto_id
GROUP BY e.id, p.id
ORDER BY cantidad_vendida DESC;

CREATE OR REPLACE VIEW vw_historial_ventas_unificado AS
SELECT
  v.id,
  v.codigo,
  v.tipo_venta,
  v.fecha_venta,
  v.cliente_nombre,
  v.total,
  v.estado,
  s.nombre AS sucursal,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  e.fecha_inicio AS evento_fecha_inicio,
  e.fecha_fin AS evento_fecha_fin
FROM venta v
INNER JOIN sucursales s ON s.id = v.sucursal_id
LEFT JOIN eventos e ON e.id = v.evento_id;
