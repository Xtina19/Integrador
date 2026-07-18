-- =============================================================================
-- LibroSys — Conteo físico (dominio Inventario DDD)
-- Archivo: 22_conteo_fisico_dominio.sql
--
-- NO modifica tablas existentes (conteo_fisico / detalle_conteo_fisico del legado).
-- Crea las piezas relacionales del caso de uso Crear/Abrir Conteo alineadas al
-- modelo aprobado: cabecera de sesión, snapshot, líneas, alcance y auditoría.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- Cabecera operativa del módulo Inventario (agregado ConteoFisico + metadatos de creación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conteo_fisico_sesion (
  id                          CHAR(36)     NOT NULL,
  codigo                      VARCHAR(40)  NOT NULL,
  nombre                      VARCHAR(200) NOT NULL,
  tipo_conteo                 ENUM('general','parcial','ciclico','extraordinario') NOT NULL,
  sucursal_id                 VARCHAR(64)  NOT NULL,
  almacen_id                  VARCHAR(64)  NOT NULL,
  alcance_tipo                ENUM('todo_almacen','categoria','editorial','ubicacion','productos') NOT NULL,
  alcance_valor               VARCHAR(255) NULL,
  descripcion_alcance         TEXT         NOT NULL,
  estado                      ENUM('borrador','abierto','en_conteo','en_revision','cerrado','cancelado') NOT NULL DEFAULT 'borrador',
  fase                        VARCHAR(40)  NOT NULL DEFAULT 'Crear',
  responsable_id              VARCHAR(64)  NOT NULL,
  responsable_nombre          VARCHAR(150) NULL,
  fecha_programada            DATE         NULL,
  hora_programada             TIME         NULL,
  observaciones               TEXT         NULL,
  bloquear_almacen_al_abrir   TINYINT(1)   NOT NULL DEFAULT 1,
  permitir_reconteo           TINYINT(1)   NOT NULL DEFAULT 1,
  diferencia_minima_reconteo  INT          NOT NULL DEFAULT 1,
  bloqueo_activo              TINYINT(1)   NOT NULL DEFAULT 0,
  version                     INT UNSIGNED NOT NULL DEFAULT 1,
  created_by                  VARCHAR(64)  NOT NULL,
  created_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_sesion_codigo (codigo),
  KEY idx_conteo_sesion_almacen_estado (almacen_id, estado),
  KEY idx_conteo_sesion_sucursal (sucursal_id),
  KEY idx_conteo_sesion_responsable (responsable_id),
  CONSTRAINT chk_conteo_sesion_diff_min CHECK (diferencia_minima_reconteo >= 0),
  CONSTRAINT chk_conteo_sesion_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Productos planificados en el alcance (Create Conteo — aún sin snapshot de stock)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conteo_alcance_producto (
  id                CHAR(36)     NOT NULL,
  conteo_id         CHAR(36)     NOT NULL,
  producto_id       VARCHAR(64)  NOT NULL,
  isbn              VARCHAR(32)  NULL,
  titulo            VARCHAR(255) NULL,
  categoria         VARCHAR(100) NULL,
  editorial         VARCHAR(150) NULL,
  ubicacion         VARCHAR(150) NULL,
  existencia_actual INT          NOT NULL DEFAULT 0,
  stock_minimo      INT          NOT NULL DEFAULT 0,
  seleccionado      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_alcance_prod (conteo_id, producto_id),
  KEY idx_conteo_alcance_conteo (conteo_id),
  CONSTRAINT fk_conteo_alcance_sesion
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico_sesion (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Snapshot de existencias (se llena al Abrir Conteo — no en Crear)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snapshot_conteo (
  id                  CHAR(36)     NOT NULL,
  conteo_id           CHAR(36)     NOT NULL,
  producto_id         VARCHAR(64)  NOT NULL,
  cantidad_teorica    INT          NOT NULL,
  costo_referencia    DECIMAL(18,4) NULL,
  version             INT UNSIGNED NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_snapshot_conteo_prod (conteo_id, producto_id),
  KEY idx_snapshot_conteo (conteo_id),
  CONSTRAINT fk_snapshot_conteo_sesion
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico_sesion (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_snapshot_cantidad CHECK (cantidad_teorica >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Líneas de captura / clasificación
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linea_conteo (
  id                    CHAR(36)     NOT NULL,
  conteo_id             CHAR(36)     NOT NULL,
  snapshot_id           CHAR(36)     NOT NULL,
  producto_id           VARCHAR(64)  NOT NULL,
  cantidad_contada      INT          NULL,
  cantidad_reconteo     INT          NULL,
  cantidad_aceptada     INT          NULL,
  diferencia            INT          NULL,
  clasificacion         ENUM('cuadra','sobrante','faltante','dano','investigacion') NULL,
  estado_linea          ENUM('pendiente','contada','en_reconteo','revisada','regularizada') NOT NULL DEFAULT 'pendiente',
  regularizacion_tipo   ENUM('ajuste','descarte') NULL,
  regularizacion_id     VARCHAR(64)  NULL,
  observacion           TEXT         NULL,
  version               INT UNSIGNED NOT NULL DEFAULT 1,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_linea_conteo_snapshot (conteo_id, snapshot_id),
  KEY idx_linea_conteo (conteo_id),
  KEY idx_linea_estado (estado_linea),
  CONSTRAINT fk_linea_conteo_sesion
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico_sesion (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_linea_conteo_snapshot
    FOREIGN KEY (snapshot_id) REFERENCES snapshot_conteo (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Auditoría del proceso de conteo
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_conteo_fisico (
  id              CHAR(36)     NOT NULL,
  conteo_id       CHAR(36)     NOT NULL,
  accion          VARCHAR(80)  NOT NULL,
  usuario_id      VARCHAR(64)  NOT NULL,
  resultado       ENUM('OK','RECHAZADO','ERROR') NOT NULL DEFAULT 'OK',
  detalle         TEXT         NULL,
  ip_address      VARCHAR(45)  NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aud_conteo (conteo_id),
  KEY idx_aud_accion (accion),
  CONSTRAINT fk_aud_conteo_sesion
    FOREIGN KEY (conteo_id) REFERENCES conteo_fisico_sesion (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
