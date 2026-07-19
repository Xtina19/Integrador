-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 05_cambios.sql
-- Cambios + líneas (devueltas / nuevas) — siempre hijos de ventas.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS cambios (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  fecha                 DATETIME     NOT NULL,
  usuario_id            INT UNSIGNED NOT NULL,
  usuario_dominio_id    VARCHAR(64)  NOT NULL,
  diferencia_monto      DECIMAL(18,2) NOT NULL DEFAULT 0,
  moneda_codigo         ENUM('DOP','USD','COP') NOT NULL DEFAULT 'DOP',
  resolucion            ENUM('cobro','devolucion_dinero','nota_credito','mixto','sin_diferencia') NOT NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cambios_dominio (dominio_id),
  KEY idx_cambios_venta (venta_id),
  KEY idx_cambios_fecha (fecha),
  CONSTRAINT fk_cambios_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambios_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_cambios_diferencia
    CHECK (diferencia_monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cambio_lineas (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cambio_id             INT UNSIGNED NOT NULL,
  tipo                  ENUM('devuelta','nueva') NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  producto_dominio_id   VARCHAR(64)  NULL,
  cantidad              INT UNSIGNED NOT NULL,
  precio_unitario       DECIMAL(18,2) NULL,
  descripcion_snapshot  VARCHAR(300) NULL,
  PRIMARY KEY (id),
  KEY idx_cambio_lineas_cambio (cambio_id),
  KEY idx_cambio_lineas_producto (producto_id),
  CONSTRAINT fk_cambio_lineas_cambio
    FOREIGN KEY (cambio_id) REFERENCES cambios (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cambio_lineas_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_cambio_lineas_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '05_cambios.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 05_cambios.sql aplicado.' AS resultado;
