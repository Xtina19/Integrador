-- =============================================================================
-- LibroSys — Eventos
-- Archivo: 09_eventos.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- eventos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  nombre                  VARCHAR(200) NOT NULL,
  tipo                    VARCHAR(100) NOT NULL,
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE NOT NULL,
  ubicacion               VARCHAR(200) NOT NULL,
  editorial_id            INT UNSIGNED NULL,
  responsable_id          INT UNSIGNED NULL,
  estado                  ENUM('programado','personal_asignado','en_curso','finalizado','cancelado') NOT NULL DEFAULT 'programado',
  participantes_estimados INT UNSIGNED NOT NULL DEFAULT 0,
  reservas                INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_eventos_codigo (codigo),
  KEY idx_eventos_estado (estado),
  KEY idx_eventos_fechas (fecha_inicio, fecha_fin),
  CONSTRAINT fk_eventos_editorial
    FOREIGN KEY (editorial_id) REFERENCES editoriales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_eventos_responsable
    FOREIGN KEY (responsable_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_eventos_fechas
    CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- asignacion_evento (personal asignado)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignacion_evento (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  rol_evento          VARCHAR(100) NOT NULL,
  horas_asignadas     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('asignado','confirmado','completado','cancelado') NOT NULL DEFAULT 'asignado',
  observaciones       VARCHAR(255) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asignacion_evento_usuario (evento_id, usuario_id),
  KEY idx_asignacion_usuario (usuario_id),
  CONSTRAINT fk_asignacion_evento
    FOREIGN KEY (evento_id) REFERENCES eventos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asignacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_asignacion_horas
    CHECK (horas_asignadas >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- presupuestos_evento
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presupuestos_evento (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id               INT UNSIGNED NOT NULL,
  moneda_id               INT UNSIGNED NOT NULL,
  concepto                VARCHAR(150) NOT NULL,
  monto_presupuestado     DECIMAL(18,2) NOT NULL,
  monto_utilizado         DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_presupuesto_evento (evento_id),
  CONSTRAINT fk_presupuesto_evento
    FOREIGN KEY (evento_id) REFERENCES eventos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_presupuesto_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_presupuesto_montos
    CHECK (monto_presupuestado >= 0 AND monto_utilizado >= 0 AND monto_utilizado <= monto_presupuestado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
