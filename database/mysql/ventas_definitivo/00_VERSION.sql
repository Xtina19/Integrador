-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 00_VERSION.sql
-- Versión: VEN-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Paquete MySQL 8 definitivo del módulo Ventas (BC LibroSys.Ventas).
-- Alineado a VEN-DOM-2.0.0 / VEN-RULES-2.0.0 / VEN-DATA.
-- NO modifica el dominio TypeScript ni mueve invariantes a la BD.
--
-- Convención: PK INT + dominio_id CHAR(36) UNIQUE (UUID del Aggregate).
-- Dinero operativo DOP: DECIMAL(18,0) sin centavos.
-- Las tablas legado `venta` / `detalle_venta` (07_ventas.sql) NO se usan
-- por este paquete; quedan para compatibilidad histórica del ERP.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS ventas_schema_version (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  version       VARCHAR(20)  NOT NULL,
  script_name   VARCHAR(100) NOT NULL,
  checksum      VARCHAR(64)  NULL,
  applied_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ven_schema_version_script (script_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '00_VERSION.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 00_VERSION.sql aplicado.' AS resultado;
