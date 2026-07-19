-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 08_historial_ventas.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS historial_ventas (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  tipo_evento           ENUM(
                          'emision','reimpresion','descuento','pago','cambio',
                          'devolucion','nota_credito','aplicacion_nc','anulacion'
                        ) NOT NULL,
  usuario_id            INT UNSIGNED NOT NULL,
  usuario_dominio_id    VARCHAR(64)  NOT NULL,
  fecha                 DATETIME     NOT NULL,
  resultado             ENUM('OK','RECHAZADO','ERROR') NOT NULL DEFAULT 'OK',
  detalle               VARCHAR(500) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_historial_ventas_dominio (dominio_id),
  KEY idx_historial_ventas_venta_fecha (venta_id, fecha),
  KEY idx_historial_ventas_tipo (tipo_evento),
  CONSTRAINT fk_historial_ventas_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_historial_ventas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '08_historial_ventas.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 08_historial_ventas.sql aplicado.' AS resultado;
