-- =============================================================================
-- LibroSys — Configuración
-- Archivo: 10_configuracion.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- configuracion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave               VARCHAR(100) NOT NULL,
  valor               TEXT NOT NULL,
  tipo_dato           ENUM('texto','numero','booleano','json','fecha') NOT NULL DEFAULT 'texto',
  modulo              VARCHAR(50)  NOT NULL,
  descripcion         VARCHAR(255) NULL,
  editable            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_configuracion_clave (clave),
  KEY idx_configuracion_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notificaciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NULL,
  tipo                ENUM('info','warning','danger','success') NOT NULL DEFAULT 'info',
  titulo              VARCHAR(150) NOT NULL,
  mensaje             TEXT NOT NULL,
  modulo              VARCHAR(50)  NOT NULL,
  leida               TINYINT(1)   NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificaciones_usuario (usuario_id),
  KEY idx_notificaciones_leida (leida),
  KEY idx_notificaciones_modulo (modulo),
  CONSTRAINT fk_notificaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- correo_notificacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS correo_notificacion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  notificacion_id     INT UNSIGNED NOT NULL,
  destinatario_email  VARCHAR(150) NOT NULL,
  asunto              VARCHAR(200) NOT NULL,
  cuerpo              TEXT NOT NULL,
  estado_envio        ENUM('pendiente','enviado','fallido') NOT NULL DEFAULT 'pendiente',
  intentos            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_envio         DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_correo_notificacion (notificacion_id),
  KEY idx_correo_estado (estado_envio),
  CONSTRAINT fk_correo_notificacion
    FOREIGN KEY (notificacion_id) REFERENCES notificaciones (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_correo_email
    CHECK (destinatario_email LIKE '%@%.%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
