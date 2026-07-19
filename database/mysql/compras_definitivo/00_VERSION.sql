-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 00_VERSION.sql
-- Versión: COM-DB-1.0.0  |  Fecha: 2026-07-19
--
-- Paquete MySQL 8 definitivo del módulo Compras (BC LibroSys.Compras).
-- Alineado 1:1 a backend/models/compras (toInsert / fromRow).
-- Sustituye el esquema legado de 04_compras.sql.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS compras_schema_version (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  version       VARCHAR(20)  NOT NULL,
  script_name   VARCHAR(100) NOT NULL,
  checksum      VARCHAR(64)  NULL,
  applied_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_com_schema_version_script (script_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '00_VERSION.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 00_VERSION.sql aplicado.' AS resultado;
