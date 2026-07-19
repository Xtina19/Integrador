-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 03_existencias_movimientos.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- ALTERa (no recrea) las tablas núcleo `productos`, `inventario` (Existencia),
-- `almacenes` y `movimiento_inventario` para alinearlas al dominio DDD:
--   - productos.costo  -> DECIMAL(18,4)  (costo unitario, estándar ERP)
--   - productos.precio -> DECIMAL(18,2)  (precio venta, estándar ERP)
--   - inventario (Existencia): version, bloqueado_por_conteo,
--     conteo_bloqueante_id, dominio_id.
--   - almacenes: espejo de bloqueo a nivel de almacén (usado por los
--     Application Services vía IAlmacenRepository.updateBloqueo).
--   - movimiento_inventario: ENUM de tipos alineado a TipoMovimiento del
--     dominio, saldo_anterior, idempotency_key, motivo_codigo,
--     movimiento_compensa_id, dominio_id, sentido y documento_tipo/id/linea.
--
-- NOTA DE IDEMPOTENCIA: MySQL 8.0 NO admite `IF NOT EXISTS` en las cláusulas
-- ADD COLUMN / ADD INDEX / ADD KEY de ALTER TABLE (a diferencia de MariaDB).
-- Este paquete está diseñado para ejecutarse UNA sola vez, en orden, sobre la
-- base creada por install_all.sql (01-21) tras 01_cleanup_redundante.sql; por
-- eso los ALTER de este archivo son statements simples. Únicamente las FK
-- (que sí podrían chocar si el paquete se reintenta) se protegen con un
-- procedimiento guardián que consulta information_schema.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- 1) productos — estándar monetario ERP
-- -----------------------------------------------------------------------------
ALTER TABLE productos
  MODIFY COLUMN costo  DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  MODIFY COLUMN precio DECIMAL(18,2) NOT NULL DEFAULT 0.00;

-- -----------------------------------------------------------------------------
-- 2) inventario (Existencia) — concurrencia optimista + bloqueo por conteo
-- -----------------------------------------------------------------------------
ALTER TABLE inventario
  ADD COLUMN version              INT UNSIGNED NOT NULL DEFAULT 1 AFTER estado_stock,
  ADD COLUMN bloqueado_por_conteo TINYINT(1)   NOT NULL DEFAULT 0 AFTER version,
  ADD COLUMN conteo_bloqueante_id CHAR(36)     NULL AFTER bloqueado_por_conteo,
  ADD COLUMN dominio_id           CHAR(36)     NULL AFTER conteo_bloqueante_id,
  ADD UNIQUE KEY uk_inventario_dominio_id (dominio_id),
  ADD KEY idx_inventario_bloqueado (bloqueado_por_conteo);

-- -----------------------------------------------------------------------------
-- 3) almacenes — espejo de bloqueo a nivel de almacén (whole-warehouse lock)
-- -----------------------------------------------------------------------------
ALTER TABLE almacenes
  ADD COLUMN bloqueado_por_conteo TINYINT(1) NOT NULL DEFAULT 0 AFTER estado,
  ADD COLUMN conteo_bloqueante_id CHAR(36)   NULL AFTER bloqueado_por_conteo;

-- -----------------------------------------------------------------------------
-- 4) movimiento_inventario — migración de datos ANTES de estrechar el ENUM
--    (los tipos legado 'entrada'/'salida' no existen en TipoMovimiento del
--    dominio; se traducen a su equivalente semántico más cercano).
-- -----------------------------------------------------------------------------
-- Mapeo semántico del ENUM legado → dominio TipoMovimiento:
--   entrada → recepcion (ingreso documental genérico)
--   salida  → venta     (egreso operativo más cercano; no inventar un tipo fantasma)
UPDATE movimiento_inventario SET tipo_movimiento = 'recepcion' WHERE tipo_movimiento = 'entrada';
UPDATE movimiento_inventario SET tipo_movimiento = 'venta'     WHERE tipo_movimiento = 'salida';

-- Columnas nuevas (nullable primero, para poder respaldar datos históricos)
ALTER TABLE movimiento_inventario
  ADD COLUMN saldo_anterior         INT          NULL AFTER cantidad,
  ADD COLUMN idempotency_key        VARCHAR(100) NULL AFTER fecha_movimiento,
  ADD COLUMN motivo_codigo          VARCHAR(40)  NULL AFTER idempotency_key,
  ADD COLUMN movimiento_compensa_id INT UNSIGNED NULL AFTER motivo_codigo,
  ADD COLUMN dominio_id             CHAR(36)     NULL AFTER movimiento_compensa_id,
  ADD COLUMN sentido                ENUM('entrada','salida') NULL AFTER dominio_id,
  ADD COLUMN documento_tipo         VARCHAR(40)  NULL AFTER referencia_tipo,
  ADD COLUMN documento_id           VARCHAR(64)  NULL AFTER documento_tipo,
  ADD COLUMN documento_linea_id     VARCHAR(64)  NULL AFTER documento_id;

-- Respaldo de histórico: `cantidad` almacenaba el delta CON signo (p. ej.
-- sp_actualizar_inventario recibía -cantidad para ventas). El dominio modela
-- Cantidad como entero positivo + `sentido` explícito, así que se infiere el
-- sentido y se recalcula saldo_anterior ANTES de convertir cantidad a valor
-- absoluto.
UPDATE movimiento_inventario
   SET sentido = IF(cantidad >= 0, 'entrada', 'salida')
 WHERE sentido IS NULL;

UPDATE movimiento_inventario
   SET saldo_anterior = saldo_posterior - cantidad
 WHERE saldo_anterior IS NULL;

UPDATE movimiento_inventario
   SET cantidad = ABS(cantidad)
 WHERE cantidad < 0;

UPDATE movimiento_inventario
   SET documento_tipo = referencia_tipo,
       documento_id   = referencia
 WHERE documento_tipo IS NULL;

-- Ahora sí, estrechar el ENUM al vocabulario exclusivo del dominio. Todas las
-- filas existentes ya tienen `sentido` respaldado por el UPDATE anterior, así
-- que se puede exigir NOT NULL sin necesidad de un DEFAULT permanente.
ALTER TABLE movimiento_inventario
  MODIFY COLUMN tipo_movimiento ENUM(
    'transferencia_salida','transferencia_entrada','descarte','ajuste',
    'recepcion','venta','devolucion_entrada','compensacion'
  ) NOT NULL,
  MODIFY COLUMN saldo_anterior INT NOT NULL DEFAULT 0,
  MODIFY COLUMN sentido ENUM('entrada','salida') NOT NULL;

-- cantidad pasa a ser magnitud positiva (unsigned) por convención de dominio.
ALTER TABLE movimiento_inventario
  DROP CHECK chk_movimiento_cantidad;

ALTER TABLE movimiento_inventario
  MODIFY COLUMN cantidad INT UNSIGNED NOT NULL;

ALTER TABLE movimiento_inventario
  ADD CONSTRAINT chk_movimiento_cantidad_positiva CHECK (cantidad > 0);

-- Índices/llaves únicas nuevas (varias filas NULL no colisionan en UNIQUE KEY)
ALTER TABLE movimiento_inventario
  ADD UNIQUE KEY uk_movimiento_idempotency (idempotency_key),
  ADD UNIQUE KEY uk_movimiento_dominio_id (dominio_id),
  ADD KEY idx_movimiento_documento (documento_tipo, documento_id),
  ADD KEY idx_movimiento_motivo (motivo_codigo);

-- FK auto-referenciada (movimiento_compensa_id) — se protege con un
-- procedimiento guardián porque `ADD CONSTRAINT ... FOREIGN KEY` no admite
-- `IF NOT EXISTS` en MySQL 8, y este archivo sí podría re-ejecutarse en un
-- entorno donde solo esta sección falló previamente.
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_inv_migrar_movimiento_fk$$
CREATE PROCEDURE sp_inv_migrar_movimiento_fk()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'movimiento_inventario'
      AND constraint_name = 'fk_movimiento_compensa'
  ) THEN
    ALTER TABLE movimiento_inventario
      ADD CONSTRAINT fk_movimiento_compensa
        FOREIGN KEY (movimiento_compensa_id) REFERENCES movimiento_inventario (id)
        ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END$$

DELIMITER ;

CALL sp_inv_migrar_movimiento_fk();
DROP PROCEDURE IF EXISTS sp_inv_migrar_movimiento_fk;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '03_existencias_movimientos.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 03_existencias_movimientos.sql aplicado.' AS resultado;
