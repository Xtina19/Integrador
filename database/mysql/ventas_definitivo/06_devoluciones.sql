-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 06_devoluciones.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS devoluciones (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  fecha                 DATETIME     NOT NULL,
  usuario_id            INT UNSIGNED NOT NULL,
  usuario_dominio_id    VARCHAR(64)  NOT NULL,
  aptitud_reingreso     ENUM('vendible','no_apto','no_aplica') NOT NULL,
  compensacion          ENUM('dinero','nota_credito','mixto') NOT NULL,
  monto_compensacion    DECIMAL(18,2) NOT NULL DEFAULT 0,
  moneda_codigo         ENUM('DOP','USD','COP') NOT NULL DEFAULT 'DOP',
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_devoluciones_dominio (dominio_id),
  KEY idx_devoluciones_venta (venta_id),
  KEY idx_devoluciones_fecha (fecha),
  CONSTRAINT fk_devoluciones_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_devoluciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_devoluciones_monto
    CHECK (monto_compensacion >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devolucion_lineas (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  devolucion_id         INT UNSIGNED NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  producto_dominio_id   VARCHAR(64)  NULL,
  cantidad              INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_devolucion_lineas_dev (devolucion_id),
  KEY idx_devolucion_lineas_producto (producto_id),
  CONSTRAINT fk_devolucion_lineas_dev
    FOREIGN KEY (devolucion_id) REFERENCES devoluciones (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_devolucion_lineas_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_devolucion_lineas_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '06_devoluciones.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 06_devoluciones.sql aplicado.' AS resultado;
