-- =============================================================================
-- LibroSys — Inventario
-- Archivo: 05_inventario.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- productos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)  NOT NULL,
  isbn                VARCHAR(20)  NOT NULL,
  titulo              VARCHAR(255) NOT NULL,
  autor               VARCHAR(255) NULL,
  categoria_id        INT UNSIGNED NOT NULL,
  editorial_id        INT UNSIGNED NOT NULL,
  costo               DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  precio              DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('activo','inactivo','descontinuado') NOT NULL DEFAULT 'activo',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_productos_codigo (codigo),
  UNIQUE KEY uk_productos_isbn (isbn),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_editorial (editorial_id),
  KEY idx_productos_titulo (titulo),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_editorial
    FOREIGN KEY (editorial_id) REFERENCES editoriales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_productos_precios
    CHECK (costo >= 0 AND precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- inventario (stock por almacén)
-- -----------------------------------------------------------------------------
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
  KEY idx_inventario_estado (estado_stock),
  CONSTRAINT fk_inventario_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventario_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventario_stock
    CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- movimiento_inventario (kardex)
-- -----------------------------------------------------------------------------
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
  fecha_movimiento    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimiento_producto (producto_id),
  KEY idx_movimiento_almacen (almacen_id),
  KEY idx_movimiento_fecha (fecha_movimiento),
  KEY idx_movimiento_referencia (referencia_tipo, referencia),
  CONSTRAINT fk_movimiento_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_movimiento_cantidad
    CHECK (cantidad <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ajuste_inventario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ajuste_inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo                ENUM('incremento','decremento','correccion') NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  motivo              VARCHAR(255) NOT NULL,
  estado              ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  observaciones       TEXT NULL,
  fecha_ajuste        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ajuste_codigo (codigo),
  KEY idx_ajuste_producto (producto_id),
  KEY idx_ajuste_estado (estado),
  CONSTRAINT fk_ajuste_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ajuste_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- FKs diferidas desde Compras → Productos
-- -----------------------------------------------------------------------------
ALTER TABLE detalle_orden_compra
  ADD CONSTRAINT fk_detalle_orden_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE detalle_recepcion
  ADD CONSTRAINT fk_detalle_recepcion_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
