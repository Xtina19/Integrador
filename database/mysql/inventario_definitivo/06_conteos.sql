-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 06_conteos.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Crea el conteo físico DEFINITIVO, reemplazo de las tablas legadas
-- (conteo_fisico / detalle_conteo_fisico de 18_modulos_extendidos.sql) y
-- transicionales (conteo_fisico_sesion y satélites de
-- 22_conteo_fisico_dominio.sql), todas eliminadas en 01_cleanup_redundante.sql.
--
-- Alineado 1:1 al agregado ConteoFisico
-- (backend/src/modules/inventario/domain/aggregates/ConteoFisico.ts):
--   conteo_fisico            <- ConteoFisicoProps (cabecera)
--   snapshot_conteo          <- SnapshotConteoProps
--   linea_conteo             <- LineaConteoProps
--   conteo_alcance_producto  <- alcance planificado (fase "Crear", previo al
--                                snapshot que se toma recién al "Abrir").
--   auditoria_conteo_fisico  <- bitácora específica del caso de uso.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- conteo_fisico (cabecera)
-- -----------------------------------------------------------------------------
CREATE TABLE conteo_fisico (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                VARCHAR(40)  NOT NULL,
  almacen_id            INT UNSIGNED NOT NULL,
  sucursal_id           INT UNSIGNED NULL,
  tipo_conteo           ENUM('general','parcial','ciclico','extraordinario') NOT NULL,
  descripcion_alcance   TEXT NOT NULL,
  estado                ENUM('borrador','abierto','en_conteo','en_revision','cerrado','cancelado')
                          NOT NULL DEFAULT 'borrador',
  responsable_id        INT UNSIGNED NOT NULL,
  bloqueo_activo        TINYINT(1)   NOT NULL DEFAULT 0,
  version               INT UNSIGNED NOT NULL DEFAULT 1,
  dominio_id            CHAR(36)     NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_fisico_codigo (codigo),
  UNIQUE KEY uk_conteo_fisico_dominio_id (dominio_id),
  KEY idx_conteo_fisico_almacen_estado (almacen_id, estado),
  KEY idx_conteo_fisico_sucursal (sucursal_id),
  KEY idx_conteo_fisico_responsable (responsable_id),
  CONSTRAINT fk_conteo_fisico_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_conteo_fisico_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_conteo_fisico_responsable
    FOREIGN KEY (responsable_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_conteo_fisico_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- conteo_alcance_producto — alcance planificado en la fase "Crear" (previo al
-- snapshot de existencias, que solo se toma al "Abrir" el conteo).
-- -----------------------------------------------------------------------------
CREATE TABLE conteo_alcance_producto (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  existencia_actual   INT NOT NULL DEFAULT 0,
  stock_minimo        INT NOT NULL DEFAULT 0,
  seleccionado        TINYINT(1) NOT NULL DEFAULT 1,
  dominio_id          CHAR(36) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_alcance_producto (conteo_id, producto_id),
  UNIQUE KEY uk_conteo_alcance_dominio_id (dominio_id),
  KEY idx_conteo_alcance_producto (producto_id),
  CONSTRAINT fk_conteo_alcance_conteo
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_conteo_alcance_producto_fk
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- snapshot_conteo — fotografía de existencias al momento de "Abrir" el conteo.
-- -----------------------------------------------------------------------------
CREATE TABLE snapshot_conteo (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad_teorica    INT NOT NULL,
  costo_referencia    DECIMAL(18,0) NULL,
  version             INT UNSIGNED NOT NULL DEFAULT 1,
  dominio_id          CHAR(36) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_snapshot_conteo_producto (conteo_id, producto_id),
  UNIQUE KEY uk_snapshot_conteo_dominio_id (dominio_id),
  KEY idx_snapshot_conteo_producto (producto_id),
  CONSTRAINT fk_snapshot_conteo_conteo
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_snapshot_conteo_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_snapshot_conteo_cantidad CHECK (cantidad_teorica >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- linea_conteo — captura / clasificación por producto.
-- -----------------------------------------------------------------------------
CREATE TABLE linea_conteo (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id             INT UNSIGNED NOT NULL,
  snapshot_id           INT UNSIGNED NOT NULL,
  producto_id           INT UNSIGNED NOT NULL,
  cantidad_contada      INT NULL,
  cantidad_reconteo     INT NULL,
  cantidad_aceptada     INT NULL,
  diferencia            INT NULL,
  clasificacion         ENUM('cuadra','sobrante','faltante','dano','investigacion') NULL,
  estado_linea          ENUM('pendiente','contada','en_reconteo','revisada','regularizada')
                          NOT NULL DEFAULT 'pendiente',
  regularizacion_tipo   ENUM('ajuste','descarte') NULL,
  regularizacion_id     INT UNSIGNED NULL,
  observacion           TEXT NULL,
  version               INT UNSIGNED NOT NULL DEFAULT 1,
  dominio_id            CHAR(36) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_linea_conteo_snapshot (conteo_id, snapshot_id),
  UNIQUE KEY uk_linea_conteo_dominio_id (dominio_id),
  KEY idx_linea_conteo_conteo (conteo_id),
  KEY idx_linea_conteo_estado (estado_linea),
  KEY idx_linea_conteo_producto (producto_id),
  KEY idx_linea_conteo_regularizacion (regularizacion_tipo, regularizacion_id),
  CONSTRAINT fk_linea_conteo_conteo
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_linea_conteo_snapshot
    FOREIGN KEY (snapshot_id) REFERENCES snapshot_conteo (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_linea_conteo_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_conteo_fisico — bitácora del caso de uso Conteo Físico.
-- -----------------------------------------------------------------------------
CREATE TABLE auditoria_conteo_fisico (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id       INT UNSIGNED NOT NULL,
  accion          VARCHAR(80)  NOT NULL,
  usuario_id      INT UNSIGNED NULL,
  resultado       ENUM('OK','RECHAZADO','ERROR') NOT NULL DEFAULT 'OK',
  detalle         TEXT NULL,
  ip_address      VARCHAR(45) NULL,
  dominio_id      CHAR(36) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auditoria_conteo_dominio_id (dominio_id),
  KEY idx_auditoria_conteo_conteo (conteo_id),
  KEY idx_auditoria_conteo_accion (accion),
  CONSTRAINT fk_auditoria_conteo_conteo
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_auditoria_conteo_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Cierra el ciclo: ajuste_detalle.linea_conteo_id ahora puede referenciar
-- linea_conteo (la tabla no existía cuando se creó ajuste_detalle en
-- 05_ajustes.sql).
-- -----------------------------------------------------------------------------
ALTER TABLE ajuste_detalle
  ADD CONSTRAINT fk_ajuste_detalle_linea_conteo
    FOREIGN KEY (linea_conteo_id) REFERENCES linea_conteo (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '06_conteos.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 06_conteos.sql aplicado.' AS resultado;
