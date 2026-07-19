-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 13_integridad_fase8.sql
-- Versión: COM-DB-1.0.1  |  FASE 8
--
-- CHECK adicionales sin alterar FKs del bridge Importaciones
-- (factura_internacional_id / embarque_id en recepcion).
-- Idempotente vía information_schema.
-- =============================================================================

USE librosys;

DELIMITER $$

DROP PROCEDURE IF EXISTS compras_add_check_if_missing$$
CREATE PROCEDURE compras_add_check_if_missing(
  IN p_table VARCHAR(64),
  IN p_name  VARCHAR(64),
  IN p_expr  VARCHAR(512)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table
    AND CONSTRAINT_NAME = p_name
    AND CONSTRAINT_TYPE = 'CHECK';

  IF v_count = 0 THEN
    SET @sql = CONCAT(
      'ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_name, '` CHECK (', p_expr, ')'
    );
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

CALL compras_add_check_if_missing('orden_compra', 'chk_orden_compra_tasa', 'tasa_cambio > 0');
CALL compras_add_check_if_missing('factura_proveedor', 'chk_factura_proveedor_tasa', 'tasa_cambio > 0');
CALL compras_add_check_if_missing('numeracion_documentos', 'chk_numeracion_anio', 'anio >= 2000 AND anio <= 2100');
CALL compras_add_check_if_missing('numeracion_documentos', 'chk_numeracion_ultimo', 'ultimo_numero >= 0');

-- dias_credito ya es INT UNSIGNED (>=0); CHECK explícito por claridad ERP
CALL compras_add_check_if_missing('condiciones_pago', 'chk_condiciones_dias', 'dias_credito >= 0');

DROP PROCEDURE IF EXISTS compras_add_check_if_missing;

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.1', '13_integridad_fase8.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.1 :: 13_integridad_fase8.sql aplicado.' AS resultado;
