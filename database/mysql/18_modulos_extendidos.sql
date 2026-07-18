-- =============================================================================
-- LibroSys — Módulos extendidos
-- Archivo: 18_modulos_extendidos.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS contrato_editorial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  editorial_id        INT UNSIGNED NOT NULL,
  nombre              VARCHAR(200) NOT NULL,
  tipo_contrato       VARCHAR(100) NOT NULL,
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NOT NULL,
  estado              ENUM('activo','por_vencer','vencido','cancelado') NOT NULL DEFAULT 'activo',
  responsable_id      INT UNSIGNED NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_contrato_codigo (codigo),
  CONSTRAINT fk_contrato_editorial FOREIGN KEY (editorial_id) REFERENCES editoriales (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_contrato_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS renovacion_contrato (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contrato_id         INT UNSIGNED NOT NULL,
  fecha_vencimiento_anterior DATE NOT NULL,
  fecha_vencimiento_nueva    DATE NOT NULL,
  fecha_renovacion    DATE NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_renovacion_contrato FOREIGN KEY (contrato_id) REFERENCES contrato_editorial (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_renovacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS condicion_comercial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  editorial_id        INT UNSIGNED NOT NULL,
  descuento_pct       DECIMAL(5,2) NULL,
  plazo_credito_dias  INT UNSIGNED NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  contacto            VARCHAR(150) NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_condicion_editorial (editorial_id),
  CONSTRAINT fk_condicion_editorial FOREIGN KEY (editorial_id) REFERENCES editoriales (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_condicion_moneda FOREIGN KEY (moneda_id) REFERENCES monedas (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historial_tasa_cambio (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tasa_cambio_id      INT UNSIGNED NOT NULL,
  tasa                DECIMAL(18,6) NOT NULL,
  fecha_registro      DATETIME NOT NULL,
  actualizado_por_id  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_historial_tasa FOREIGN KEY (tasa_cambio_id) REFERENCES tasas_cambio (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_historial_tasa_usuario FOREIGN KEY (actualizado_por_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE inventario
  ADD COLUMN pasillo VARCHAR(20) NULL AFTER ubicacion,
  ADD COLUMN estante VARCHAR(20) NULL AFTER pasillo,
  ADD COLUMN seccion  VARCHAR(50) NULL AFTER estante;

CREATE TABLE IF NOT EXISTS conteo_fisico (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  fecha_conteo        DATE NOT NULL,
  total_productos     INT UNSIGNED NOT NULL DEFAULT 0,
  total_discrepancias INT UNSIGNED NOT NULL DEFAULT 0,
  estado              ENUM('en_progreso','completado','anulado') NOT NULL DEFAULT 'en_progreso',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_codigo (codigo),
  CONSTRAINT fk_conteo_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_conteo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_conteo_fisico (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  stock_sistema       INT NOT NULL,
  stock_contado       INT NOT NULL,
  diferencia          INT GENERATED ALWAYS AS (stock_contado - stock_sistema) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_producto (conteo_id, producto_id),
  CONSTRAINT fk_detalle_conteo FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_conteo_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cambio_producto (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  venta_id                INT UNSIGNED NOT NULL,
  producto_original_id    INT UNSIGNED NOT NULL,
  producto_nuevo_id       INT UNSIGNED NOT NULL,
  cantidad                INT UNSIGNED NOT NULL DEFAULT 1,
  diferencia_precio       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  motivo                  VARCHAR(255) NOT NULL,
  usuario_id              INT UNSIGNED NOT NULL,
  fecha_cambio            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cambio_codigo (codigo),
  CONSTRAINT fk_cambio_venta FOREIGN KEY (venta_id) REFERENCES venta (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_producto_orig FOREIGN KEY (producto_original_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_producto_nuevo FOREIGN KEY (producto_nuevo_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nota_credito (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  venta_id            INT UNSIGNED NOT NULL,
  cambio_producto_id  INT UNSIGNED NULL,
  fecha_emision       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo              VARCHAR(255) NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado              ENUM('activa','utilizada','expirada','anulada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id),
  UNIQUE KEY uk_nota_credito_codigo (codigo),
  CONSTRAINT fk_nota_credito_venta FOREIGN KEY (venta_id) REFERENCES venta (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_nota_credito_cambio FOREIGN KEY (cambio_producto_id) REFERENCES cambio_producto (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesion_usuario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NOT NULL,
  token_sesion        VARCHAR(255) NOT NULL,
  dispositivo         VARCHAR(150) NULL,
  ip_address          VARCHAR(45)  NULL,
  fecha_inicio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado              ENUM('activa','expirada','cerrada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_usuario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NOT NULL,
  habilitado          TINYINT(1)   NOT NULL DEFAULT 0,
  metodo              ENUM('app','sms','email') NOT NULL DEFAULT 'app',
  ultima_verificacion DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mfa_usuario (usuario_id),
  CONSTRAINT fk_mfa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intento_acceso_fallido (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_intento       VARCHAR(150) NOT NULL,
  ip_address          VARCHAR(45)  NULL,
  motivo              VARCHAR(255) NULL,
  fecha_intento       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
