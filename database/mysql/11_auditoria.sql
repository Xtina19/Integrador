-- =============================================================================
-- LibroSys — Auditoría
-- Archivo: 11_auditoria.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- auditoria (registro principal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  modulo              VARCHAR(50)  NOT NULL,
  entidad             VARCHAR(80)  NOT NULL,
  entidad_id          VARCHAR(50)  NOT NULL,
  accion              ENUM('crear','actualizar','eliminar','consultar','acceso','otro') NOT NULL,
  usuario_id          INT UNSIGNED NULL,
  ip_address          VARCHAR(45)  NULL,
  user_agent          VARCHAR(255) NULL,
  descripcion         VARCHAR(500) NULL,
  fecha_evento        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_modulo (modulo),
  KEY idx_auditoria_entidad (entidad, entidad_id),
  KEY idx_auditoria_usuario (usuario_id),
  KEY idx_auditoria_fecha (fecha_evento),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_cambio (detalle de campos modificados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_cambio (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  campo               VARCHAR(100) NOT NULL,
  valor_anterior      TEXT NULL,
  valor_nuevo         TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_auditoria_cambio_auditoria (auditoria_id),
  CONSTRAINT fk_auditoria_cambio
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_acceso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_acceso (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo_acceso         ENUM('login','logout','intento_fallido','sesion_expirada') NOT NULL,
  ip_address          VARCHAR(45)  NULL,
  fecha_acceso        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_acceso_usuario (usuario_id),
  KEY idx_auditoria_acceso_fecha (fecha_acceso),
  CONSTRAINT fk_auditoria_acceso_auditoria
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_acceso_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_eliminacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_eliminacion (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  entidad             VARCHAR(80)  NOT NULL,
  entidad_id          VARCHAR(50)  NOT NULL,
  motivo              VARCHAR(255) NULL,
  datos_eliminados    JSON NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  fecha_eliminacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_eliminacion_entidad (entidad, entidad_id),
  CONSTRAINT fk_auditoria_eliminacion_auditoria
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_eliminacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
