-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 11_pagos_nota_credito_id.sql
-- Migración: forma_pago admite nota_credito + columna nota_credito_id.
-- Idempotente para instalaciones ya existentes.
-- =============================================================================

USE librosys;

ALTER TABLE pagos
  MODIFY COLUMN forma_pago
    ENUM('efectivo','tarjeta','transferencia','nota_credito') NOT NULL;

SET @col_exists := (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'pagos'
    AND column_name = 'nota_credito_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE pagos ADD COLUMN nota_credito_id VARCHAR(64) NULL COMMENT ''dominio_id de la NC aplicada (solo forma_pago=nota_credito)'' AFTER referencia',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'pagos'
    AND index_name = 'idx_pagos_nc'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE pagos ADD KEY idx_pagos_nc (nota_credito_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.1.0', '11_pagos_nota_credito_id.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.1.0 :: 11_pagos_nota_credito_id.sql aplicado.' AS resultado;
