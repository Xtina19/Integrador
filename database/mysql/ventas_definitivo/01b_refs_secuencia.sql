-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 01b_refs_secuencia.sql
-- Puente dominio_id ↔ ERP INT + secuencia de números de factura.
-- Permite sustituir el motor de BD sin acoplar IDs de dominio al INT físico.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS ventas_ref_catalogo (
  tipo         ENUM('sucursal','almacen','usuario','producto','cliente') NOT NULL,
  dominio_id   VARCHAR(64)  NOT NULL,
  erp_id       INT UNSIGNED NOT NULL,
  codigo_erp   VARCHAR(40)  NULL,
  notas        VARCHAR(200) NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tipo, dominio_id),
  KEY idx_ventas_ref_erp (tipo, erp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas_secuencia_factura (
  sucursal_dominio_id VARCHAR(64)  NOT NULL,
  ultimo_numero       INT UNSIGNED NOT NULL DEFAULT 1000,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (sucursal_dominio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '01b_refs_secuencia.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 01b_refs_secuencia.sql aplicado.' AS resultado;
