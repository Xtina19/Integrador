-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 01_cleanup_redundante.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Elimina las tablas transicionales/redundantes de los intentos previos del
-- módulo Inventario (18_modulos_extendidos.sql, 22_conteo_fisico_dominio.sql,
-- 23_descarte_dominio.sql, 24_descarte_documento.sql) para dar paso a las
-- versiones DEFINITIVAS creadas por 05_ajustes.sql, 06_conteos.sql y
-- 07_descartes.sql.
--
-- NO se eliminan (se ALTERan en su lugar, ver 03/04_*.sql):
--   productos, almacenes, inventario (stock), movimiento_inventario,
--   transferencia, detalle_transferencia, sucursales, usuarios.
--
-- Orden de borrado: hijos antes que padres. FOREIGN_KEY_CHECKS=0 como red de
-- seguridad adicional para instalaciones con FKs cruzadas inesperadas.
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Conteo físico — legado (18_modulos_extendidos.sql) y transicional DDD
-- (22_conteo_fisico_dominio.sql). Se recrean como definitivas en 06_conteos.sql.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS auditoria_conteo_fisico;
DROP TABLE IF EXISTS linea_conteo;
DROP TABLE IF EXISTS snapshot_conteo;
DROP TABLE IF EXISTS conteo_alcance_producto;
DROP TABLE IF EXISTS conteo_fisico_sesion;
DROP TABLE IF EXISTS detalle_conteo_fisico;
DROP TABLE IF EXISTS conteo_fisico;

-- -----------------------------------------------------------------------------
-- Descarte — transicional DDD (23_descarte_dominio.sql / 24_descarte_documento.sql)
-- y cualquier nombre legado previo (descarte_sesion). Se recrea como
-- definitiva en 07_descartes.sql. `descarte_aprobacion` se fusiona en la
-- cabecera (solicitante_id / aprobador_id) y no se recrea.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS descarte_aprobacion;
DROP TABLE IF EXISTS descarte_evidencia;
DROP TABLE IF EXISTS descarte_detalle;
DROP TABLE IF EXISTS descarte;
DROP TABLE IF EXISTS descarte_sesion;

-- -----------------------------------------------------------------------------
-- Ajustes — legado (05_inventario.sql). Se recrea como `ajuste` +
-- `ajuste_detalle` en 05_ajustes.sql.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS ajuste_inventario;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '01_cleanup_redundante.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 01_cleanup_redundante.sql aplicado.' AS resultado;
