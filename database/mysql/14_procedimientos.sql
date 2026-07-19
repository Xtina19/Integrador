-- =============================================================================
-- LibroSys — Procedimientos almacenados
-- Archivo: 14_procedimientos.sql
-- =============================================================================

USE librosys;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- sp_actualizar_inventario
-- Actualiza stock y registra movimiento de kardex
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_actualizar_inventario$$
CREATE PROCEDURE sp_actualizar_inventario(
  IN p_producto_id      INT UNSIGNED,
  IN p_almacen_id     INT UNSIGNED,
  IN p_cantidad       INT,
  IN p_tipo_movimiento ENUM('entrada','salida','ajuste','transferencia_entrada','transferencia_salida','venta','recepcion'),
  IN p_referencia     VARCHAR(50),
  IN p_referencia_tipo VARCHAR(50),
  IN p_usuario_id     INT UNSIGNED,
  IN p_observaciones  VARCHAR(255)
)
BEGIN
  DECLARE v_stock_actual INT DEFAULT 0;
  DECLARE v_stock_nuevo  INT DEFAULT 0;
  DECLARE v_minimo       INT DEFAULT 10;

  START TRANSACTION;

  SELECT stock, stock_minimo INTO v_stock_actual, v_minimo
  FROM inventario
  WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id
  FOR UPDATE;

  IF v_stock_actual IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registro de inventario no encontrado.';
  END IF;

  SET v_stock_nuevo = v_stock_actual + p_cantidad;

  IF v_stock_nuevo < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para la operación.';
  END IF;

  UPDATE inventario
  SET stock = v_stock_nuevo,
      estado_stock = CASE
        WHEN v_stock_nuevo = 0 THEN 'agotado'
        WHEN v_stock_nuevo <= v_minimo THEN 'bajo'
        ELSE 'normal'
      END
  WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id;

  INSERT INTO movimiento_inventario (
    producto_id, almacen_id, usuario_id, tipo_movimiento,
    cantidad, saldo_posterior, referencia, referencia_tipo, observaciones
  ) VALUES (
    p_producto_id, p_almacen_id, p_usuario_id, p_tipo_movimiento,
    p_cantidad, v_stock_nuevo, p_referencia, p_referencia_tipo, p_observaciones
  );

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_movimiento
-- Wrapper simplificado para movimientos
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_movimiento$$
CREATE PROCEDURE sp_registrar_movimiento(
  IN p_producto_id      INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_cantidad         INT,
  IN p_tipo_movimiento  VARCHAR(30),
  IN p_referencia       VARCHAR(50),
  IN p_usuario_id       INT UNSIGNED
)
BEGIN
  CALL sp_actualizar_inventario(
    p_producto_id, p_almacen_id, p_cantidad,
    p_tipo_movimiento, p_referencia, 'manual', p_usuario_id, 'Movimiento manual'
  );
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_compra — ELIMINADO FASE 7
-- Fuente de verdad: POST /api/compras/ordenes (numeracionDocumentos).
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_compra$$
CREATE PROCEDURE sp_registrar_compra()
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'DEPRECATED: usar POST /api/compras/ordenes (COM-DB FASE 7).';
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_factura_internacional
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_factura_internacional$$
CREATE PROCEDURE sp_registrar_factura_internacional(
  IN p_codigo           VARCHAR(30),
  IN p_orden_compra_id  INT UNSIGNED,
  IN p_fecha_factura    DATE,
  IN p_usuario_id       INT UNSIGNED,
  OUT p_factura_id      INT UNSIGNED
)
BEGIN
  DECLARE v_proveedor_id INT UNSIGNED;
  DECLARE v_moneda_id    INT UNSIGNED;
  DECLARE v_monto        DECIMAL(18,2);
  DECLARE v_tipo         VARCHAR(20);

  SELECT proveedor_id, moneda_id, total, tipo_compra
  INTO v_proveedor_id, v_moneda_id, v_monto, v_tipo
  FROM orden_compra
  WHERE id = p_orden_compra_id;

  IF v_tipo <> 'internacional' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La orden debe ser de tipo internacional.';
  END IF;

  START TRANSACTION;

  INSERT INTO factura_internacional (
    codigo, orden_compra_id, proveedor_id, moneda_id,
    fecha_factura, monto, estado_pago, etapa_importacion
  ) VALUES (
    p_codigo, p_orden_compra_id, v_proveedor_id, v_moneda_id,
    p_fecha_factura, v_monto, 'pendiente', 'factura_internacional'
  );

  SET p_factura_id = LAST_INSERT_ID();

  UPDATE orden_compra SET estado = 'aprobada' WHERE id = p_orden_compra_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'factura_internacional', p_factura_id, 'crear', p_usuario_id,
          CONCAT('Factura internacional ', p_codigo, ' generada'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_embarque
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_embarque$$
CREATE PROCEDURE sp_registrar_embarque(
  IN p_codigo                   VARCHAR(30),
  IN p_factura_internacional_id INT UNSIGNED,
  IN p_tipo_transporte          ENUM('maritimo','aereo','courier'),
  IN p_origen                   VARCHAR(150),
  IN p_destino                  VARCHAR(150),
  IN p_fecha_salida             DATE,
  IN p_fecha_llegada            DATE,
  IN p_cantidad_cajas           INT UNSIGNED,
  IN p_usuario_id               INT UNSIGNED,
  IN p_costos_json              JSON,
  OUT p_embarque_id             INT UNSIGNED
)
BEGIN
  DECLARE v_orden_id     INT UNSIGNED;
  DECLARE v_proveedor_id INT UNSIGNED;
  DECLARE v_moneda_dop   INT UNSIGNED;

  SELECT orden_compra_id, proveedor_id
  INTO v_orden_id, v_proveedor_id
  FROM factura_internacional
  WHERE id = p_factura_internacional_id;

  SELECT id INTO v_moneda_dop FROM monedas WHERE codigo = 'DOP' LIMIT 1;

  START TRANSACTION;

  INSERT INTO embarque (
    codigo, factura_internacional_id, orden_compra_id, proveedor_id,
    tipo_transporte, origen, destino, fecha_salida, fecha_llegada_estimada,
    cantidad_cajas, estado
  ) VALUES (
    p_codigo, p_factura_internacional_id, v_orden_id, v_proveedor_id,
    p_tipo_transporte, p_origen, p_destino, p_fecha_salida, p_fecha_llegada,
    p_cantidad_cajas, 'registrado'
  );

  SET p_embarque_id = LAST_INSERT_ID();

  INSERT INTO costos_embarque (
    embarque_id, moneda_id,
    flete_internacional, seguro, aduana, transporte_local,
    gastos_portuarios, manipulacion, otros
  ) VALUES (
    p_embarque_id, v_moneda_dop,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.flete_internacional')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.seguro')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.aduana')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.transporte_local')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.gastos_portuarios')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.manipulacion')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.otros')), 0)
  );

  UPDATE factura_internacional
  SET etapa_importacion = 'embarque_registrado'
  WHERE id = p_factura_internacional_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'embarque', p_embarque_id, 'crear', p_usuario_id,
          CONCAT('Embarque ', p_codigo, ' registrado'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_recepcion — ELIMINADO FASE 7
-- Fuente de verdad: POST /api/compras/recepciones (numeracionDocumentos).
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_recepcion$$
CREATE PROCEDURE sp_registrar_recepcion()
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'DEPRECATED: usar POST /api/compras/recepciones (COM-DB FASE 7).';
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_venta
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_venta$$
CREATE PROCEDURE sp_registrar_venta(
  IN p_codigo           VARCHAR(30),
  IN p_sucursal_id      INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_moneda_id        INT UNSIGNED,
  IN p_cliente_nombre   VARCHAR(200),
  IN p_detalle_json     JSON,
  OUT p_venta_id        INT UNSIGNED
)
BEGIN
  DECLARE v_subtotal  DECIMAL(18,2) DEFAULT 0;
  DECLARE v_idx       INT DEFAULT 0;
  DECLARE v_len       INT DEFAULT 0;
  DECLARE v_producto  INT UNSIGNED;
  DECLARE v_cantidad  INT UNSIGNED;
  DECLARE v_precio    DECIMAL(18,2);

  SET @librosys_from_proc = 1;
  START TRANSACTION;

  SET v_len = JSON_LENGTH(p_detalle_json);
  WHILE v_idx < v_len DO
    SET v_subtotal = v_subtotal + (
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad'))) *
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')))
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO venta (
    codigo, sucursal_id, almacen_id, usuario_id, moneda_id,
    cliente_nombre, subtotal, impuestos, total, estado
  ) VALUES (
    p_codigo, p_sucursal_id, p_almacen_id, p_usuario_id, p_moneda_id,
    p_cliente_nombre, v_subtotal, ROUND(v_subtotal * 0.18, 2), ROUND(v_subtotal * 1.18, 2), 'confirmada'
  );

  SET p_venta_id = LAST_INSERT_ID();
  SET v_idx = 0;

  WHILE v_idx < v_len DO
    SET v_producto = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].producto_id')));
    SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));
    SET v_precio   = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')));

    INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (p_venta_id, v_producto, v_cantidad, v_precio, v_cantidad * v_precio);

    CALL sp_actualizar_inventario(
      v_producto, p_almacen_id, -v_cantidad, 'venta',
      p_codigo, 'venta', p_usuario_id, 'Venta de mercancía'
    );

    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('ventas', 'venta', p_venta_id, 'crear', p_usuario_id, CONCAT('Venta ', p_codigo, ' registrada'));

  COMMIT;
  SET @librosys_from_proc = NULL;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_evento
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_evento$$
CREATE PROCEDURE sp_registrar_evento(
  IN p_codigo           VARCHAR(30),
  IN p_nombre           VARCHAR(200),
  IN p_tipo             VARCHAR(100),
  IN p_fecha_inicio     DATE,
  IN p_fecha_fin        DATE,
  IN p_ubicacion        VARCHAR(200),
  IN p_editorial_id     INT UNSIGNED,
  IN p_responsable_id   INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  OUT p_evento_id       INT UNSIGNED
)
BEGIN
  START TRANSACTION;

  INSERT INTO eventos (
    codigo, nombre, tipo, fecha_inicio, fecha_fin, ubicacion,
    editorial_id, responsable_id, estado
  ) VALUES (
    p_codigo, p_nombre, p_tipo, p_fecha_inicio, p_fecha_fin, p_ubicacion,
    p_editorial_id, p_responsable_id, 'programado'
  );

  SET p_evento_id = LAST_INSERT_ID();

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('eventos', 'eventos', p_evento_id, 'crear', p_usuario_id, CONCAT('Evento ', p_codigo, ' registrado'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_asignar_personal
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_asignar_personal$$
CREATE PROCEDURE sp_asignar_personal(
  IN p_evento_id        INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_rol_evento       VARCHAR(100),
  IN p_horas_asignadas  DECIMAL(8,2),
  IN p_asignado_por     INT UNSIGNED
)
BEGIN
  START TRANSACTION;

  INSERT INTO asignacion_evento (evento_id, usuario_id, rol_evento, horas_asignadas, estado)
  VALUES (p_evento_id, p_usuario_id, p_rol_evento, p_horas_asignadas, 'asignado')
  ON DUPLICATE KEY UPDATE
    rol_evento = p_rol_evento,
    horas_asignadas = p_horas_asignadas,
    estado = 'asignado';

  UPDATE eventos
  SET estado = CASE WHEN estado = 'programado' THEN 'personal_asignado' ELSE estado END
  WHERE id = p_evento_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('eventos', 'asignacion_evento', p_evento_id, 'crear', p_asignado_por,
          CONCAT('Personal asignado al evento ', p_evento_id));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_costeo
-- Distribuye costos de flete proporcionalmente por línea de OC
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_costeo$$
CREATE PROCEDURE sp_registrar_costeo(
  IN p_embarque_id      INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED
)
BEGIN
  DECLARE v_orden_id      INT UNSIGNED;
  DECLARE v_freight_total DECIMAL(18,2) DEFAULT 0;
  DECLARE v_subtotal_oc   DECIMAL(18,2) DEFAULT 0;
  DECLARE v_done          INT DEFAULT 0;

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, cantidad_solicitada, costo_unitario, subtotal
    FROM detalle_orden_compra
    WHERE orden_compra_id = v_orden_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  SELECT orden_compra_id INTO v_orden_id FROM embarque WHERE id = p_embarque_id;

  SELECT COALESCE(total_costos, 0) INTO v_freight_total
  FROM costos_embarque WHERE embarque_id = p_embarque_id;

  IF v_freight_total <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El embarque no tiene costos registrados.';
  END IF;

  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal_oc
  FROM detalle_orden_compra WHERE orden_compra_id = v_orden_id;

  START TRANSACTION;

  DELETE FROM costeo_libro WHERE embarque_id = p_embarque_id;

  OPEN cur_lineas;
  read_loop: LOOP
    FETCH cur_lineas INTO @det_id, @prod_id, @qty, @unit_cost, @line_sub;
    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    SET @line_share = IF(v_subtotal_oc > 0, @line_sub / v_subtotal_oc, 0);
    SET @freight_alloc = ROUND((v_freight_total * @line_share) / GREATEST(@qty, 1), 4);

    INSERT INTO costeo_libro (
      embarque_id, producto_id, orden_compra_id, detalle_orden_id,
      costo_producto, flete_asignado
    ) VALUES (
      p_embarque_id, @prod_id, v_orden_id, @det_id,
      @unit_cost, @freight_alloc
    );
  END LOOP;
  CLOSE cur_lineas;

  UPDATE embarque SET estado = 'costeado' WHERE id = p_embarque_id;

  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costeo_libro'
  WHERE e.id = p_embarque_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'costeo_libro', p_embarque_id, 'crear', p_usuario_id,
          CONCAT('Costeo registrado para embarque ', p_embarque_id));

  COMMIT;
END$$

DELIMITER ;
