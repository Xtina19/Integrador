-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 05_detalle_orden_compra.sql
-- Tabla: detalle_orden_compra
-- Modelo: backend/models/compras/detalleOrdenCompra.model.js
--
-- Prerrequisito: productos (05_inventario.sql) debe existir para la FK.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS detalle_orden_compra (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  orden_compra_id       INT UNSIGNED NOT NULL,
  linea                 INT UNSIGNED NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  cantidad_solicitada   INT UNSIGNED NOT NULL,
  costo_unitario        DECIMAL(18,4) NOT NULL,
  descuento             DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuesto              DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  subtotal              DECIMAL(18,2) NOT NULL,
  activo                TINYINT(1) NOT NULL DEFAULT 1,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by            INT UNSIGNED NULL,
  updated_by            INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_orden_producto (orden_compra_id, producto_id),
  UNIQUE KEY uk_detalle_orden_linea (orden_compra_id, linea),
  KEY idx_detalle_orden_producto (producto_id),
  KEY idx_detalle_orden_activo (activo),
  CONSTRAINT fk_detalle_orden_compra
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_orden_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_orden_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_detalle_orden_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_detalle_orden_cantidad
    CHECK (cantidad_solicitada > 0),
  CONSTRAINT chk_detalle_orden_montos
    CHECK (costo_unitario >= 0 AND descuento >= 0 AND impuesto >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '05_detalle_orden_compra.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 05_detalle_orden_compra.sql aplicado.' AS resultado;
