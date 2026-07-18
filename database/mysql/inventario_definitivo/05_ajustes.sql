-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 05_ajustes.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Crea `ajuste` + `ajuste_detalle`, reemplazo definitivo de la tabla legada
-- `ajuste_inventario` (eliminada en 01_cleanup_redundante.sql), alineado 1:1
-- al agregado Ajuste (backend/src/modules/inventario/domain/aggregates/Ajuste.ts).
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- ajuste (cabecera)
-- -----------------------------------------------------------------------------
CREATE TABLE ajuste (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  almacen_id              INT UNSIGNED NOT NULL,
  tipo_ajuste             ENUM('positivo','negativo','digitacion','conteo','error_documental') NOT NULL,
  estado                  ENUM('borrador','solicitado','aprobado','rechazado','aplicado','cancelado','revertido')
                             NOT NULL DEFAULT 'borrador',
  solicitante_id          INT UNSIGNED NOT NULL,
  aprobador_id            INT UNSIGNED NULL,
  version                 INT UNSIGNED NOT NULL DEFAULT 1,
  observacion             TEXT NULL,
  documento_origen_tipo   VARCHAR(40)  NULL,
  documento_origen_id     VARCHAR(64)  NULL,
  dominio_id              CHAR(36)     NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ajuste_codigo (codigo),
  UNIQUE KEY uk_ajuste_dominio_id (dominio_id),
  KEY idx_ajuste_almacen_estado (almacen_id, estado),
  KEY idx_ajuste_solicitante (solicitante_id),
  KEY idx_ajuste_aprobador (aprobador_id),
  KEY idx_ajuste_documento_origen (documento_origen_tipo, documento_origen_id),
  CONSTRAINT fk_ajuste_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_solicitante
    FOREIGN KEY (solicitante_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_aprobador
    FOREIGN KEY (aprobador_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ajuste_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ajuste_detalle (líneas)
-- linea_conteo_id se rellena/valida por FK en 06_conteos.sql (la tabla
-- linea_conteo todavía no existe en este punto de la instalación).
-- -----------------------------------------------------------------------------
CREATE TABLE ajuste_detalle (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ajuste_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad_objetivo   INT NOT NULL,
  diferencia          INT NOT NULL,
  motivo_codigo       VARCHAR(40)  NULL,
  linea_conteo_id     INT UNSIGNED NULL,
  observacion         VARCHAR(255) NULL,
  dominio_id          CHAR(36)     NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ajuste_detalle_dominio_id (dominio_id),
  KEY idx_ajuste_detalle_ajuste (ajuste_id),
  KEY idx_ajuste_detalle_producto (producto_id),
  KEY idx_ajuste_detalle_motivo (motivo_codigo),
  KEY idx_ajuste_detalle_linea_conteo (linea_conteo_id),
  CONSTRAINT fk_ajuste_detalle_ajuste
    FOREIGN KEY (ajuste_id) REFERENCES ajuste (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ajuste_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_detalle_motivo
    FOREIGN KEY (motivo_codigo) REFERENCES cat_motivo_ajuste (codigo)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ajuste_detalle_objetivo CHECK (cantidad_objetivo >= 0),
  CONSTRAINT chk_ajuste_detalle_diferencia CHECK (diferencia <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '05_ajustes.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 05_ajustes.sql aplicado.' AS resultado;
