-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 02_condiciones_pago.sql
-- Tabla: condiciones_pago
-- Modelo: backend/models/compras/condicionPago.model.js
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS condiciones_pago (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(20)  NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  dias_credito  INT UNSIGNED NOT NULL DEFAULT 0,
  estado        ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by    INT UNSIGNED NULL,
  updated_by    INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_condiciones_pago_codigo (codigo),
  KEY idx_condiciones_pago_estado (estado),
  KEY idx_condiciones_pago_activo (activo),
  CONSTRAINT fk_condiciones_pago_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_condiciones_pago_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_condiciones_dias CHECK (dias_credito >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '02_condiciones_pago.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 02_condiciones_pago.sql aplicado.' AS resultado;
