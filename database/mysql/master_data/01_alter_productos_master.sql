-- =============================================================================
-- LibroSys — MASTER DATA
-- Archivo: 01_alter_productos_master.sql
-- Extiende productos como catálogo único del ERP (sin romper FKs INT).
-- =============================================================================

USE librosys;

-- barcode / EAN
SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'codigo_barras'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN codigo_barras VARCHAR(64) NULL AFTER isbn'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND INDEX_NAME = 'uk_productos_codigo_barras'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD UNIQUE KEY uk_productos_codigo_barras (codigo_barras)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'subcategoria'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN subcategoria VARCHAR(80) NULL AFTER categoria_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'idioma'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN idioma VARCHAR(20) NULL DEFAULT ''es'' AFTER autor'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'pais_origen'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN pais_origen VARCHAR(100) NULL AFTER idioma'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'moneda_compra_id'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN moneda_compra_id INT UNSIGNED NULL AFTER editorial_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'costo_promedio'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN costo_promedio DECIMAL(18,4) NULL AFTER costo'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'peso_kg'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN peso_kg DECIMAL(10,3) NULL AFTER precio'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'dimensiones'
    ),
    'SELECT 1',
    'ALTER TABLE productos ADD COLUMN dimensiones VARCHAR(64) NULL AFTER peso_kg'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill costo_promedio desde costo
UPDATE productos SET costo_promedio = costo WHERE costo_promedio IS NULL;
UPDATE productos SET moneda_compra_id = 1 WHERE moneda_compra_id IS NULL;
UPDATE productos SET idioma = 'es' WHERE idioma IS NULL OR idioma = '';

-- FK moneda (si monedas existe y FK aún no)
SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'productos'
        AND CONSTRAINT_NAME = 'fk_productos_moneda_compra'
    )
    OR NOT EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'monedas'
    ),
    'SELECT 1',
    'ALTER TABLE productos
       ADD CONSTRAINT fk_productos_moneda_compra
       FOREIGN KEY (moneda_compra_id) REFERENCES monedas (id)
       ON UPDATE CASCADE ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Inventario base si no existe (stock por almacén)
CREATE TABLE IF NOT EXISTS inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  stock               INT NOT NULL DEFAULT 0,
  stock_minimo        INT UNSIGNED NOT NULL DEFAULT 10,
  ubicacion           VARCHAR(150) NULL,
  estado_stock        ENUM('normal','bajo','agotado') NOT NULL DEFAULT 'normal',
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventario_producto_almacen (producto_id, almacen_id),
  KEY idx_inventario_almacen (almacen_id),
  CONSTRAINT fk_md_inventario_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_md_inventario_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimiento_inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NULL,
  tipo_movimiento     ENUM('entrada','salida','ajuste','transferencia_entrada','transferencia_salida','venta','recepcion') NOT NULL,
  cantidad            INT NOT NULL,
  saldo_posterior     INT NOT NULL,
  referencia          VARCHAR(50)  NULL,
  referencia_tipo     VARCHAR(50)  NULL,
  observaciones       VARCHAR(255) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mov_inv_producto (producto_id),
  KEY idx_mov_inv_almacen (almacen_id),
  CONSTRAINT fk_md_mov_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_md_mov_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'MASTER-DATA :: 01_alter_productos_master.sql aplicado.' AS resultado;
