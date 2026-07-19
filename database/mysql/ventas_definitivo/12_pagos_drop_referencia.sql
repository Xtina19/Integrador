-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 12_pagos_drop_referencia.sql
-- Elimina columna referencia del módulo de pagos (ya no se usa).
-- =============================================================================

USE librosys;

SET @col_exists := (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'pagos'
    AND column_name = 'referencia'
);
SET @sql := IF(
  @col_exists > 0,
  'ALTER TABLE pagos DROP COLUMN referencia',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.2.0', '12_pagos_drop_referencia.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.2.0 :: 12_pagos_drop_referencia.sql aplicado.' AS resultado;
