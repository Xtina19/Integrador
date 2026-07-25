-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 08_Views.sql
-- Equivalente: inventario_definitivo/12_vistas_indices.sql (vistas)
-- =============================================================================

USE LibroSys;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- v_inv_existencias
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_existencias
AS
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
FROM dbo.inventario i
JOIN dbo.productos p ON p.id = i.producto_id
JOIN dbo.almacenes a ON a.id = i.almacen_id
LEFT JOIN dbo.sucursales s ON s.id = a.sucursal_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_kardex
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_kardex
AS
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
FROM dbo.movimiento_inventario m
JOIN dbo.productos p ON p.id = m.producto_id
JOIN dbo.almacenes a ON a.id = m.almacen_id
LEFT JOIN dbo.usuarios u ON u.id = m.usuario_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_auditoria
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_auditoria
AS
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
FROM dbo.auditoria_inventario ai
LEFT JOIN dbo.usuarios u ON u.id = ai.usuario_id
LEFT JOIN dbo.productos p ON p.id = ai.producto_id
LEFT JOIN dbo.almacenes a ON a.id = ai.almacen_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_transferencias_activas
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_transferencias_activas
AS
SELECT
  t.id                      AS transferencia_id,
  t.dominio_id,
  t.codigo,
  t.estado,
  t.version,
  t.almacen_origen_id,
  ao.codigo                 AS almacen_origen_codigo,
  ao.nombre                 AS almacen_origen_nombre,
  t.almacen_destino_id,
  ad.codigo                 AS almacen_destino_codigo,
  ad.nombre                 AS almacen_destino_nombre,
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
FROM dbo.transferencia t
JOIN dbo.almacenes ao ON ao.id = t.almacen_origen_id
JOIN dbo.almacenes ad ON ad.id = t.almacen_destino_id
LEFT JOIN dbo.usuarios us ON us.id = t.usuario_solicita_id
LEFT JOIN dbo.detalle_transferencia dt ON dt.transferencia_id = t.id
WHERE t.estado NOT IN (N'recibida', N'cancelada')
GROUP BY
  t.id, t.dominio_id, t.codigo, t.estado, t.version,
  t.almacen_origen_id, ao.codigo, ao.nombre,
  t.almacen_destino_id, ad.codigo, ad.nombre,
  t.usuario_solicita_id, us.nombre, t.usuario_aprueba_id,
  t.fecha_solicitud, t.fecha_envio, t.fecha_recepcion;
GO

-- -----------------------------------------------------------------------------
-- v_inv_conteos_abiertos
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_conteos_abiertos
AS
SELECT
  c.id                      AS conteo_id,
  c.dominio_id,
  c.codigo,
  c.estado,
  c.tipo_conteo,
  c.version,
  c.almacen_id,
  a.codigo                  AS almacen_codigo,
  a.nombre                  AS almacen_nombre,
  c.sucursal_id,
  c.responsable_id,
  r.nombre                  AS responsable_nombre,
  c.bloqueo_activo,
  COUNT(l.id)               AS total_lineas,
  SUM(CASE WHEN l.estado_linea = N'pendiente' THEN 1 ELSE 0 END)     AS lineas_pendientes,
  SUM(CASE WHEN l.estado_linea = N'contada' THEN 1 ELSE 0 END)       AS lineas_contadas,
  SUM(CASE WHEN l.estado_linea = N'regularizada' THEN 1 ELSE 0 END)  AS lineas_regularizadas,
  c.created_at
FROM dbo.conteo_fisico c
JOIN dbo.almacenes a ON a.id = c.almacen_id
LEFT JOIN dbo.usuarios r ON r.id = c.responsable_id
LEFT JOIN dbo.linea_conteo l ON l.conteo_id = c.id
WHERE c.estado NOT IN (N'cerrado', N'cancelado')
GROUP BY
  c.id, c.dominio_id, c.codigo, c.estado, c.tipo_conteo, c.version,
  c.almacen_id, a.codigo, a.nombre, c.sucursal_id, c.responsable_id,
  r.nombre, c.bloqueo_activo, c.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_ajustes_pendientes
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_ajustes_pendientes
AS
SELECT
  aj.id                     AS ajuste_id,
  aj.dominio_id,
  aj.codigo,
  aj.estado,
  aj.tipo_ajuste,
  aj.version,
  aj.almacen_id,
  a.codigo                  AS almacen_codigo,
  aj.solicitante_id,
  sol.nombre                AS solicitante_nombre,
  aj.aprobador_id,
  COUNT(d.id)               AS total_lineas,
  SUM(d.diferencia)         AS diferencia_total,
  aj.created_at
FROM dbo.ajuste aj
JOIN dbo.almacenes a ON a.id = aj.almacen_id
LEFT JOIN dbo.usuarios sol ON sol.id = aj.solicitante_id
LEFT JOIN dbo.ajuste_detalle d ON d.ajuste_id = aj.id
WHERE aj.estado IN (N'borrador', N'solicitado', N'aprobado')
GROUP BY
  aj.id, aj.dominio_id, aj.codigo, aj.estado, aj.tipo_ajuste, aj.version,
  aj.almacen_id, a.codigo, aj.solicitante_id, sol.nombre, aj.aprobador_id, aj.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_descartes_pendientes
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_descartes_pendientes
AS
SELECT
  de.id                     AS descarte_id,
  de.dominio_id,
  de.codigo,
  de.estado,
  de.version,
  de.almacen_id,
  a.codigo                  AS almacen_codigo,
  de.solicitante_id,
  sol.nombre                AS solicitante_nombre,
  de.aprobador_id,
  COUNT(d.id)               AS total_lineas,
  SUM(d.cantidad)           AS cantidad_total,
  SUM(d.cantidad * d.costo) AS valor_total,
  de.created_at
FROM dbo.descarte de
JOIN dbo.almacenes a ON a.id = de.almacen_id
LEFT JOIN dbo.usuarios sol ON sol.id = de.solicitante_id
LEFT JOIN dbo.descarte_detalle d ON d.descarte_id = de.id
WHERE de.estado IN (N'borrador', N'solicitado', N'aprobado')
GROUP BY
  de.id, de.dominio_id, de.codigo, de.estado, de.version,
  de.almacen_id, a.codigo, de.solicitante_id, sol.nombre, de.aprobador_id, de.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_dashboard_kpis
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_dashboard_kpis
AS
SELECT
  (SELECT COALESCE(SUM(i.stock * p.costo), 0)
     FROM dbo.inventario i JOIN dbo.productos p ON p.id = i.producto_id) AS valor_total_inventario,
  (SELECT COUNT(*) FROM dbo.inventario WHERE estado_stock = N'bajo')     AS productos_stock_bajo,
  (SELECT COUNT(*) FROM dbo.inventario WHERE estado_stock = N'agotado')  AS productos_agotados,
  (SELECT COUNT(*) FROM dbo.transferencia WHERE estado NOT IN (N'recibida', N'cancelada'))
                                                                         AS transferencias_activas,
  (SELECT COUNT(*) FROM dbo.conteo_fisico WHERE estado NOT IN (N'cerrado', N'cancelado'))
                                                                         AS conteos_abiertos,
  (SELECT COUNT(*) FROM dbo.ajuste WHERE estado IN (N'borrador', N'solicitado', N'aprobado'))
                                                                         AS ajustes_pendientes,
  (SELECT COUNT(*) FROM dbo.descarte WHERE estado IN (N'borrador', N'solicitado', N'aprobado'))
                                                                         AS descartes_pendientes,
  (SELECT COUNT(*) FROM dbo.inventario WHERE bloqueado_por_conteo = 1)  AS existencias_bloqueadas;
GO

-- Alias de compatibilidad
CREATE OR ALTER VIEW dbo.v_inventario_existencias AS SELECT * FROM dbo.v_inv_existencias;
GO
CREATE OR ALTER VIEW dbo.v_kardex_documento AS SELECT * FROM dbo.v_inv_kardex;
GO
CREATE OR ALTER VIEW dbo.v_auditoria_inventario AS SELECT * FROM dbo.v_inv_auditoria;
GO

PRINT N'08_Views.sql :: vistas de Inventario creadas.';
GO
