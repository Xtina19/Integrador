-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 03_numeracion_documentos.sql
-- Tabla: numeracion_documentos
-- Modelo: backend/models/compras/numeracionDocumentos.model.js
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS numeracion_documentos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_documento  ENUM('OC','REC','FP') NOT NULL,
  anio            SMALLINT UNSIGNED NOT NULL,
  ultimo_numero   INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_numeracion_tipo_anio (tipo_documento, anio),
  CONSTRAINT chk_numeracion_anio CHECK (anio >= 2000 AND anio <= 2100),
  CONSTRAINT chk_numeracion_ultimo CHECK (ultimo_numero >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '03_numeracion_documentos.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 03_numeracion_documentos.sql aplicado.' AS resultado;
