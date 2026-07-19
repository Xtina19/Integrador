-- =============================================================================
-- LibroSys — Importaciones
-- Archivo: 06_importaciones.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- factura_internacional
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factura_internacional (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  orden_compra_id     INT UNSIGNED NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  fecha_factura       DATE NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado_pago         ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  etapa_importacion   ENUM(
    'factura_internacional',
    'embarque_registrado',
    'consolidacion',
    'costos_flete',
    'costeo_libro',
    'recepcion',
    'completado'
  ) NOT NULL DEFAULT 'factura_internacional',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_internacional_codigo (codigo),
  UNIQUE KEY uk_factura_internacional_orden (orden_compra_id),
  KEY idx_factura_internacional_proveedor (proveedor_id),
  KEY idx_factura_internacional_etapa (etapa_importacion),
  CONSTRAINT fk_factura_int_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_int_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_int_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_factura_int_monto
    CHECK (monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- consolidacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consolidacion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  nombre              VARCHAR(200) NOT NULL,
  estado              ENUM('activa','cerrada','anulada') NOT NULL DEFAULT 'activa',
  total_cajas         INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones       TEXT NULL,
  fecha_creacion      DATE NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_consolidacion_codigo (codigo),
  KEY idx_consolidacion_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- embarque
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS embarque (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  factura_internacional_id INT UNSIGNED NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  proveedor_id            INT UNSIGNED NOT NULL,
  consolidacion_id        INT UNSIGNED NULL,
  tipo_transporte         ENUM('maritimo','aereo','courier') NOT NULL,
  origen                  VARCHAR(150) NOT NULL,
  destino                 VARCHAR(150) NOT NULL,
  fecha_salida            DATE NOT NULL,
  fecha_llegada_estimada  DATE NOT NULL,
  cantidad_cajas          INT UNSIGNED NOT NULL,
  estado                  ENUM('registrado','en_transito','en_aduana','recibido','costeado','finalizado') NOT NULL DEFAULT 'registrado',
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_embarque_codigo (codigo),
  UNIQUE KEY uk_embarque_factura (factura_internacional_id),
  KEY idx_embarque_orden (orden_compra_id),
  KEY idx_embarque_estado (estado),
  KEY idx_embarque_consolidacion (consolidacion_id),
  CONSTRAINT fk_embarque_factura
    FOREIGN KEY (factura_internacional_id) REFERENCES factura_internacional (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_consolidacion
    FOREIGN KEY (consolidacion_id) REFERENCES consolidacion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_embarque_cajas
    CHECK (cantidad_cajas > 0),
  CONSTRAINT chk_embarque_fechas
    CHECK (fecha_llegada_estimada >= fecha_salida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- consolidacion_embarque (relación N:M)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consolidacion_embarque (
  consolidacion_id    INT UNSIGNED NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (consolidacion_id, embarque_id),
  KEY idx_consolidacion_embarque_embarque (embarque_id),
  CONSTRAINT fk_consolidacion_embarque_consolidacion
    FOREIGN KEY (consolidacion_id) REFERENCES consolidacion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_consolidacion_embarque_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- costos_embarque
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS costos_embarque (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  embarque_id             INT UNSIGNED NOT NULL,
  moneda_id               INT UNSIGNED NOT NULL,
  flete_internacional     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  seguro                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  aduana                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  transporte_local        DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  gastos_portuarios       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  manipulacion            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  otros                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_costos            DECIMAL(18,2) GENERATED ALWAYS AS (
    flete_internacional + seguro + aduana + transporte_local +
    gastos_portuarios + manipulacion + otros
  ) STORED,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_costos_embarque (embarque_id),
  CONSTRAINT fk_costos_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costos_embarque_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- costeo_libro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS costeo_libro (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  embarque_id             INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  detalle_orden_id        INT UNSIGNED NULL,
  costo_producto          DECIMAL(18,4) NOT NULL,
  flete_asignado          DECIMAL(18,4) NOT NULL,
  costo_final             DECIMAL(18,4) GENERATED ALWAYS AS (costo_producto + flete_asignado) STORED,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_costeo_embarque_producto (embarque_id, producto_id),
  KEY idx_costeo_orden (orden_compra_id),
  CONSTRAINT fk_costeo_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_detalle_orden
    FOREIGN KEY (detalle_orden_id) REFERENCES detalle_orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_costeo_valores
    CHECK (costo_producto >= 0 AND flete_asignado >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- pallet
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pallet (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  cantidad_cajas      INT UNSIGNED NOT NULL DEFAULT 0,
  peso_kg             DECIMAL(10,2) NULL,
  ubicacion           VARCHAR(200) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pallet_codigo (codigo),
  KEY idx_pallet_embarque (embarque_id),
  CONSTRAINT fk_pallet_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pallet_cajas
    CHECK (cantidad_cajas >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- caja
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caja (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  pallet_id           INT UNSIGNED NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  peso_kg             DECIMAL(10,2) NULL,
  ubicacion           VARCHAR(200) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_caja_codigo (codigo),
  KEY idx_caja_pallet (pallet_id),
  KEY idx_caja_embarque (embarque_id),
  CONSTRAINT fk_caja_pallet
    FOREIGN KEY (pallet_id) REFERENCES pallet (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_caja_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- FK recepción internacional → embarque / factura (opcional, diferida)
-- Las columnas factura_internacional_id / embarque_id ya existen en
-- compras_definitivo/06_recepcion.sql (COM-DB-1.0.0). Solo se añaden FKs.
-- -----------------------------------------------------------------------------
SET @fk_rec_fi := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'recepcion'
    AND CONSTRAINT_NAME = 'fk_recepcion_factura_int'
);
SET @sql_rec_fi := IF(
  @fk_rec_fi = 0,
  'ALTER TABLE recepcion ADD CONSTRAINT fk_recepcion_factura_int FOREIGN KEY (factura_internacional_id) REFERENCES factura_internacional (id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_rec_fi FROM @sql_rec_fi;
EXECUTE stmt_rec_fi;
DEALLOCATE PREPARE stmt_rec_fi;

SET @fk_rec_emb := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'recepcion'
    AND CONSTRAINT_NAME = 'fk_recepcion_embarque'
);
SET @sql_rec_emb := IF(
  @fk_rec_emb = 0,
  'ALTER TABLE recepcion ADD CONSTRAINT fk_recepcion_embarque FOREIGN KEY (embarque_id) REFERENCES embarque (id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_rec_emb FROM @sql_rec_emb;
EXECUTE stmt_rec_emb;
DEALLOCATE PREPARE stmt_rec_emb;
