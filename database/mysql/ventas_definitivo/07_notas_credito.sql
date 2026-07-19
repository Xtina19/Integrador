-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 07_notas_credito.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS notas_credito (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  cliente_id            INT UNSIGNED NOT NULL,
  cliente_dominio_id    VARCHAR(64)  NOT NULL,
  fecha                 DATETIME     NOT NULL,
  usuario_id            INT UNSIGNED NOT NULL,
  usuario_dominio_id    VARCHAR(64)  NOT NULL,
  monto                 DECIMAL(18,2) NOT NULL,
  moneda_codigo         ENUM('DOP','USD','COP') NOT NULL DEFAULT 'DOP',
  motivo                VARCHAR(500) NOT NULL,
  estado                ENUM('emitida','parcialmente_aplicada','aplicada','anulada') NOT NULL DEFAULT 'emitida',
  monto_aplicado        DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_notas_credito_dominio (dominio_id),
  KEY idx_notas_credito_venta (venta_id),
  KEY idx_notas_credito_cliente (cliente_id),
  KEY idx_notas_credito_estado (estado),
  CONSTRAINT fk_notas_credito_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_notas_credito_cliente
    FOREIGN KEY (cliente_id) REFERENCES venta_clientes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_notas_credito_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_notas_credito_montos
    CHECK (monto > 0 AND monto_aplicado >= 0 AND monto_aplicado <= monto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nota_credito_aplicaciones (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nota_credito_id       INT UNSIGNED NOT NULL,
  venta_destino_id      INT UNSIGNED NOT NULL,
  venta_destino_dominio_id CHAR(36) NULL,
  monto_aplicado        DECIMAL(18,2) NOT NULL,
  fecha                 DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_nc_aplicaciones_nc (nota_credito_id),
  KEY idx_nc_aplicaciones_venta (venta_destino_id),
  CONSTRAINT fk_nc_aplicaciones_nc
    FOREIGN KEY (nota_credito_id) REFERENCES notas_credito (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_nc_aplicaciones_venta
    FOREIGN KEY (venta_destino_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_nc_aplicaciones_monto
    CHECK (monto_aplicado > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '07_notas_credito.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 07_notas_credito.sql aplicado.' AS resultado;
