-- =============================================================================
-- LibroSys — Compras
-- Archivo: 04_compras.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- orden_compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_compra (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo_compra         ENUM('nacional','internacional') NOT NULL DEFAULT 'nacional',
  fecha_orden         DATE NOT NULL,
  fecha_entrega_est   DATE NULL,
  subtotal            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  cantidad_items      INT UNSIGNED NOT NULL DEFAULT 0,
  estado              ENUM('borrador','pendiente','aprobada','recibida','finalizada','cancelada') NOT NULL DEFAULT 'borrador',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orden_compra_codigo (codigo),
  KEY idx_orden_compra_proveedor (proveedor_id),
  KEY idx_orden_compra_estado (estado),
  KEY idx_orden_compra_fecha (fecha_orden),
  KEY idx_orden_compra_tipo (tipo_compra),
  CONSTRAINT fk_orden_compra_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_orden_compra_totales
    CHECK (subtotal >= 0 AND impuestos >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_orden_compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_orden_compra (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  orden_compra_id     INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  costo_unitario      DECIMAL(18,4) NOT NULL,
  subtotal            DECIMAL(18,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_orden_producto (orden_compra_id, producto_id),
  KEY idx_detalle_orden_producto (producto_id),
  CONSTRAINT fk_detalle_orden_compra
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_orden_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_orden_costo
    CHECK (costo_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- factura_proveedor (compras nacionales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factura_proveedor (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  orden_compra_id     INT UNSIGNED NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  numero_factura      VARCHAR(50)  NOT NULL,
  fecha_factura       DATE NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado_pago         ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_proveedor_codigo (codigo),
  UNIQUE KEY uk_factura_proveedor_numero (proveedor_id, numero_factura),
  KEY idx_factura_proveedor_orden (orden_compra_id),
  CONSTRAINT fk_factura_proveedor_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_factura_proveedor_monto
    CHECK (monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- recepcion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recepcion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  proveedor_id            INT UNSIGNED NOT NULL,
  usuario_id              INT UNSIGNED NOT NULL,
  tipo_compra             ENUM('nacional','internacional') NOT NULL DEFAULT 'nacional',
  fecha_recepcion         DATE NOT NULL,
  estado                  ENUM('pendiente','parcial','completa','anulada') NOT NULL DEFAULT 'pendiente',
  total_items_esperados   INT UNSIGNED NOT NULL DEFAULT 0,
  total_items_recibidos   INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recepcion_codigo (codigo),
  KEY idx_recepcion_orden (orden_compra_id),
  KEY idx_recepcion_estado (estado),
  CONSTRAINT fk_recepcion_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_recepcion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_recepcion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recepcion_id            INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  cantidad_esperada       INT UNSIGNED NOT NULL,
  cantidad_recibida       INT UNSIGNED NOT NULL DEFAULT 0,
  costo_unitario          DECIMAL(18,4) NOT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_recepcion_producto (recepcion_id, producto_id),
  KEY idx_detalle_recepcion_producto (producto_id),
  CONSTRAINT fk_detalle_recepcion
    FOREIGN KEY (recepcion_id) REFERENCES recepcion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_recepcion_cantidades
    CHECK (cantidad_esperada > 0 AND cantidad_recibida <= cantidad_esperada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK de detalle_orden_compra → productos (tabla creada en 05_inventario.sql)
-- Se añade al final de 05_inventario.sql para respetar orden de dependencias.
