-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 01_cleanup.sql
-- Versión: COM-DB-1.0.0  |  Fecha: 2026-07-19
--
-- Elimina tablas del módulo Compras (esquema legado o reinstalación).
-- NO elimina tablas de Importaciones (factura_internacional, embarque, etc.).
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS detalle_factura_proveedor;
DROP TABLE IF EXISTS detalle_recepcion;
DROP TABLE IF EXISTS detalle_orden_compra;
DROP TABLE IF EXISTS factura_proveedor;
DROP TABLE IF EXISTS recepcion;
DROP TABLE IF EXISTS orden_compra;
DROP TABLE IF EXISTS numeracion_documentos;
DROP TABLE IF EXISTS condiciones_pago;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '01_cleanup.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 01_cleanup.sql aplicado.' AS resultado;
