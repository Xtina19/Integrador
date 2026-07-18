-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 12_vistas_indices.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Vistas de consulta para reportes/dashboard del módulo Inventario, más los
-- índices compuestos que las respaldan. Ninguna vista muta datos.
--
-- Nota de idempotencia: `ADD INDEX` no admite `IF NOT EXISTS` en MySQL 8
-- vanilla. Este archivo asume una corrida única sobre la línea base descrita
-- en 03_existencias_movimientos.sql / 04_transferencias.sql; si se reejecuta
-- sobre una base ya migrada, elimine manualmente los índices duplicados o
-- use `CREATE INDEX IF NOT EXISTS` disponible desde MySQL 8.0.29+.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- Índices compuestos adicionales para reportes
-- -----------------------------------------------------------------------------
ALTER TABLE movimiento_inventario
  ADD KEY idx_movimiento_producto_almacen (producto_id, almacen_id),
  ADD KEY idx_movimiento_fecha_tipo (fecha_movimiento, tipo_movimiento),
  ADD KEY idx_movimiento_usuario_fecha (usuario_id, fecha_movimiento);

ALTER TABLE transferencia
  ADD KEY idx_transferencia_origen_estado (almacen_origen_id, estado),
  ADD KEY idx_transferencia_destino_estado (almacen_destino_id, estado);

-- -----------------------------------------------------------------------------
-- v_inv_existencias — foto de existencias por producto/almacén
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_existencias AS
SELECT
  i.id                    AS existencia_id,
  i.dominio_id,
  p.id                    AS producto_id,
  p.codigo                AS producto_codigo,
  p.titulo                AS producto_titulo,
  p.isbn,
  a.id                    AS almacen_id,
  a.codigo                AS almacen_codigo,
  a.nombre                AS almacen_nombre,
  s.id                    AS sucursal_id,
  s.nombre                AS sucursal_nombre,
  i.stock,
  i.stock_minimo,
  i.estado_stock,
  i.version,
  i.bloqueado_por_conteo,
  i.conteo_bloqueante_id,
  p.costo,
  (i.stock * p.costo)     AS valor_existencia,
  i.updated_at
FROM inventario i
JOIN productos p ON p.id = i.producto_id
JOIN almacenes a ON a.id = i.almacen_id
LEFT JOIN sucursales s ON s.id = a.sucursal_id;

-- -----------------------------------------------------------------------------
-- v_inv_kardex — historial de movimientos por producto/almacén
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_kardex AS
SELECT
  m.id                    AS movimiento_id,
  m.dominio_id,
  m.producto_id,
  p.codigo                AS producto_codigo,
  p.titulo                AS producto_titulo,
  m.almacen_id,
  a.codigo                AS almacen_codigo,
  a.nombre                AS almacen_nombre,
  m.tipo_movimiento,
  m.sentido,
  m.cantidad,
  m.saldo_anterior,
  m.saldo_posterior,
  m.motivo_codigo,
  m.documento_tipo,
  m.documento_id,
  m.documento_linea_id,
  m.referencia,
  m.referencia_tipo,
  m.movimiento_compensa_id,
  m.idempotency_key,
  m.usuario_id,
  u.nombre                AS usuario_nombre,
  m.observaciones,
  m.fecha_movimiento
FROM movimiento_inventario m
JOIN productos p ON p.id = m.producto_id
JOIN almacenes a ON a.id = m.almacen_id
LEFT JOIN usuarios u ON u.id = m.usuario_id;

-- -----------------------------------------------------------------------------
-- v_inv_auditoria — bitácora de acciones sobre inventario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_auditoria AS
SELECT
  ai.id                   AS auditoria_id,
  ai.dominio_id,
  ai.tipo_accion,
  ai.resultado,
  ai.usuario_id,
  u.nombre                AS usuario_nombre,
  ai.movimiento_id,
  ai.documento_tipo,
  ai.documento_id,
  ai.producto_id,
  p.codigo                AS producto_codigo,
  ai.almacen_id,
  a.codigo                AS almacen_codigo,
  ai.valor_antes,
  ai.valor_despues,
  ai.detalle,
  ai.idempotency_key,
  ai.fecha
FROM auditoria_inventario ai
LEFT JOIN usuarios u ON u.id = ai.usuario_id
LEFT JOIN productos p ON p.id = ai.producto_id
LEFT JOIN almacenes a ON a.id = ai.almacen_id;

-- -----------------------------------------------------------------------------
-- v_inv_transferencias_activas — transferencias en curso (no recibidas/canceladas)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_transferencias_activas AS
SELECT
  t.id                    AS transferencia_id,
  t.dominio_id,
  t.codigo,
  t.estado,
  t.version,
  t.almacen_origen_id,
  ao.codigo                AS almacen_origen_codigo,
  ao.nombre                AS almacen_origen_nombre,
  t.almacen_destino_id,
  ad.codigo                AS almacen_destino_codigo,
  ad.nombre                AS almacen_destino_nombre,
  t.usuario_solicita_id,
  us.nombre                 AS solicitante_nombre,
  t.usuario_aprueba_id,
  t.fecha_solicitud,
  t.fecha_envio,
  t.fecha_recepcion,
  COUNT(dt.id)              AS total_lineas,
  SUM(dt.cantidad_solicitada) AS total_solicitado,
  SUM(dt.cantidad_despachada) AS total_despachado,
  SUM(dt.cantidad_recibida)   AS total_recibido
FROM transferencia t
JOIN almacenes ao ON ao.id = t.almacen_origen_id
JOIN almacenes ad ON ad.id = t.almacen_destino_id
LEFT JOIN usuarios us ON us.id = t.usuario_solicita_id
LEFT JOIN detalle_transferencia dt ON dt.transferencia_id = t.id
WHERE t.estado NOT IN ('recibida','cancelada')
GROUP BY t.id, ao.codigo, ao.nombre, ad.codigo, ad.nombre, us.nombre;

-- -----------------------------------------------------------------------------
-- v_inv_conteos_abiertos — sesiones de conteo físico en curso
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_conteos_abiertos AS
SELECT
  c.id                     AS conteo_id,
  c.dominio_id,
  c.codigo,
  c.estado,
  c.tipo_conteo,
  c.version,
  c.almacen_id,
  a.codigo                 AS almacen_codigo,
  a.nombre                 AS almacen_nombre,
  c.sucursal_id,
  c.responsable_id,
  r.nombre                 AS responsable_nombre,
  c.bloqueo_activo,
  COUNT(l.id)               AS total_lineas,
  SUM(l.estado_linea = 'pendiente')     AS lineas_pendientes,
  SUM(l.estado_linea = 'contada')       AS lineas_contadas,
  SUM(l.estado_linea = 'regularizada')  AS lineas_regularizadas,
  c.created_at
FROM conteo_fisico c
JOIN almacenes a ON a.id = c.almacen_id
LEFT JOIN usuarios r ON r.id = c.responsable_id
LEFT JOIN linea_conteo l ON l.conteo_id = c.id
WHERE c.estado NOT IN ('cerrado','cancelado')
GROUP BY c.id, a.codigo, a.nombre, r.nombre;

-- -----------------------------------------------------------------------------
-- v_inv_ajustes_pendientes — ajustes que aún requieren acción (workflow abierto)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_ajustes_pendientes AS
SELECT
  aj.id                    AS ajuste_id,
  aj.dominio_id,
  aj.codigo,
  aj.estado,
  aj.tipo_ajuste,
  aj.version,
  aj.almacen_id,
  a.codigo                 AS almacen_codigo,
  aj.solicitante_id,
  sol.nombre                AS solicitante_nombre,
  aj.aprobador_id,
  COUNT(d.id)                AS total_lineas,
  SUM(d.diferencia)          AS diferencia_total,
  aj.created_at
FROM ajuste aj
JOIN almacenes a ON a.id = aj.almacen_id
LEFT JOIN usuarios sol ON sol.id = aj.solicitante_id
LEFT JOIN ajuste_detalle d ON d.ajuste_id = aj.id
WHERE aj.estado IN ('borrador','solicitado','aprobado')
GROUP BY aj.id, a.codigo, sol.nombre;

-- -----------------------------------------------------------------------------
-- v_inv_descartes_pendientes — descartes que aún requieren acción
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_descartes_pendientes AS
SELECT
  de.id                     AS descarte_id,
  de.dominio_id,
  de.codigo,
  de.estado,
  de.version,
  de.almacen_id,
  a.codigo                  AS almacen_codigo,
  de.solicitante_id,
  sol.nombre                 AS solicitante_nombre,
  de.aprobador_id,
  COUNT(d.id)                 AS total_lineas,
  SUM(d.cantidad)              AS cantidad_total,
  SUM(d.cantidad * d.costo)    AS valor_total,
  de.created_at
FROM descarte de
JOIN almacenes a ON a.id = de.almacen_id
LEFT JOIN usuarios sol ON sol.id = de.solicitante_id
LEFT JOIN descarte_detalle d ON d.descarte_id = de.id
WHERE de.estado IN ('borrador','solicitado','aprobado')
GROUP BY de.id, a.codigo, sol.nombre;

-- -----------------------------------------------------------------------------
-- v_inv_dashboard_kpis — un solo renglón con indicadores clave del módulo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inv_dashboard_kpis AS
SELECT
  (SELECT COALESCE(SUM(i.stock * p.costo), 0)
     FROM inventario i JOIN productos p ON p.id = i.producto_id)   AS valor_total_inventario,
  (SELECT COUNT(*) FROM inventario WHERE estado_stock = 'bajo')     AS productos_stock_bajo,
  (SELECT COUNT(*) FROM inventario WHERE estado_stock = 'agotado')  AS productos_agotados,
  (SELECT COUNT(*) FROM transferencia WHERE estado NOT IN ('recibida','cancelada'))
                                                                     AS transferencias_activas,
  (SELECT COUNT(*) FROM conteo_fisico WHERE estado NOT IN ('cerrado','cancelado'))
                                                                     AS conteos_abiertos,
  (SELECT COUNT(*) FROM ajuste WHERE estado IN ('borrador','solicitado','aprobado'))
                                                                     AS ajustes_pendientes,
  (SELECT COUNT(*) FROM descarte WHERE estado IN ('borrador','solicitado','aprobado'))
                                                                     AS descartes_pendientes,
  (SELECT COUNT(*) FROM inventario WHERE bloqueado_por_conteo = 1)  AS existencias_bloqueadas;

-- -----------------------------------------------------------------------------
-- Alias de compatibilidad con nombres usados por documentación previa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inventario_existencias AS SELECT * FROM v_inv_existencias;
CREATE OR REPLACE VIEW v_kardex_documento        AS SELECT * FROM v_inv_kardex;
CREATE OR REPLACE VIEW v_auditoria_inventario     AS SELECT * FROM v_inv_auditoria;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '12_vistas_indices.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 12_vistas_indices.sql aplicado.' AS resultado;
