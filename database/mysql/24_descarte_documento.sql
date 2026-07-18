-- =============================================================================
-- ** DEPRECATED (INV-DB-1.0.0, 2026-07-18) **
-- Reemplazado por database/mysql/inventario_definitivo/ (ver 07_descartes.sql,
-- que ya modela conteo_origen_id / documento_origen_tipo/id sobre la tabla
-- `descarte` definitiva). NO ejecutar junto al paquete definitivo. Se
-- conserva únicamente como referencia histórica; copia intacta en
-- database/mysql/archive/.
-- =============================================================================

-- =============================================================================
-- LibroSys — Descarte como documento de origen (dominio Inventario DDD)
-- Archivo: 24_descarte_documento.sql
-- Ejecutar DESPUÉS de 23_descarte_dominio.sql
--
-- 1) Migra instalaciones existentes que aún tengan la tabla legada
--    `descarte_sesion` (nombre usado antes de este cierre de módulo),
--    renombrándola a `descarte`. En instalaciones nuevas (23 ya crea
--    `descarte` directamente) este paso es un no-op seguro.
-- 2) Amplía `descarte` con referencias opcionales al documento de origen
--    (conteo, ajuste, transferencia, movimiento, kardex) para trazabilidad
--    cuando el descarte nace regularizando una diferencia de otro caso de uso.
-- 3) Agrega `fase` como etiqueta de flujo operativo (espejo de
--    `conteo_fisico_sesion.fase`), independiente del `estado` transaccional.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- 1) Migración idempotente: descarte_sesion -> descarte
-- -----------------------------------------------------------------------------
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migrar_descarte_sesion$$
CREATE PROCEDURE sp_migrar_descarte_sesion()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'descarte_sesion'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'descarte'
  ) THEN
    RENAME TABLE descarte_sesion TO descarte;
  END IF;
END$$

DELIMITER ;

CALL sp_migrar_descarte_sesion();
DROP PROCEDURE IF EXISTS sp_migrar_descarte_sesion;

-- -----------------------------------------------------------------------------
-- 2) Columnas de documento de origen + fase (idempotente vía procedimiento,
--    ya que MySQL no soporta ADD COLUMN IF NOT EXISTS antes de 8.0.29).
-- -----------------------------------------------------------------------------
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_ampliar_descarte_documento$$
CREATE PROCEDURE sp_ampliar_descarte_documento()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'descarte' AND column_name = 'fase'
  ) THEN
    ALTER TABLE descarte
      ADD COLUMN fase VARCHAR(40) NOT NULL DEFAULT 'Crear' AFTER estado;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'descarte' AND column_name = 'conteo_origen_id'
  ) THEN
    ALTER TABLE descarte
      ADD COLUMN conteo_origen_id       CHAR(36)    NULL AFTER motivo_descripcion,
      ADD COLUMN ajuste_origen_id       VARCHAR(64) NULL AFTER conteo_origen_id,
      ADD COLUMN transferencia_origen_id VARCHAR(64) NULL AFTER ajuste_origen_id,
      ADD COLUMN movimiento_origen_id   VARCHAR(64) NULL AFTER transferencia_origen_id,
      ADD COLUMN kardex_origen_id       VARCHAR(64) NULL AFTER movimiento_origen_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'descarte' AND index_name = 'idx_descarte_conteo_origen'
  ) THEN
    ALTER TABLE descarte
      ADD KEY idx_descarte_conteo_origen (conteo_origen_id),
      ADD KEY idx_descarte_ajuste_origen (ajuste_origen_id),
      ADD KEY idx_descarte_transferencia_origen (transferencia_origen_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'descarte' AND constraint_name = 'fk_descarte_conteo_origen'
  ) THEN
    ALTER TABLE descarte
      ADD CONSTRAINT fk_descarte_conteo_origen
        FOREIGN KEY (conteo_origen_id) REFERENCES conteo_fisico_sesion (id)
        ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END$$

DELIMITER ;

CALL sp_ampliar_descarte_documento();
DROP PROCEDURE IF EXISTS sp_ampliar_descarte_documento;

-- NOTA: `ajuste_origen_id`, `transferencia_origen_id`, `movimiento_origen_id` y
-- `kardex_origen_id` son referencias lógicas (sin FK física) porque los
-- agregados Ajuste/Transferencia y el Kardex del dominio DDD viven en el
-- almacenamiento in-memory/durable del backend (ver
-- backend/src/modules/inventario), no en tablas relacionales propias en este
-- esquema. `conteo_origen_id` sí referencia `conteo_fisico_sesion` porque esa
-- tabla existe desde 22_conteo_fisico_dominio.sql.
