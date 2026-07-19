-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 06_recepcion.sql
-- Tabla: recepcion
-- Modelo: backend/models/compras/recepcion.model.js
--
-- Columnas factura_internacional_id / embarque_id: compatibilidad Importaciones
-- (nullable, sin FK aquí; 06_importaciones.sql puede añadir FKs después).
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS recepcion (
  id                        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                    VARCHAR(30)  NOT NULL,
  orden_compra_id           INT UNSIGNED NOT NULL,
  factura_internacional_id  INT UNSIGNED NULL,
  embarque_id               INT UNSIGNED NULL,
  almacen_id                INT UNSIGNED NOT NULL,
  fecha_recepcion           DATE NOT NULL,
  usuario_receptor          INT UNSIGNED NOT NULL,
  usuario_inspector         INT UNSIGNED NULL,
  resultado_inspeccion      ENUM('aceptada','parcialmente_aceptada','rechazada') NULL,
  observaciones             TEXT NULL,
  estado                    ENUM('borrador','confirmada','anulada') NOT NULL DEFAULT 'borrador',
  activo                    TINYINT(1) NOT NULL DEFAULT 1,
  fecha_confirmacion        DATETIME NULL,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by                INT UNSIGNED NULL,
  updated_by                INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recepcion_codigo (codigo),
  KEY idx_recepcion_orden (orden_compra_id),
  KEY idx_recepcion_almacen (almacen_id),
  KEY idx_recepcion_estado (estado),
  KEY idx_recepcion_fecha (fecha_recepcion),
  KEY idx_recepcion_factura_int (factura_internacional_id),
  KEY idx_recepcion_embarque (embarque_id),
  KEY idx_recepcion_activo (activo),
  CONSTRAINT fk_recepcion_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_usuario_receptor
    FOREIGN KEY (usuario_receptor) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_usuario_inspector
    FOREIGN KEY (usuario_inspector) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_recepcion_created_by
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_recepcion_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '06_recepcion.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 06_recepcion.sql aplicado.' AS resultado;
