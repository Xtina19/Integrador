-- =============================================================================
-- LibroSys — Descarte (dominio Inventario DDD)
-- Archivo: 23_descarte_dominio.sql
--
-- NO modifica tablas existentes.
-- Cabecera operativa + detalle + evidencias + aprobación del caso Crear Descarte.
-- Crear descarte NO mueve stock (Engine solo al Aplicar).
--
-- NOTA: la cabecera se llama `descarte` (no `descarte_sesion`) para instalaciones
-- nuevas. Instalaciones existentes con la tabla legada `descarte_sesion` deben
-- ejecutar 24_descarte_documento.sql, que renombra y amplía el esquema.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS descarte (
  id                    CHAR(36)     NOT NULL,
  codigo                VARCHAR(40)  NOT NULL,
  fecha                 DATE         NOT NULL,
  sucursal_id           VARCHAR(64)  NOT NULL,
  almacen_id            VARCHAR(64)  NOT NULL,
  responsable_id        VARCHAR(64)  NOT NULL,
  responsable_nombre    VARCHAR(150) NULL,
  estado                ENUM('borrador','solicitado','aprobado','rechazado','aplicado','cancelado','revertido') NOT NULL DEFAULT 'borrador',
  motivo_codigo         VARCHAR(40)  NOT NULL,
  motivo_descripcion    VARCHAR(255) NULL,
  observaciones         TEXT         NULL,
  requiere_aprobacion   TINYINT(1)   NOT NULL DEFAULT 1,
  version               INT UNSIGNED NOT NULL DEFAULT 1,
  created_by            VARCHAR(64)  NOT NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_descarte_codigo (codigo),
  KEY idx_descarte_almacen_estado (almacen_id, estado),
  KEY idx_descarte_sucursal (sucursal_id),
  KEY idx_descarte_motivo (motivo_codigo),
  CONSTRAINT chk_descarte_version CHECK (version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS descarte_detalle (
  id                    CHAR(36)     NOT NULL,
  descarte_id           CHAR(36)     NOT NULL,
  producto_id           VARCHAR(64)  NOT NULL,
  isbn                  VARCHAR(32)  NULL,
  titulo                VARCHAR(255) NULL,
  existencia_actual     INT          NOT NULL DEFAULT 0,
  cantidad              INT          NOT NULL,
  costo                 DECIMAL(18,4) NOT NULL DEFAULT 0,
  motivo_especifico     VARCHAR(120) NULL,
  observacion           TEXT         NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_descarte_detalle_descarte (descarte_id),
  KEY idx_descarte_detalle_producto (producto_id),
  CONSTRAINT fk_descarte_detalle_descarte
    FOREIGN KEY (descarte_id) REFERENCES descarte (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_descarte_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_descarte_detalle_stock CHECK (cantidad <= existencia_actual)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS descarte_evidencia (
  id                    CHAR(36)     NOT NULL,
  descarte_id           CHAR(36)     NOT NULL,
  tipo                  ENUM('fotografia','pdf','acta','documento','comentario') NOT NULL,
  nombre_archivo        VARCHAR(255) NULL,
  url_referencia        VARCHAR(500) NULL,
  comentario            TEXT         NULL,
  created_by            VARCHAR(64)  NOT NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_descarte_evidencia_descarte (descarte_id),
  CONSTRAINT fk_descarte_evidencia_descarte
    FOREIGN KEY (descarte_id) REFERENCES descarte (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS descarte_aprobacion (
  id                    CHAR(36)     NOT NULL,
  descarte_id           CHAR(36)     NOT NULL,
  requiere_aprobacion   TINYINT(1)   NOT NULL DEFAULT 1,
  solicitante_id        VARCHAR(64)  NOT NULL,
  solicitante_nombre    VARCHAR(150) NULL,
  supervisor_id         VARCHAR(64)  NULL,
  supervisor_nombre     VARCHAR(150) NULL,
  fecha_solicitud       DATETIME     NULL,
  fecha_resolucion      DATETIME     NULL,
  estado                ENUM('borrador','solicitado','aprobado','rechazado','aplicado','revertido') NOT NULL DEFAULT 'borrador',
  observacion           TEXT         NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_descarte_aprobacion_descarte (descarte_id),
  CONSTRAINT fk_descarte_aprobacion_descarte
    FOREIGN KEY (descarte_id) REFERENCES descarte (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
