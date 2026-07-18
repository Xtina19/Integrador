-- =============================================================================
-- LibroSys — Triggers Eventos / Facturación / Presupuesto
-- Archivo: 20_triggers_eventos.sql
-- =============================================================================

USE librosys;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_evento_gasto_after_insert$$
CREATE TRIGGER trg_evento_gasto_after_insert
AFTER INSERT ON evento_gasto
FOR EACH ROW
BEGIN
  UPDATE eventos
  SET total_gastos = total_gastos + NEW.monto,
      estado_presupuesto = CASE
        WHEN presupuesto_asignado + total_ingresos - (total_gastos + NEW.monto) <= 0 THEN 'agotado'
        ELSE 'activo'
      END
  WHERE id = NEW.evento_id;
END$$

DROP TRIGGER IF EXISTS trg_factura_evento_after_insert$$
CREATE TRIGGER trg_factura_evento_after_insert
AFTER INSERT ON factura_evento
FOR EACH ROW
BEGIN
  IF NEW.estado = 'emitida' THEN
    UPDATE eventos SET total_ingresos = total_ingresos + NEW.total WHERE id = NEW.evento_id;
    UPDATE caja_evento SET total_ventas = total_ventas + NEW.total WHERE id = NEW.caja_evento_id;
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_factura_evento_after_update$$
CREATE TRIGGER trg_factura_evento_after_update
AFTER UPDATE ON factura_evento
FOR EACH ROW
BEGIN
  IF OLD.estado = 'emitida' AND NEW.estado = 'anulada' THEN
    UPDATE eventos SET total_ingresos = total_ingresos - OLD.total WHERE id = OLD.evento_id;
    UPDATE caja_evento SET total_ventas = total_ventas - OLD.total WHERE id = OLD.caja_evento_id;
  END IF;
END$$

DELIMITER ;
