-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 04_orden_compra.sql
-- Tabla: orden_compra
-- Modelo: backend/models/compras/ordenCompra.model.js
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS orden_compra (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  proveedor_id            INT UNSIGNED NOT NULL,
  sucursal_id             INT UNSIGNED NULL,
  moneda_id               INT UNSIGNED NOT NULL,
  tasa_cambio             DECIMAL(18,6) NOT NULL DEFAULT 1.000000,
  condicion_pago_id       INT UNSIGNED NOT NULL,
  tipo_compra             ENUM('nacional','internacional') NOT NULL DEFAULT 'nacional',
  fecha_orden             DATE NOT NULL,
  fecha_entrega_estimada  DATE NULL,
  subtotal                DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  descuento               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado                  ENUM(
    'borrador',
    'pendiente_aprobacion',
    'aprobada',
    'parcialmente_recibida',
    'recibida',
    'cerrada',
    'cancelada'
  ) NOT NULL DEFAULT 'borrador',
  activo                  TINYINT(1) NOT NULL DEFAULT 1,
  observaciones           TEXT NULL,
  fecha_aprobacion        DATETIME NULL,
  aprobado_por            INT UNSIGNED NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by              INT UNSIGNED NULL,
  updated_by              INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orden_compra_codigo (codigo),
  KEY idx_orden_compra_proveedor (proveedor_id),
  KEY idx_orden_compra_sucursal (sucursal_id),
  KEY idx_orden_compra_moneda (moneda_id),
  KEY idx_orden_compra_condicion_pago (condicion_pago_id),
  KEY idx_orden_compra_estado (estado),
  KEY idx_orden_compra_tipo (tipo_compra),
  KEY idx_orden_compra_fecha (fecha_orden),
  KEY idx_orden_compra_activo (activo),
  CONSTRAINT fk_orden_compra_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orden_compra_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_condicion_pago
    FOREIGN KEY (condicion_pago_id) REFERENCES condiciones_pago (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_aprobado_por
    FOREIGN KEY (aprobado_por) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orden_compra_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orden_compra_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_orden_compra_totales
    CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0),
  CONSTRAINT chk_orden_compra_tasa
    CHECK (tasa_cambio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '04_orden_compra.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 04_orden_compra.sql aplicado.' AS resultado;
