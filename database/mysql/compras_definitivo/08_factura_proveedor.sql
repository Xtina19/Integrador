-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 08_factura_proveedor.sql
-- Tabla: factura_proveedor
-- Modelo: backend/models/compras/facturaProveedor.model.js
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS factura_proveedor (
  id                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                      VARCHAR(30)  NOT NULL,
  orden_compra_id             INT UNSIGNED NOT NULL,
  proveedor_id                INT UNSIGNED NOT NULL,
  numero_factura              VARCHAR(50)  NOT NULL,
  ncf                         VARCHAR(50)  NULL,
  moneda_id                   INT UNSIGNED NOT NULL,
  tasa_cambio                 DECIMAL(18,6) NOT NULL DEFAULT 1.000000,
  condicion_pago_id           INT UNSIGNED NOT NULL,
  fecha_emision               DATE NOT NULL,
  fecha_recepcion_documento   DATE NULL,
  fecha_vencimiento           DATE NULL,
  subtotal                    DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  descuento                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total                       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado                      ENUM('registrada','contabilizada','anulada') NOT NULL DEFAULT 'registrada',
  estado_pago                 ENUM('pendiente','parcial','pagada') NOT NULL DEFAULT 'pendiente',
  activo                      TINYINT(1) NOT NULL DEFAULT 1,
  observaciones               TEXT NULL,
  created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by                  INT UNSIGNED NULL,
  updated_by                  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_proveedor_codigo (codigo),
  UNIQUE KEY uk_factura_proveedor_numero (proveedor_id, numero_factura),
  UNIQUE KEY uk_factura_proveedor_orden (orden_compra_id),
  KEY idx_factura_proveedor_proveedor (proveedor_id),
  KEY idx_factura_proveedor_moneda (moneda_id),
  KEY idx_factura_proveedor_condicion (condicion_pago_id),
  KEY idx_factura_proveedor_estado (estado),
  KEY idx_factura_proveedor_estado_pago (estado_pago),
  KEY idx_factura_proveedor_fecha_emision (fecha_emision),
  KEY idx_factura_proveedor_activo (activo),
  CONSTRAINT fk_factura_proveedor_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_condicion_pago
    FOREIGN KEY (condicion_pago_id) REFERENCES condiciones_pago (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_factura_proveedor_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_factura_proveedor_totales
    CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0),
  CONSTRAINT chk_factura_proveedor_tasa
    CHECK (tasa_cambio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '08_factura_proveedor.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 08_factura_proveedor.sql aplicado.' AS resultado;
