-- =============================================================================
-- LibroSys — Transferencias
-- Archivo: 08_transferencias.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transferencia (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  almacen_origen_id       INT UNSIGNED NOT NULL,
  almacen_destino_id      INT UNSIGNED NOT NULL,
  usuario_solicita_id     INT UNSIGNED NOT NULL,
  usuario_aprueba_id      INT UNSIGNED NULL,
  fecha_solicitud         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_envio             DATETIME NULL,
  fecha_recepcion         DATETIME NULL,
  transporte              VARCHAR(100) NULL,
  estado                  ENUM('solicitada','aprobada','en_transito','recibida','finalizada','cancelada') NOT NULL DEFAULT 'solicitada',
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transferencia_codigo (codigo),
  KEY idx_transferencia_estado (estado),
  KEY idx_transferencia_origen (almacen_origen_id),
  KEY idx_transferencia_destino (almacen_destino_id),
  CONSTRAINT fk_transferencia_origen
    FOREIGN KEY (almacen_origen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_destino
    FOREIGN KEY (almacen_destino_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_solicita
    FOREIGN KEY (usuario_solicita_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_aprueba
    FOREIGN KEY (usuario_aprueba_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_transferencia_almacenes
    CHECK (almacen_origen_id <> almacen_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_transferencia (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  transferencia_id        INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  cantidad_solicitada     INT UNSIGNED NOT NULL,
  cantidad_enviada        INT UNSIGNED NOT NULL DEFAULT 0,
  cantidad_recibida       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_transferencia_producto (transferencia_id, producto_id),
  KEY idx_detalle_transferencia_producto (producto_id),
  CONSTRAINT fk_detalle_transferencia
    FOREIGN KEY (transferencia_id) REFERENCES transferencia (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_transferencia_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_transferencia_cantidades
    CHECK (
      cantidad_solicitada > 0 AND
      cantidad_enviada <= cantidad_solicitada AND
      cantidad_recibida <= cantidad_enviada
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
