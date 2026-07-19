-- =============================================================================
-- LibroSys — Triggers
-- Archivo: 15_triggers.sql
-- Nota: Los procedimientos almacenados setean @librosys_from_proc = 1
--       para evitar doble ejecución de triggers de inventario.
-- =============================================================================

USE librosys;

DELIMITER $$

-- =============================================================================
-- AUDITORÍA AUTOMÁTICA
-- =============================================================================

DROP TRIGGER IF EXISTS trg_aud_orden_compra_insert$$
CREATE TRIGGER trg_aud_orden_compra_insert
AFTER INSERT ON orden_compra
FOR EACH ROW
BEGIN
  IF @librosys_from_proc IS NULL THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('compras', 'orden_compra', NEW.id, 'crear', CONCAT('Orden ', NEW.codigo, ' creada (trigger)'));
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_embarque_update$$
CREATE TRIGGER trg_aud_embarque_update
AFTER UPDATE ON embarque
FOR EACH ROW
BEGIN
  IF OLD.estado <> NEW.estado THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('importaciones', 'embarque', NEW.id, 'actualizar', CONCAT('Estado: ', OLD.estado, ' → ', NEW.estado));

    INSERT INTO auditoria_cambio (auditoria_id, campo, valor_anterior, valor_nuevo)
    VALUES (LAST_INSERT_ID(), 'estado', OLD.estado, NEW.estado);
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_venta_insert$$
CREATE TRIGGER trg_aud_venta_insert
AFTER INSERT ON venta
FOR EACH ROW
BEGIN
  IF @librosys_from_proc IS NULL THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
    VALUES ('ventas', 'venta', NEW.id, 'crear', NEW.usuario_id, CONCAT('Venta ', NEW.codigo, ' creada (trigger)'));
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_producto_delete$$
CREATE TRIGGER trg_aud_producto_delete
BEFORE DELETE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
  VALUES ('inventario', 'productos', OLD.id, 'eliminar', CONCAT('Producto ', OLD.codigo, ' eliminado'));

  INSERT INTO auditoria_eliminacion (auditoria_id, entidad, entidad_id, motivo, datos_eliminados, usuario_id)
  VALUES (
    LAST_INSERT_ID(), 'productos', OLD.id, 'Eliminación de producto',
    JSON_OBJECT('codigo', OLD.codigo, 'isbn', OLD.isbn, 'titulo', OLD.titulo),
    NULL
  );
END$$

-- =============================================================================
-- INVENTARIO — VENTAS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_despues_venta$$
CREATE TRIGGER trg_inventario_despues_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
  DECLARE v_almacen_id INT UNSIGNED;
  DECLARE v_usuario_id INT UNSIGNED;
  DECLARE v_codigo     VARCHAR(30);

  IF @librosys_from_proc IS NULL THEN
    SELECT v.almacen_id, v.usuario_id, v.codigo
    INTO v_almacen_id, v_usuario_id, v_codigo
    FROM venta v WHERE v.id = NEW.venta_id;

    CALL sp_actualizar_inventario(
      NEW.producto_id, v_almacen_id, -NEW.cantidad, 'venta',
      v_codigo, 'venta', v_usuario_id, 'Salida por venta (trigger)'
    );
  END IF;
END$$

-- =============================================================================
-- INVENTARIO — RECEPCIÓN DE MERCANCÍA
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_despues_recepcion$$
-- COM-DB-1.0.0 (2026-07-19):
-- Inventario por recepción lo gestiona backend/services/compras/_inventoryPort.js
-- al confirmar la recepción. No recrear trigger sobre columnas legacy
-- (usuario_id, total_items_esperados, estados pendiente/parcial/completa).

-- =============================================================================
-- IMPORTACIONES — ESTADOS DE EMBARQUE
-- =============================================================================

DROP TRIGGER IF EXISTS trg_embarque_costos_insert$$
CREATE TRIGGER trg_embarque_costos_insert
AFTER INSERT ON costos_embarque
FOR EACH ROW
BEGIN
  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costos_flete'
  WHERE e.id = NEW.embarque_id
    AND fi.etapa_importacion IN ('factura_internacional', 'embarque_registrado');
END$$

DROP TRIGGER IF EXISTS trg_costeo_libro_insert$$
CREATE TRIGGER trg_costeo_libro_insert
AFTER INSERT ON costeo_libro
FOR EACH ROW
BEGIN
  UPDATE embarque
  SET estado = 'costeado'
  WHERE id = NEW.embarque_id AND estado IN ('recibido', 'en_aduana', 'en_transito', 'registrado');

  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costeo_libro'
  WHERE e.id = NEW.embarque_id;
END$$

DROP TRIGGER IF EXISTS trg_consolidacion_embarque_insert$$
CREATE TRIGGER trg_consolidacion_embarque_insert
AFTER INSERT ON consolidacion_embarque
FOR EACH ROW
BEGIN
  DECLARE v_cajas INT UNSIGNED;

  SELECT cantidad_cajas INTO v_cajas FROM embarque WHERE id = NEW.embarque_id;

  UPDATE consolidacion
  SET total_cajas = total_cajas + COALESCE(v_cajas, 0)
  WHERE id = NEW.consolidacion_id;

  UPDATE embarque
  SET consolidacion_id = NEW.consolidacion_id,
      estado = CASE WHEN estado = 'en_transito' THEN 'en_aduana' ELSE estado END
  WHERE id = NEW.embarque_id;
END$$

-- =============================================================================
-- EVENTOS — PRESUPUESTO UTILIZADO
-- =============================================================================

DROP TRIGGER IF EXISTS trg_presupuesto_evento_update$$
CREATE TRIGGER trg_presupuesto_evento_update
BEFORE UPDATE ON presupuestos_evento
FOR EACH ROW
BEGIN
  IF NEW.monto_utilizado > NEW.monto_presupuestado THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El monto utilizado no puede superar el presupuesto asignado.';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_presupuesto_evento_after_update$$
CREATE TRIGGER trg_presupuesto_evento_after_update
AFTER UPDATE ON presupuestos_evento
FOR EACH ROW
BEGIN
  IF OLD.monto_utilizado <> NEW.monto_utilizado THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('eventos', 'presupuestos_evento', NEW.id, 'actualizar',
            CONCAT('Presupuesto utilizado: ', OLD.monto_utilizado, ' → ', NEW.monto_utilizado));

    INSERT INTO auditoria_cambio (auditoria_id, campo, valor_anterior, valor_nuevo)
    VALUES (LAST_INSERT_ID(), 'monto_utilizado', OLD.monto_utilizado, NEW.monto_utilizado);

    IF NEW.monto_utilizado >= NEW.monto_presupuestado THEN
      UPDATE eventos
      SET estado = CASE WHEN estado IN ('programado','personal_asignado') THEN 'en_curso' ELSE estado END
      WHERE id = NEW.evento_id;
    END IF;
  END IF;
END$$

-- =============================================================================
-- INVENTARIO — ESTADO DE STOCK AUTOMÁTICO
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_estado_stock$$
CREATE TRIGGER trg_inventario_estado_stock
BEFORE UPDATE ON inventario
FOR EACH ROW
BEGIN
  SET NEW.estado_stock = CASE
    WHEN NEW.stock = 0 THEN 'agotado'
    WHEN NEW.stock <= NEW.stock_minimo THEN 'bajo'
    ELSE 'normal'
  END;
END$$

DELIMITER ;

-- Variable de sesión usada por procedimientos almacenados
-- SET @librosys_from_proc = 1;  -- dentro de SPs antes de operaciones
-- SET @librosys_from_proc = NULL; -- al finalizar
