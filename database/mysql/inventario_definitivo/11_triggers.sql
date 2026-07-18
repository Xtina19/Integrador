-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 11_triggers.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Triggers de valor para el módulo Inventario.
--
-- REGLA DE ORO: ningún trigger de este archivo muta `inventario.stock`. Todas
-- las mutaciones de stock ya pasan por `sp_inv_registrar_movimiento` (llamado
-- directa o indirectamente por los procedimientos de 10_procedimientos.sql).
-- Duplicar esa lógica en un trigger aplicaría el efecto dos veces.
--
-- Contenido:
--   1. trg_inventario_estado_stock_insert / trg_inventario_estado_stock
--      (BEFORE INSERT/UPDATE en `inventario`) — deriva `estado_stock` a partir
--      de `stock` y `stock_minimo`, espejo de fn_inv_estado_stock().
--   2. trg_ajuste_audit_estado, trg_transferencia_audit_estado,
--      trg_descarte_audit_estado, trg_conteo_audit_estado — auditoría ligera
--      (AFTER UPDATE) que registra cambios de estado en `auditoria_inventario`
--      sin tocar stock ni disparar procedimientos.
-- =============================================================================

USE librosys;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- inventario.estado_stock — se recrea idéntica en semántica a la definida en
-- 15_triggers.sql (BEFORE UPDATE), y se añade su contraparte BEFORE INSERT
-- porque sp_inv_registrar_movimiento crea filas nuevas vía
-- `INSERT IGNORE INTO inventario (...)` antes del UPDATE de saldo.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_inventario_estado_stock_insert$$
CREATE TRIGGER trg_inventario_estado_stock_insert
BEFORE INSERT ON inventario
FOR EACH ROW
BEGIN
  SET NEW.estado_stock = fn_inv_estado_stock(NEW.stock, NEW.stock_minimo);
END$$

DROP TRIGGER IF EXISTS trg_inventario_estado_stock$$
CREATE TRIGGER trg_inventario_estado_stock
BEFORE UPDATE ON inventario
FOR EACH ROW
BEGIN
  SET NEW.estado_stock = fn_inv_estado_stock(NEW.stock, NEW.stock_minimo);
END$$

-- -----------------------------------------------------------------------------
-- trg_ajuste_audit_estado
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ajuste_audit_estado$$
CREATE TRIGGER trg_ajuste_audit_estado
AFTER UPDATE ON ajuste
FOR EACH ROW
BEGIN
  IF NEW.estado <> OLD.estado THEN
    INSERT INTO auditoria_inventario (
      tipo_accion, usuario_id, documento_tipo, documento_id,
      valor_antes, valor_despues, detalle, dominio_id
    ) VALUES (
      CASE NEW.estado
        WHEN 'aplicado'   THEN 'aplicacion'
        WHEN 'aprobado'   THEN 'aprobacion'
        WHEN 'rechazado'  THEN 'rechazo'
        WHEN 'cancelado'  THEN 'cancelacion'
        WHEN 'revertido'  THEN 'reversion'
        ELSE 'movimiento'
      END,
      COALESCE(NEW.aprobador_id, NEW.solicitante_id),
      'ajuste', NEW.id,
      JSON_OBJECT('estado', OLD.estado, 'version', OLD.version),
      JSON_OBJECT('estado', NEW.estado, 'version', NEW.version),
      CONCAT('Ajuste ', NEW.codigo, ': ', OLD.estado, ' -> ', NEW.estado),
      fn_inv_uuid()
    );
  END IF;
END$$

-- -----------------------------------------------------------------------------
-- trg_transferencia_audit_estado
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_transferencia_audit_estado$$
CREATE TRIGGER trg_transferencia_audit_estado
AFTER UPDATE ON transferencia
FOR EACH ROW
BEGIN
  IF NEW.estado <> OLD.estado THEN
    INSERT INTO auditoria_inventario (
      tipo_accion, usuario_id, documento_tipo, documento_id,
      valor_antes, valor_despues, detalle, dominio_id
    ) VALUES (
      CASE NEW.estado
        WHEN 'recibida'          THEN 'aplicacion'
        WHEN 'recibida_parcial'  THEN 'aplicacion'
        WHEN 'cancelada'         THEN 'cancelacion'
        ELSE 'movimiento'
      END,
      COALESCE(NEW.usuario_aprueba_id, NEW.usuario_solicita_id),
      'transferencia', NEW.id,
      JSON_OBJECT('estado', OLD.estado, 'version', OLD.version),
      JSON_OBJECT('estado', NEW.estado, 'version', NEW.version),
      CONCAT('Transferencia ', NEW.codigo, ': ', OLD.estado, ' -> ', NEW.estado),
      fn_inv_uuid()
    );
  END IF;
END$$

-- -----------------------------------------------------------------------------
-- trg_descarte_audit_estado
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_descarte_audit_estado$$
CREATE TRIGGER trg_descarte_audit_estado
AFTER UPDATE ON descarte
FOR EACH ROW
BEGIN
  IF NEW.estado <> OLD.estado THEN
    INSERT INTO auditoria_inventario (
      tipo_accion, usuario_id, documento_tipo, documento_id,
      valor_antes, valor_despues, detalle, dominio_id
    ) VALUES (
      CASE NEW.estado
        WHEN 'aplicado'   THEN 'aplicacion'
        WHEN 'aprobado'   THEN 'aprobacion'
        WHEN 'rechazado'  THEN 'rechazo'
        WHEN 'cancelado'  THEN 'cancelacion'
        WHEN 'revertido'  THEN 'reversion'
        ELSE 'movimiento'
      END,
      COALESCE(NEW.aprobador_id, NEW.solicitante_id),
      'descarte', NEW.id,
      JSON_OBJECT('estado', OLD.estado, 'version', OLD.version),
      JSON_OBJECT('estado', NEW.estado, 'version', NEW.version),
      CONCAT('Descarte ', NEW.codigo, ': ', OLD.estado, ' -> ', NEW.estado),
      fn_inv_uuid()
    );
  END IF;
END$$

-- -----------------------------------------------------------------------------
-- trg_conteo_audit_estado
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_conteo_audit_estado$$
CREATE TRIGGER trg_conteo_audit_estado
AFTER UPDATE ON conteo_fisico
FOR EACH ROW
BEGIN
  IF NEW.estado <> OLD.estado THEN
    INSERT INTO auditoria_inventario (
      tipo_accion, usuario_id, documento_tipo, documento_id,
      valor_antes, valor_despues, detalle, dominio_id
    ) VALUES (
      CASE NEW.estado
        WHEN 'cerrado'    THEN 'aplicacion'
        WHEN 'cancelado'  THEN 'cancelacion'
        ELSE 'movimiento'
      END,
      NEW.responsable_id,
      'conteo_fisico', NEW.id,
      JSON_OBJECT('estado', OLD.estado, 'version', OLD.version),
      JSON_OBJECT('estado', NEW.estado, 'version', NEW.version),
      CONCAT('Conteo ', NEW.codigo, ': ', OLD.estado, ' -> ', NEW.estado),
      fn_inv_uuid()
    );

    INSERT INTO auditoria_conteo_fisico (conteo_id, accion, usuario_id, resultado, detalle, dominio_id)
    VALUES (
      NEW.id, CONCAT('estado:', OLD.estado, '->', NEW.estado), NEW.responsable_id, 'OK',
      CONCAT('Transición de estado registrada por trigger para conteo ', NEW.codigo),
      fn_inv_uuid()
    );
  END IF;
END$$

DELIMITER ;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '11_triggers.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 11_triggers.sql aplicado.' AS resultado;
