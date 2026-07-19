-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 04_pagos.sql
-- Tabla de pagos de la factura (nombre conceptual: "pagos").
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS pagos (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  venta_id              INT UNSIGNED NOT NULL,
  forma_pago            ENUM('efectivo','tarjeta','transferencia','nota_credito') NOT NULL,
  monto                 DECIMAL(18,2) NOT NULL,
  moneda_codigo         ENUM('DOP','USD','COP') NOT NULL DEFAULT 'DOP',
  nota_credito_id       VARCHAR(64)  NULL COMMENT 'dominio_id de la NC aplicada (solo forma_pago=nota_credito)',
  vuelto                DECIMAL(18,2) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pagos_dominio (dominio_id),
  KEY idx_pagos_venta (venta_id),
  KEY idx_pagos_forma (forma_pago),
  KEY idx_pagos_nc (nota_credito_id),
  CONSTRAINT fk_pagos_venta
    FOREIGN KEY (venta_id) REFERENCES ventas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pagos_monto
    CHECK (monto > 0),
  CONSTRAINT chk_pagos_vuelto
    CHECK (vuelto IS NULL OR vuelto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '04_pagos.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 04_pagos.sql aplicado.' AS resultado;
