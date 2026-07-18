-- =============================================================================
-- LibroSys — Administración
-- Archivo: 03_administracion.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- categorias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categorias_codigo (codigo),
  UNIQUE KEY uk_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- editoriales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editoriales (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  pais            VARCHAR(100) NULL,
  contacto        VARCHAR(150) NULL,
  email           VARCHAR(150) NULL,
  telefono        VARCHAR(30)  NULL,
  tipo_contrato   VARCHAR(100) NULL,
  fecha_vencimiento DATE NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_editoriales_codigo (codigo),
  KEY idx_editoriales_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  contacto        VARCHAR(150) NULL,
  email           VARCHAR(150) NULL,
  telefono        VARCHAR(30)  NULL,
  pais            VARCHAR(100) NULL,
  tipo            ENUM('nacional','internacional','mixto') NOT NULL DEFAULT 'nacional',
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_proveedores_codigo (codigo),
  KEY idx_proveedores_tipo (tipo),
  KEY idx_proveedores_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- sucursales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sucursales (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  ciudad          VARCHAR(100) NULL,
  direccion       VARCHAR(255) NULL,
  telefono        VARCHAR(30)  NULL,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sucursales_codigo (codigo),
  KEY idx_sucursales_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- almacenes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS almacenes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sucursal_id     INT UNSIGNED NULL,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  tipo            ENUM('central','sucursal','transito','evento') NOT NULL DEFAULT 'central',
  capacidad       INT UNSIGNED NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_almacenes_codigo (codigo),
  KEY idx_almacenes_sucursal (sucursal_id),
  KEY idx_almacenes_tipo (tipo),
  CONSTRAINT fk_almacenes_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- monedas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monedas (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(5)   NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  simbolo         VARCHAR(10)  NOT NULL,
  es_principal    TINYINT(1)   NOT NULL DEFAULT 0,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_monedas_codigo (codigo),
  KEY idx_monedas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tasas_cambio
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasas_cambio (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  moneda_origen_id    INT UNSIGNED NOT NULL,
  moneda_destino_id   INT UNSIGNED NOT NULL,
  tasa                DECIMAL(18,6) NOT NULL,
  vigente_desde       DATETIME NOT NULL,
  vigente_hasta       DATETIME NULL,
  actualizado_por_id  INT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasas_monedas (moneda_origen_id, moneda_destino_id),
  KEY idx_tasas_vigencia (vigente_desde, vigente_hasta),
  CONSTRAINT fk_tasas_origen
    FOREIGN KEY (moneda_origen_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tasas_destino
    FOREIGN KEY (moneda_destino_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tasas_usuario
    FOREIGN KEY (actualizado_por_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_tasas_positiva
    CHECK (tasa > 0),
  CONSTRAINT chk_tasas_monedas_distintas
    CHECK (moneda_origen_id <> moneda_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
