-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 09_funciones.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Funciones determinísticas/utilitarias usadas por los procedimientos y
-- vistas del paquete.
-- =============================================================================

USE librosys;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- fn_inv_estado_stock
-- Espejo SQL de la regla aplicada por trg_inventario_estado_stock.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_inv_estado_stock$$
CREATE FUNCTION fn_inv_estado_stock(
  p_stock   INT,
  p_minimo  INT
) RETURNS ENUM('normal','bajo','agotado')
    DETERMINISTIC
    NO SQL
BEGIN
  RETURN CASE
    WHEN p_stock <= 0 THEN 'agotado'
    WHEN p_stock <= p_minimo THEN 'bajo'
    ELSE 'normal'
  END;
END$$

-- -----------------------------------------------------------------------------
-- fn_inv_sentido_movimiento
-- Espejo SQL de sentidoDe() en TipoMovimiento.ts. Para 'ajuste' y
-- 'compensacion' el sentido depende del signo de la operación y no puede
-- inferirse solo del tipo; se devuelve NULL para que el llamador decida
-- (igual que sentidoDe() lanza en TypeScript para esos dos casos).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_inv_sentido_movimiento$$
CREATE FUNCTION fn_inv_sentido_movimiento(
  p_tipo_movimiento VARCHAR(30)
) RETURNS ENUM('entrada','salida')
    DETERMINISTIC
    NO SQL
BEGIN
  RETURN CASE p_tipo_movimiento
    WHEN 'transferencia_entrada' THEN 'entrada'
    WHEN 'recepcion'             THEN 'entrada'
    WHEN 'devolucion_entrada'    THEN 'entrada'
    WHEN 'transferencia_salida'  THEN 'salida'
    WHEN 'descarte'              THEN 'salida'
    WHEN 'venta'                 THEN 'salida'
    ELSE NULL
  END;
END$$

-- -----------------------------------------------------------------------------
-- fn_inv_valor_existencia
-- Valor monetario de la existencia de un producto en un almacén
-- (stock * costo unitario, estándar DECIMAL(18,2)).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_inv_valor_existencia$$
CREATE FUNCTION fn_inv_valor_existencia(
  p_producto_id INT UNSIGNED,
  p_almacen_id  INT UNSIGNED
) RETURNS DECIMAL(18,2)
    READS SQL DATA
BEGIN
  DECLARE v_valor DECIMAL(18,2) DEFAULT 0;

  SELECT COALESCE(i.stock * p.costo, 0) INTO v_valor
  FROM inventario i
  JOIN productos p ON p.id = i.producto_id
  WHERE i.producto_id = p_producto_id AND i.almacen_id = p_almacen_id
  LIMIT 1;

  RETURN COALESCE(v_valor, 0);
END$$

-- -----------------------------------------------------------------------------
-- fn_inv_uuid
-- Genera un identificador de dominio compatible con IIdGenerator (UUID v4
-- vía UUID() nativo de MySQL 8).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_inv_uuid$$
CREATE FUNCTION fn_inv_uuid()
  RETURNS CHAR(36)
  NOT DETERMINISTIC
  NO SQL
BEGIN
  RETURN UUID();
END$$

DELIMITER ;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '09_funciones.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 09_funciones.sql aplicado.' AS resultado;
