-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 01_clientes.sql
-- Catálogo de clientes registrados (soporte Cliente Registrado / postventa).
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS venta_clientes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id      VARCHAR(64)  NOT NULL,
  codigo          VARCHAR(30)  NULL,
  nombre          VARCHAR(200) NOT NULL,
  documento       VARCHAR(50)  NULL,
  email           VARCHAR(150) NULL,
  telefono        VARCHAR(30)  NULL,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_venta_clientes_dominio (dominio_id),
  UNIQUE KEY uk_venta_clientes_codigo (codigo),
  KEY idx_venta_clientes_nombre (nombre),
  KEY idx_venta_clientes_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '01_clientes.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 01_clientes.sql aplicado.' AS resultado;
