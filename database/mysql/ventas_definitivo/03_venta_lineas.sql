-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 03_venta_lineas.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS venta_lineas (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  producto_dominio_id   VARCHAR(64)  NULL,
  descripcion_snapshot  VARCHAR(300) NOT NULL,
  cantidad              INT UNSIGNED NOT NULL,
  precio_unitario       DECIMAL(18,2) NOT NULL,
  descuento_tipo        ENUM('monto','porcentaje') NULL,
  descuento_valor       DECIMAL(18,4) NULL,
  importe_neto          DECIMAL(18,2) NOT NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_venta_lineas_dominio (dominio_id),
  KEY idx_venta_lineas_venta (venta_id),
  KEY idx_venta_lineas_producto (producto_id),
  CONSTRAINT fk_venta_lineas_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_lineas_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_venta_lineas_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_venta_lineas_montos
    CHECK (precio_unitario >= 0 AND importe_neto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '03_venta_lineas.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 03_venta_lineas.sql aplicado.' AS resultado;
