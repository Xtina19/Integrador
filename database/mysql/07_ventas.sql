-- =============================================================================
-- LibroSys — Ventas
-- Archivo: 07_ventas.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- venta
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venta (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  sucursal_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  cliente_nombre      VARCHAR(200) NULL,
  cliente_documento   VARCHAR(50)  NULL,
  fecha_venta         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  descuento           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('borrador','confirmada','anulada') NOT NULL DEFAULT 'confirmada',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_venta_codigo (codigo),
  KEY idx_venta_sucursal (sucursal_id),
  KEY idx_venta_fecha (fecha_venta),
  KEY idx_venta_estado (estado),
  CONSTRAINT fk_venta_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_venta_totales
    CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_venta
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_venta (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venta_id            INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  precio_unitario     DECIMAL(18,2) NOT NULL,
  descuento_linea     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  subtotal            DECIMAL(18,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_venta_producto (venta_id, producto_id),
  KEY idx_detalle_venta_producto (producto_id),
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (venta_id) REFERENCES venta (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_venta_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_venta_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_venta_precio
    CHECK (precio_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
