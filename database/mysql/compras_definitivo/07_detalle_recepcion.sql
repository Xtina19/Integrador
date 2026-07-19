-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 07_detalle_recepcion.sql
-- Tabla: detalle_recepcion
-- Modelo: backend/models/compras/detalleRecepcion.model.js
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS detalle_recepcion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recepcion_id            INT UNSIGNED NOT NULL,
  detalle_orden_compra_id INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  cantidad_recibida       INT UNSIGNED NOT NULL,
  costo_unitario          DECIMAL(18,4) NOT NULL,
  activo                  TINYINT(1) NOT NULL DEFAULT 1,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by              INT UNSIGNED NULL,
  updated_by              INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_recepcion_doc (recepcion_id, detalle_orden_compra_id),
  KEY idx_detalle_recepcion_producto (producto_id),
  KEY idx_detalle_recepcion_doc_oc (detalle_orden_compra_id),
  KEY idx_detalle_recepcion_activo (activo),
  CONSTRAINT fk_detalle_recepcion
    FOREIGN KEY (recepcion_id) REFERENCES recepcion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_recepcion_doc_oc
    FOREIGN KEY (detalle_orden_compra_id) REFERENCES detalle_orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_recepcion_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_recepcion_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_detalle_recepcion_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_detalle_recepcion_cantidad
    CHECK (cantidad_recibida > 0),
  CONSTRAINT chk_detalle_recepcion_costo
    CHECK (costo_unitario >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '07_detalle_recepcion.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 07_detalle_recepcion.sql aplicado.' AS resultado;
