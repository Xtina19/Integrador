-- =============================================================================
-- LibroSys — Estándar monetario global (FASE GLOBAL)
-- Archivo: 01_migrate_money_types.sql
-- Fecha: 2026-07-19
--
-- Estándar único del ERP:
--   Importes / totales / precios de venta  → DECIMAL(18,2)
--   Costos unitarios / costeo             → DECIMAL(18,4)
--   Tasas de cambio                       → DECIMAL(18,6)
--
-- Prohibido para dinero: INT, FLOAT, DOUBLE, DECIMAL(...,0), DECIMAL(12,2).
-- Las conversiones de moneda se resuelven desde tasas_cambio (no hardcode).
-- =============================================================================

USE librosys;

-- ---------------------------------------------------------------------------
-- Catálogo productos (base compartida)
-- ---------------------------------------------------------------------------
ALTER TABLE productos
  MODIFY COLUMN costo  DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  MODIFY COLUMN precio DECIMAL(18,2) NOT NULL DEFAULT 0.00;

-- ---------------------------------------------------------------------------
-- Ventas definitivo (si existen) — de DECIMAL(18,0) → DECIMAL(18,2)
-- ---------------------------------------------------------------------------
SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'ventas'),
    'ALTER TABLE ventas
       MODIFY COLUMN subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN total_descuentos DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN total DECIMAL(18,2) NOT NULL DEFAULT 0.00',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'venta_lineas'),
    'ALTER TABLE venta_lineas
       MODIFY COLUMN precio_unitario DECIMAL(18,2) NOT NULL,
       MODIFY COLUMN importe_neto DECIMAL(18,2) NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'pagos'),
    'ALTER TABLE pagos
       MODIFY COLUMN monto DECIMAL(18,2) NOT NULL,
       MODIFY COLUMN vuelto DECIMAL(18,2) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'cambios'),
    'ALTER TABLE cambios MODIFY COLUMN diferencia_monto DECIMAL(18,2) NOT NULL DEFAULT 0.00',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'cambio_lineas'),
    'ALTER TABLE cambio_lineas MODIFY COLUMN precio_unitario DECIMAL(18,2) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'devoluciones'),
    'ALTER TABLE devoluciones MODIFY COLUMN monto_compensacion DECIMAL(18,2) NOT NULL DEFAULT 0.00',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'notas_credito'),
    'ALTER TABLE notas_credito
       MODIFY COLUMN monto DECIMAL(18,2) NOT NULL,
       MODIFY COLUMN monto_aplicado DECIMAL(18,2) NOT NULL DEFAULT 0.00',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'nota_credito_aplicaciones'
    ),
    'ALTER TABLE nota_credito_aplicaciones MODIFY COLUMN monto_aplicado DECIMAL(18,2) NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Inventario definitivo (si existen)
-- ---------------------------------------------------------------------------
SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'snapshot_conteo'),
    'ALTER TABLE snapshot_conteo MODIFY COLUMN costo_referencia DECIMAL(18,4) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'descarte_detalle'),
    'ALTER TABLE descarte_detalle MODIFY COLUMN costo DECIMAL(18,4) NOT NULL DEFAULT 0.0000',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Legacy venta (si existe)
-- ---------------------------------------------------------------------------
SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'venta'),
    'ALTER TABLE venta
       MODIFY COLUMN subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN descuento DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN impuestos DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN total DECIMAL(18,2) NOT NULL DEFAULT 0.00',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'librosys' AND TABLE_NAME = 'detalle_venta'),
    'ALTER TABLE detalle_venta
       MODIFY COLUMN precio_unitario DECIMAL(18,2) NOT NULL,
       MODIFY COLUMN descuento_linea DECIMAL(18,2) NOT NULL DEFAULT 0.00,
       MODIFY COLUMN subtotal DECIMAL(18,2) NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Tasas EUR→DOP y COP→DOP si faltan (catálogo de monedas del ERP)
-- ---------------------------------------------------------------------------
INSERT INTO tasas_cambio (moneda_origen_id, moneda_destino_id, tasa, vigente_desde, estado)
SELECT o.id, d.id, 63.200000, '2026-01-01 00:00:00', 'activa'
FROM monedas o
CROSS JOIN monedas d
WHERE o.codigo = 'EUR' AND d.codigo = 'DOP'
  AND NOT EXISTS (
    SELECT 1 FROM tasas_cambio t
    WHERE t.moneda_origen_id = o.id AND t.moneda_destino_id = d.id AND t.estado = 'activa'
  );

INSERT INTO tasas_cambio (moneda_origen_id, moneda_destino_id, tasa, vigente_desde, estado)
SELECT o.id, d.id, 0.014500, '2026-01-01 00:00:00', 'activa'
FROM monedas o
CROSS JOIN monedas d
WHERE o.codigo = 'COP' AND d.codigo = 'DOP'
  AND NOT EXISTS (
    SELECT 1 FROM tasas_cambio t
    WHERE t.moneda_origen_id = o.id AND t.moneda_destino_id = d.id AND t.estado = 'activa'
  );

SELECT 'Estándar monetario aplicado: importes DECIMAL(18,2), costos DECIMAL(18,4), tasas DECIMAL(18,6).' AS resultado;
