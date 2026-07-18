-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 08_auditoria_idempotencia.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Crea `auditoria_inventario` (append-only, espejo relacional de
-- AuditoriaMovimiento) e `inventario_idempotencia` (respaldo relacional del
-- IIdempotencyRepository de Application Services), usadas por los
-- procedimientos de 10_procedimientos.sql.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- auditoria_inventario
-- -----------------------------------------------------------------------------
CREATE TABLE auditoria_inventario (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_accion       ENUM('movimiento','aplicacion','aprobacion','rechazo','cancelacion','reversion','error')
                      NOT NULL DEFAULT 'movimiento',
  usuario_id        INT UNSIGNED NULL,
  fecha             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resultado         ENUM('OK','RECHAZADO','ERROR') NOT NULL DEFAULT 'OK',
  movimiento_id     INT UNSIGNED NULL,
  documento_tipo    VARCHAR(40)  NULL,
  documento_id      VARCHAR(64)  NULL,
  producto_id       INT UNSIGNED NULL,
  almacen_id        INT UNSIGNED NULL,
  valor_antes       JSON NULL,
  valor_despues     JSON NULL,
  detalle           TEXT NULL,
  idempotency_key   VARCHAR(100) NULL,
  dominio_id        CHAR(36) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auditoria_inventario_dominio_id (dominio_id),
  KEY idx_auditoria_inventario_movimiento (movimiento_id),
  KEY idx_auditoria_inventario_documento (documento_tipo, documento_id),
  KEY idx_auditoria_inventario_producto_almacen (producto_id, almacen_id),
  KEY idx_auditoria_inventario_usuario_fecha (usuario_id, fecha),
  KEY idx_auditoria_inventario_idempotency (idempotency_key),
  CONSTRAINT fk_auditoria_inventario_movimiento
    FOREIGN KEY (movimiento_id) REFERENCES movimiento_inventario (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_auditoria_inventario_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_inventario_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_inventario_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- inventario_idempotencia
-- Espejo relacional de IIdempotencyRepository: garantiza que reintentos del
-- mismo comando (misma idempotency_key) devuelvan el mismo resultado sin
-- reaplicar el efecto de stock.
-- -----------------------------------------------------------------------------
CREATE TABLE inventario_idempotencia (
  idempotency_key   VARCHAR(100) NOT NULL,
  tipo_operacion    VARCHAR(60)  NOT NULL,
  documento_tipo    VARCHAR(40)  NULL,
  documento_id      VARCHAR(64)  NULL,
  resultado         JSON NULL,
  fecha_registro    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idempotency_key),
  KEY idx_inventario_idempotencia_documento (documento_tipo, documento_id),
  KEY idx_inventario_idempotencia_tipo (tipo_operacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '08_auditoria_idempotencia.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 08_auditoria_idempotencia.sql aplicado.' AS resultado;
