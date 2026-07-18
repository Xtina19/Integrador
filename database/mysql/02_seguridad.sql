-- =============================================================================
-- LibroSys — Seguridad
-- Archivo: 02_seguridad.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)  NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(255) NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_codigo (codigo),
  KEY idx_roles_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- permisos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(60)  NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  modulo          VARCHAR(50)  NOT NULL,
  descripcion     VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permisos_codigo (codigo),
  KEY idx_permisos_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- rol_permiso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id          INT UNSIGNED NOT NULL,
  permiso_id      INT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rol_permiso_rol
    FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rol_permiso_permiso
    FOREIGN KEY (permiso_id) REFERENCES permisos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id          INT UNSIGNED NOT NULL,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  apellido        VARCHAR(150) NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  telefono        VARCHAR(30)  NULL,
  estado          ENUM('activo','inactivo','bloqueado') NOT NULL DEFAULT 'activo',
  ultimo_acceso   DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_codigo (codigo),
  UNIQUE KEY uk_usuarios_email (email),
  KEY idx_usuarios_rol (rol_id),
  KEY idx_usuarios_estado (estado),
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_usuarios_email
    CHECK (email LIKE '%@%.%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
