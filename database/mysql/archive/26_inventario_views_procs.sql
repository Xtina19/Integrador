-- =============================================================================
-- LibroSys — Vistas e índices de cierre para Inventario (dominio DDD)
-- Archivo: 26_inventario_views_procs.sql
-- Ejecutar DESPUÉS de 22_conteo_fisico_dominio.sql, 24_descarte_documento.sql
-- y 25_inventario_seed_joselito.sql.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- v_inventario_existencias
-- Existencias por producto/almacén con catálogo resuelto (categoría, editorial)
-- y estado de reposición. Equivalente relacional de
-- InventoryQueryService.listProductosVista() del backend in-memory.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_inventario_existencias AS
SELECT
  p.id                AS producto_id,
  p.codigo            AS producto_codigo,
  p.isbn,
  p.titulo,
  p.autor,
  cat.nombre          AS categoria,
  ed.nombre           AS editorial,
  p.costo,
  p.precio,
  i.almacen_id,
  a.nombre            AS almacen_nombre,
  a.tipo              AS almacen_tipo,
  i.stock,
  i.stock_minimo,
  i.estado_stock,
  (i.stock * p.costo) AS valor_existencia,
  i.ubicacion,
  i.updated_at        AS actualizado_en
FROM productos p
JOIN inventario i  ON i.producto_id = p.id
JOIN almacenes  a  ON a.id = i.almacen_id
JOIN categorias cat ON cat.id = p.categoria_id
JOIN editoriales ed ON ed.id = p.editorial_id
WHERE p.estado = 'activo';

-- -----------------------------------------------------------------------------
-- v_kardex_documento
-- Ledger de movimientos con saldo anterior/posterior y referencia al
-- documento de origen (compra, venta, ajuste, transferencia, descarte, …).
-- Equivalente relacional de InventoryQueryService.listKardex().
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_kardex_documento AS
SELECT
  mi.id                          AS movimiento_id,
  mi.producto_id,
  p.titulo                       AS producto_titulo,
  mi.almacen_id,
  a.nombre                       AS almacen_nombre,
  mi.tipo_movimiento,
  mi.cantidad,
  (mi.saldo_posterior - mi.cantidad) AS saldo_anterior,
  mi.saldo_posterior,
  mi.referencia_tipo             AS documento_tipo,
  mi.referencia                  AS documento_id,
  mi.usuario_id,
  u.nombre                       AS usuario_nombre,
  mi.observaciones,
  mi.fecha_movimiento
FROM movimiento_inventario mi
JOIN productos p  ON p.id = mi.producto_id
JOIN almacenes a  ON a.id = mi.almacen_id
LEFT JOIN usuarios u ON u.id = mi.usuario_id;

-- -----------------------------------------------------------------------------
-- v_auditoria_inventario
-- Unifica la auditoría genérica del módulo Inventario (tabla `auditoria`,
-- modulo='inventario') con la auditoría específica de conteo físico
-- (`auditoria_conteo_fisico`) en una sola línea de tiempo consultable.
-- Equivalente relacional de InventoryQueryService.listAuditorias().
--
-- NOTA: `auditoria_conteo_fisico.usuario_id` es VARCHAR (ids de dominio DDD,
-- p. ej. "joselito", "supervisor-jsl") y no corresponde al `usuarios.id`
-- INT de este esquema legado; el LEFT JOIN a `usuarios` en ese bloque solo
-- resuelve nombre cuando ambos sistemas comparten el mismo identificador
-- (p. ej. flujos operados desde la UI legada). `usuario_nombre` puede venir
-- NULL para usuarios sembrados únicamente en el seeder runtime.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_auditoria_inventario AS
SELECT
  CONCAT('aud-', au.id)  AS auditoria_id,
  'auditoria'            AS origen,
  au.entidad             AS documento_tipo,
  au.entidad_id          AS documento_id,
  au.accion              AS accion,
  au.usuario_id,
  u1.nombre              AS usuario_nombre,
  'OK'                   AS resultado,
  au.descripcion         AS detalle,
  au.ip_address,
  au.fecha_evento        AS fecha
FROM auditoria au
LEFT JOIN usuarios u1 ON u1.id = au.usuario_id
WHERE au.modulo = 'inventario'

UNION ALL

SELECT
  CONCAT('aud-cf-', acf.id) AS auditoria_id,
  'conteo_fisico'           AS origen,
  'conteo'                  AS documento_tipo,
  cfs.codigo                AS documento_id,
  acf.accion                AS accion,
  acf.usuario_id,
  u2.nombre                 AS usuario_nombre,
  acf.resultado             AS resultado,
  acf.detalle               AS detalle,
  acf.ip_address,
  acf.created_at            AS fecha
FROM auditoria_conteo_fisico acf
JOIN conteo_fisico_sesion cfs ON cfs.id = acf.conteo_id
LEFT JOIN usuarios u2 ON u2.id = acf.usuario_id;

-- -----------------------------------------------------------------------------
-- Índices de soporte para las vistas y para los filtros más usados por la
-- API (dashboard, auditoría por almacén/producto, kardex por producto).
-- -----------------------------------------------------------------------------
CREATE INDEX idx_movimiento_producto_almacen_fecha
  ON movimiento_inventario (producto_id, almacen_id, fecha_movimiento);

CREATE INDEX idx_descarte_estado_almacen
  ON descarte (estado, almacen_id);

CREATE INDEX idx_conteo_sesion_estado_fase
  ON conteo_fisico_sesion (estado, fase);
