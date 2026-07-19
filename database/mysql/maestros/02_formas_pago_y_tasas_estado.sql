-- =============================================================================
-- Maestros — mejoras mínimas (sin recrear tablas existentes)
-- =============================================================================
USE librosys;

-- Formas de pago (catálogo; no existía como tabla maestra)
CREATE TABLE IF NOT EXISTS formas_pago (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)  NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_formas_pago_codigo (codigo),
  KEY idx_formas_pago_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO formas_pago (codigo, nombre, estado)
SELECT v.codigo, v.nombre, 'activa'
FROM (
  SELECT 'efectivo' AS codigo, 'Efectivo' AS nombre
  UNION ALL SELECT 'tarjeta', 'Tarjeta'
  UNION ALL SELECT 'transferencia', 'Transferencia'
  UNION ALL SELECT 'nota_credito', 'Nota de Crédito'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM formas_pago fp WHERE fp.codigo = v.codigo);

-- Tasas: columna estado para activar/desactivar (vigencia se mantiene)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasas_cambio' AND COLUMN_NAME = 'estado'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE tasas_cambio ADD COLUMN estado ENUM(''activa'',''inactiva'') NOT NULL DEFAULT ''activa'' AFTER vigente_hasta',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE tasas_cambio SET estado = 'activa' WHERE estado IS NULL OR estado = '';
