-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 07_descartes.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Crea `descarte` + `descarte_detalle` + `descarte_evidencia`, reemplazo
-- definitivo de las tablas transicionales eliminadas en
-- 01_cleanup_redundante.sql (descarte, descarte_detalle, descarte_evidencia,
-- descarte_aprobacion, descarte_sesion). `descarte_aprobacion` se fusiona en
-- la cabecera (solicitante_id / aprobador_id), tal como Ajuste/Descarte lo
-- modelan en el dominio.
--
-- Alineado 1:1 al agregado Descarte
-- (backend/src/modules/inventario/domain/aggregates/Descarte.ts).
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- descarte (cabecera)
-- -----------------------------------------------------------------------------
CREATE TABLE descarte (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(40)  NOT NULL,
  almacen_id              INT UNSIGNED NOT NULL,
  sucursal_id             INT UNSIGNED NULL,
  estado                  ENUM('borrador','solicitado','aprobado','rechazado','aplicado','cancelado','revertido')
                            NOT NULL DEFAULT 'borrador',
  solicitante_id          INT UNSIGNED NOT NULL,
  aprobador_id            INT UNSIGNED NULL,
  version                 INT UNSIGNED NOT NULL DEFAULT 1,
  observacion             TEXT NULL,
  documento_origen_tipo   VARCHAR(40)  NULL,
  documento_origen_id     VARCHAR(64)  NULL,
  -- Orígenes tipados (preparados para integraciones; solo conteo tiene FK física)
  conteo_origen_id        INT UNSIGNED NULL,
  ajuste_origen_id        INT UNSIGNED NULL,
  transferencia_origen_id INT UNSIGNED NULL,
  movimiento_origen_id    INT UNSIGNED NULL,
  kardex_origen_id        INT UNSIGNED NULL,
  dominio_id              CHAR(36)     NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_descarte_codigo (codigo),
  UNIQUE KEY uk_descarte_dominio_id (dominio_id),
  KEY idx_descarte_almacen_estado (almacen_id, estado),
  KEY idx_descarte_sucursal (sucursal_id),
  KEY idx_descarte_solicitante (solicitante_id),
  KEY idx_descarte_aprobador (aprobador_id),
  KEY idx_descarte_documento_origen (documento_origen_tipo, documento_origen_id),
  KEY idx_descarte_conteo_origen (conteo_origen_id),
  KEY idx_descarte_ajuste_origen (ajuste_origen_id),
  KEY idx_descarte_transferencia_origen (transferencia_origen_id),
  KEY idx_descarte_movimiento_origen (movimiento_origen_id),
  KEY idx_descarte_kardex_origen (kardex_origen_id),
  CONSTRAINT fk_descarte_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_descarte_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_descarte_solicitante
    FOREIGN KEY (solicitante_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_descarte_aprobador
    FOREIGN KEY (aprobador_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_descarte_conteo_origen
    FOREIGN KEY (conteo_origen_id) REFERENCES conteo_fisico (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_descarte_ajuste_origen
    FOREIGN KEY (ajuste_origen_id) REFERENCES ajuste (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_descarte_transferencia_origen
    FOREIGN KEY (transferencia_origen_id) REFERENCES transferencia (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_descarte_movimiento_origen
    FOREIGN KEY (movimiento_origen_id) REFERENCES movimiento_inventario (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_descarte_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- descarte_detalle (líneas)
-- -----------------------------------------------------------------------------
CREATE TABLE descarte_detalle (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  descarte_id         INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad            INT NOT NULL,
  costo               DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  motivo_codigo       VARCHAR(40)   NOT NULL,
  observacion         VARCHAR(255)  NULL,
  dominio_id          CHAR(36)      NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_descarte_detalle_dominio_id (dominio_id),
  KEY idx_descarte_detalle_descarte (descarte_id),
  KEY idx_descarte_detalle_producto (producto_id),
  KEY idx_descarte_detalle_motivo (motivo_codigo),
  CONSTRAINT fk_descarte_detalle_descarte
    FOREIGN KEY (descarte_id) REFERENCES descarte (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_descarte_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_descarte_detalle_motivo
    FOREIGN KEY (motivo_codigo) REFERENCES cat_motivo_descarte (codigo)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_descarte_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_descarte_detalle_costo CHECK (costo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- descarte_evidencia (fotos/actas/documentos de soporte)
-- -----------------------------------------------------------------------------
CREATE TABLE descarte_evidencia (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  descarte_id           INT UNSIGNED NOT NULL,
  tipo                  ENUM('fotografia','pdf','acta','documento','comentario') NOT NULL,
  nombre_archivo        VARCHAR(255) NULL,
  url_referencia        VARCHAR(500) NULL,
  comentario            TEXT NULL,
  created_by            INT UNSIGNED NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_descarte_evidencia_descarte (descarte_id),
  CONSTRAINT fk_descarte_evidencia_descarte
    FOREIGN KEY (descarte_id) REFERENCES descarte (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_descarte_evidencia_usuario
    FOREIGN KEY (created_by) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '07_descartes.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 07_descartes.sql aplicado.' AS resultado;
