-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 10_procedimientos.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Procedimientos almacenados que implementan, en SQL puro, los casos de uso
-- del módulo Inventario descritos por los Application Services del backend
-- (backend/src/modules/inventario/application/services/*.ts) y por el
-- InventoryEngine (backend/src/modules/inventario/domain/services/InventoryEngine.ts).
--
-- Núcleo: `sp_inv_registrar_movimiento` es el equivalente relacional del
-- InventoryEngine — único punto autorizado a mutar `inventario.stock`. Todos
-- los demás procedimientos de aplicación (transferencias, ajustes, descartes)
-- lo invocan en lugar de tocar `inventario` directamente.
--
-- Convenciones:
--   - Todo procedimiento que muta estado usa `expected_version` (concurrencia
--     optimista, espejo de Version.ts / assertVersion()).
--   - Todo procedimiento que mueve stock exige `idempotency_key` y es
--     replay-safe (si la clave ya se usó, se re-expone el resultado sin
--     mutar de nuevo), espejo de IIdempotencyRepository.
--   - Los mensajes de SIGNAL llevan como prefijo el código de error del
--     dominio (InventoryDomainError.code) para facilitar el diagnóstico.
--   - Los triggers de 11_triggers.sql NO mutan stock (evitan doble aplicación
--     sobre lo que ya hacen estos procedimientos); solo auditan transiciones
--     de estado.
-- =============================================================================

USE librosys;

DELIMITER $$

-- =============================================================================
-- NÚCLEO: MOVIMIENTOS DE INVENTARIO (equivalente de InventoryEngine)
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_inv_registrar_movimiento$$
CREATE PROCEDURE sp_inv_registrar_movimiento(
  IN  p_idempotency_key            VARCHAR(100),
  IN  p_tipo_movimiento            VARCHAR(30),
  IN  p_sentido                    VARCHAR(10),
  IN  p_producto_id                INT UNSIGNED,
  IN  p_almacen_id                 INT UNSIGNED,
  IN  p_cantidad                   INT UNSIGNED,
  IN  p_documento_tipo             VARCHAR(40),
  IN  p_documento_id               VARCHAR(64),
  IN  p_documento_linea_id         VARCHAR(64),
  IN  p_usuario_id                 INT UNSIGNED,
  IN  p_motivo_codigo              VARCHAR(40),
  IN  p_observacion                VARCHAR(255),
  IN  p_movimiento_compensa_id     INT UNSIGNED,
  IN  p_permitir_bloqueo_conteo_id CHAR(36),
  IN  p_ignorar_bloqueo            TINYINT(1),
  OUT p_movimiento_id              INT UNSIGNED,
  OUT p_saldo_posterior            INT,
  OUT p_replayed                   TINYINT(1)
)
BEGIN
  DECLARE v_stock                     INT;
  DECLARE v_version                   INT UNSIGNED;
  DECLARE v_bloqueado                 TINYINT(1);
  DECLARE v_conteo_bloqueante         CHAR(36);
  DECLARE v_almacen_bloqueado         TINYINT(1);
  DECLARE v_almacen_conteo_bloqueante CHAR(36);
  DECLARE v_saldo_anterior            INT;
  DECLARE v_saldo_nuevo                INT;
  DECLARE v_delta                     INT;
  DECLARE v_existing_id                INT UNSIGNED;

  IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MISSING_IDEMPOTENCY_KEY: la clave de idempotencia es obligatoria.';
  END IF;
  IF p_usuario_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MISSING_ACTOR: el movimiento requiere un usuario actor.';
  END IF;
  IF p_cantidad IS NULL OR p_cantidad = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: la cantidad del movimiento debe ser mayor que 0.';
  END IF;
  IF p_sentido NOT IN ('entrada','salida') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: sentido inválido, debe ser entrada o salida.';
  END IF;

  SET v_existing_id = NULL;
  SELECT id, saldo_posterior INTO v_existing_id, p_saldo_posterior
  FROM movimiento_inventario
  WHERE idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    SET p_movimiento_id = v_existing_id;
    SET p_replayed = 1;
  ELSE
    START TRANSACTION;

    INSERT IGNORE INTO inventario (producto_id, almacen_id, stock, stock_minimo)
    VALUES (p_producto_id, p_almacen_id, 0, 10);

    SELECT stock, version, bloqueado_por_conteo, conteo_bloqueante_id
      INTO v_stock, v_version, v_bloqueado, v_conteo_bloqueante
    FROM inventario
    WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id
    FOR UPDATE;

    SELECT bloqueado_por_conteo, conteo_bloqueante_id
      INTO v_almacen_bloqueado, v_almacen_conteo_bloqueante
    FROM almacenes
    WHERE id = p_almacen_id
    FOR UPDATE;

    IF p_ignorar_bloqueo = 0
       AND (v_bloqueado = 1 OR v_almacen_bloqueado = 1)
       AND NOT (
             p_permitir_bloqueo_conteo_id IS NOT NULL
             AND (v_conteo_bloqueante = p_permitir_bloqueo_conteo_id
                  OR v_almacen_conteo_bloqueante = p_permitir_bloqueo_conteo_id)
           )
    THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ALMACEN_BLOQUEADO: el almacén está bloqueado por un conteo físico activo.';
    END IF;

    SET v_saldo_anterior = v_stock;
    SET v_delta = IF(p_sentido = 'entrada', p_cantidad, -p_cantidad);
    SET v_saldo_nuevo = v_saldo_anterior + v_delta;

    IF v_saldo_nuevo < 0 THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NEGATIVE_STOCK: la operación produciría stock negativo.';
    END IF;

    UPDATE inventario
       SET stock = v_saldo_nuevo, version = version + 1
     WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id;

    INSERT INTO movimiento_inventario (
      producto_id, almacen_id, usuario_id, tipo_movimiento, cantidad,
      saldo_anterior, saldo_posterior, referencia, referencia_tipo, observaciones,
      idempotency_key, motivo_codigo, movimiento_compensa_id, dominio_id, sentido,
      documento_tipo, documento_id, documento_linea_id
    ) VALUES (
      p_producto_id, p_almacen_id, p_usuario_id, p_tipo_movimiento, p_cantidad,
      v_saldo_anterior, v_saldo_nuevo, p_documento_id, p_documento_tipo, p_observacion,
      p_idempotency_key, p_motivo_codigo, p_movimiento_compensa_id, fn_inv_uuid(), p_sentido,
      p_documento_tipo, p_documento_id, p_documento_linea_id
    );

    SET p_movimiento_id = LAST_INSERT_ID();

    INSERT INTO auditoria_inventario (
      tipo_accion, usuario_id, movimiento_id, documento_tipo, documento_id,
      producto_id, almacen_id, valor_antes, valor_despues, detalle, idempotency_key, resultado
    ) VALUES (
      'movimiento', p_usuario_id, p_movimiento_id, p_documento_tipo, p_documento_id,
      p_producto_id, p_almacen_id,
      JSON_OBJECT('saldo', v_saldo_anterior, 'version', v_version),
      JSON_OBJECT('saldo', v_saldo_nuevo, 'version', v_version + 1),
      CONCAT('Movimiento ', p_tipo_movimiento, ' (', p_sentido, ')'),
      p_idempotency_key, 'OK'
    );

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (
      p_idempotency_key, p_tipo_movimiento, p_documento_tipo, p_documento_id,
      JSON_OBJECT('movimientoId', p_movimiento_id, 'saldoPosterior', v_saldo_nuevo)
    )
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SET p_saldo_posterior = v_saldo_nuevo;
    SET p_replayed = 0;
  END IF;
END$$

-- -----------------------------------------------------------------------------
-- sp_actualizar_inventario — RECREADO por compatibilidad. Misma firma que la
-- versión legada (14_procedimientos.sql) para que los triggers de ventas y
-- recepción (15_triggers.sql: trg_inventario_despues_venta,
-- trg_inventario_despues_recepcion) sigan funcionando sin cambios. Por debajo
-- delega en sp_inv_registrar_movimiento (version bump + saldo_anterior +
-- ENUM de dominio ya incluidos).
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_actualizar_inventario$$
CREATE PROCEDURE sp_actualizar_inventario(
  IN p_producto_id      INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_cantidad         INT,
  IN p_tipo_movimiento  VARCHAR(30),
  IN p_referencia       VARCHAR(50),
  IN p_referencia_tipo  VARCHAR(50),
  IN p_usuario_id       INT UNSIGNED,
  IN p_observaciones    VARCHAR(255)
)
BEGIN
  DECLARE v_tipo         VARCHAR(30);
  DECLARE v_sentido      VARCHAR(10);
  DECLARE v_cantidad_abs INT UNSIGNED;
  DECLARE v_mov_id       INT UNSIGNED;
  DECLARE v_saldo        INT;
  DECLARE v_replayed     TINYINT(1);

  IF p_cantidad IS NULL OR p_cantidad = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: la cantidad del movimiento debe ser distinta de 0.';
  END IF;

  SET v_tipo = CASE p_tipo_movimiento
    WHEN 'entrada' THEN 'recepcion'
    WHEN 'salida'  THEN 'ajuste'
    ELSE p_tipo_movimiento
  END;
  SET v_sentido = IF(p_cantidad >= 0, 'entrada', 'salida');
  SET v_cantidad_abs = ABS(p_cantidad);

  CALL sp_inv_registrar_movimiento(
    CONCAT('legacy:', fn_inv_uuid()),
    v_tipo, v_sentido, p_producto_id, p_almacen_id, v_cantidad_abs,
    p_referencia_tipo, p_referencia, NULL,
    p_usuario_id, NULL, p_observaciones, NULL,
    NULL, 0,
    v_mov_id, v_saldo, v_replayed
  );
END$$

-- =============================================================================
-- TRANSFERENCIAS (Transferencia.ts / TransferenciaApplicationService.ts)
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_inv_crear_transferencia$$
CREATE PROCEDURE sp_inv_crear_transferencia(
  IN  p_codigo             VARCHAR(30),
  IN  p_almacen_origen_id  INT UNSIGNED,
  IN  p_almacen_destino_id INT UNSIGNED,
  IN  p_solicitante_id     INT UNSIGNED,
  IN  p_lineas             JSON,
  IN  p_observacion        VARCHAR(500),
  IN  p_solicitar          TINYINT(1),
  OUT p_transferencia_id   INT UNSIGNED
)
BEGIN
  DECLARE v_idx    INT DEFAULT 0;
  DECLARE v_len    INT DEFAULT 0;
  DECLARE v_estado VARCHAR(20);

  IF p_almacen_origen_id = p_almacen_destino_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT_REF: el almacén origen y destino deben ser distintos.';
  END IF;

  SET v_len = JSON_LENGTH(p_lineas);
  IF v_len IS NULL OR v_len = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: la transferencia requiere al menos una línea.';
  END IF;

  SET v_estado = IF(p_solicitar = 0, 'borrador', 'solicitada');

  START TRANSACTION;

  INSERT INTO transferencia (
    codigo, almacen_origen_id, almacen_destino_id, usuario_solicita_id,
    estado, observaciones, version, dominio_id
  ) VALUES (
    p_codigo, p_almacen_origen_id, p_almacen_destino_id, p_solicitante_id,
    v_estado, p_observacion, 1, fn_inv_uuid()
  );
  SET p_transferencia_id = LAST_INSERT_ID();

  WHILE v_idx < v_len DO
    INSERT INTO detalle_transferencia (
      transferencia_id, producto_id, cantidad_solicitada, cantidad_despachada,
      cantidad_recibida, cantidad_faltante, cantidad_danada, dominio_id
    ) VALUES (
      p_transferencia_id,
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].producto_id'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].cantidad_solicitada'))),
      0, 0, 0, 0, fn_inv_uuid()
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_inv_solicitar_transferencia$$
CREATE PROCEDURE sp_inv_solicitar_transferencia(
  IN  p_transferencia_id INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version
  FROM transferencia WHERE id = p_transferencia_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: transferencia no encontrada.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión de la transferencia no coincide.';
  END IF;
  IF v_estado <> 'borrador' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se solicita una transferencia en borrador.';
  END IF;

  UPDATE transferencia SET estado = 'solicitada', version = version + 1 WHERE id = p_transferencia_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_despachar_transferencia$$
CREATE PROCEDURE sp_inv_despachar_transferencia(
  IN  p_transferencia_id INT UNSIGNED,
  IN  p_actor_id         INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  IN  p_idempotency_key  VARCHAR(100),
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado          VARCHAR(20);
  DECLARE v_version         INT UNSIGNED;
  DECLARE v_almacen_origen  INT UNSIGNED;
  DECLARE v_origen_bloqueado TINYINT(1);
  DECLARE v_done            INT DEFAULT 0;
  DECLARE v_detalle_id      INT UNSIGNED;
  DECLARE v_producto_id     INT UNSIGNED;
  DECLARE v_cantidad        INT UNSIGNED;
  DECLARE v_mov_id          INT UNSIGNED;
  DECLARE v_saldo           INT;
  DECLARE v_replayed        TINYINT(1);

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, cantidad_solicitada
    FROM detalle_transferencia
    WHERE transferencia_id = p_transferencia_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
  ELSE
    SELECT estado, version, almacen_origen_id INTO v_estado, v_version, v_almacen_origen
    FROM transferencia WHERE id = p_transferencia_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: transferencia no encontrada.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión de la transferencia no coincide.';
    END IF;
    IF v_estado <> 'solicitada' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se despacha una transferencia solicitada.';
    END IF;

    SELECT bloqueado_por_conteo INTO v_origen_bloqueado FROM almacenes WHERE id = v_almacen_origen;
    IF v_origen_bloqueado = 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ALMACEN_BLOQUEADO: el almacén origen está bloqueado por conteo.';
    END IF;

    START TRANSACTION;

    UPDATE detalle_transferencia
       SET cantidad_despachada = cantidad_solicitada
     WHERE transferencia_id = p_transferencia_id;

    OPEN cur_lineas;
    read_loop: LOOP
      FETCH cur_lineas INTO v_detalle_id, v_producto_id, v_cantidad;
      IF v_done = 1 THEN
        LEAVE read_loop;
      END IF;

      CALL sp_inv_registrar_movimiento(
        CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
        'transferencia_salida', 'salida', v_producto_id, v_almacen_origen, v_cantidad,
        'transferencia', p_transferencia_id, v_detalle_id,
        p_actor_id, NULL, NULL, NULL,
        NULL, 1,
        v_mov_id, v_saldo, v_replayed
      );
    END LOOP;
    CLOSE cur_lineas;

    UPDATE transferencia SET estado = 'en_transito', version = version + 1 WHERE id = p_transferencia_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'despachar_transferencia', 'transferencia', p_transferencia_id,
            JSON_OBJECT('id', p_transferencia_id, 'estado', 'en_transito'))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_inv_recibir_transferencia$$
CREATE PROCEDURE sp_inv_recibir_transferencia(
  IN  p_transferencia_id INT UNSIGNED,
  IN  p_actor_id         INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  IN  p_idempotency_key  VARCHAR(100),
  IN  p_recepciones      JSON,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado           VARCHAR(20);
  DECLARE v_version          INT UNSIGNED;
  DECLARE v_almacen_destino  INT UNSIGNED;
  DECLARE v_destino_bloqueado TINYINT(1);
  DECLARE v_idx              INT DEFAULT 0;
  DECLARE v_len              INT DEFAULT 0;
  DECLARE v_detalle_id       INT UNSIGNED;
  DECLARE v_producto_id      INT UNSIGNED;
  DECLARE v_cant_recibida    INT UNSIGNED;
  DECLARE v_cant_faltante    INT UNSIGNED;
  DECLARE v_cant_danada      INT UNSIGNED;
  DECLARE v_despachada       INT UNSIGNED;
  DECLARE v_recibida_prev    INT UNSIGNED;
  DECLARE v_faltante_prev    INT UNSIGNED;
  DECLARE v_danada_prev      INT UNSIGNED;
  DECLARE v_pendiente        INT;
  DECLARE v_completa         INT;
  DECLARE v_mov_id           INT UNSIGNED;
  DECLARE v_saldo            INT;
  DECLARE v_replayed         TINYINT(1);

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
  ELSE
    SELECT estado, version, almacen_destino_id INTO v_estado, v_version, v_almacen_destino
    FROM transferencia WHERE id = p_transferencia_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: transferencia no encontrada.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión de la transferencia no coincide.';
    END IF;
    IF v_estado NOT IN ('en_transito','recibida_parcial') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se recibe una transferencia en tránsito o parcial.';
    END IF;

    SELECT bloqueado_por_conteo INTO v_destino_bloqueado FROM almacenes WHERE id = v_almacen_destino;
    IF v_destino_bloqueado = 1 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ALMACEN_BLOQUEADO: el almacén destino está bloqueado por conteo.';
    END IF;

    SET v_len = JSON_LENGTH(p_recepciones);
    IF v_len IS NULL OR v_len = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: debe indicar al menos una recepción.';
    END IF;

    START TRANSACTION;

    SET v_idx = 0;
    WHILE v_idx < v_len DO
      SET v_detalle_id    = JSON_UNQUOTE(JSON_EXTRACT(p_recepciones, CONCAT('$[', v_idx, '].detalle_id')));
      SET v_cant_recibida = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_recepciones, CONCAT('$[', v_idx, '].cantidad_recibida'))), 0);
      SET v_cant_faltante = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_recepciones, CONCAT('$[', v_idx, '].cantidad_faltante'))), 0);
      SET v_cant_danada   = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_recepciones, CONCAT('$[', v_idx, '].cantidad_danada'))), 0);

      SELECT producto_id, cantidad_despachada, cantidad_recibida, cantidad_faltante, cantidad_danada
        INTO v_producto_id, v_despachada, v_recibida_prev, v_faltante_prev, v_danada_prev
      FROM detalle_transferencia
      WHERE id = v_detalle_id AND transferencia_id = p_transferencia_id
      FOR UPDATE;

      IF v_producto_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT_REF: línea de transferencia no encontrada.';
      END IF;

      SET v_pendiente = v_despachada - v_recibida_prev - v_faltante_prev - v_danada_prev;
      IF (v_cant_recibida + v_cant_faltante + v_cant_danada) > v_pendiente THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: la recepción supera lo pendiente de la línea.';
      END IF;

      IF v_cant_recibida > 0 THEN
        CALL sp_inv_registrar_movimiento(
          CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
          'transferencia_entrada', 'entrada', v_producto_id, v_almacen_destino, v_cant_recibida,
          'transferencia', p_transferencia_id, v_detalle_id,
          p_actor_id, NULL, NULL, NULL,
          NULL, 1,
          v_mov_id, v_saldo, v_replayed
        );
      END IF;

      UPDATE detalle_transferencia
         SET cantidad_recibida = cantidad_recibida + v_cant_recibida,
             cantidad_faltante = cantidad_faltante + v_cant_faltante,
             cantidad_danada   = cantidad_danada + v_cant_danada
       WHERE id = v_detalle_id;

      SET v_idx = v_idx + 1;
    END WHILE;

    SELECT COUNT(*) INTO v_completa
    FROM detalle_transferencia
    WHERE transferencia_id = p_transferencia_id
      AND (cantidad_recibida + cantidad_faltante + cantidad_danada) <> cantidad_despachada;

    UPDATE transferencia
       SET estado = IF(v_completa = 0, 'recibida', 'recibida_parcial'),
           version = version + 1
     WHERE id = p_transferencia_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'recibir_transferencia', 'transferencia', p_transferencia_id,
            JSON_OBJECT('id', p_transferencia_id, 'completa', v_completa = 0))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_inv_cancelar_transferencia$$
CREATE PROCEDURE sp_inv_cancelar_transferencia(
  IN  p_transferencia_id INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version
  FROM transferencia WHERE id = p_transferencia_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: transferencia no encontrada.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión de la transferencia no coincide.';
  END IF;
  IF v_estado NOT IN ('borrador','solicitada') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se cancela una transferencia en borrador o solicitada.';
  END IF;

  UPDATE transferencia SET estado = 'cancelada', version = version + 1 WHERE id = p_transferencia_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM transferencia WHERE id = p_transferencia_id;
END$$

-- =============================================================================
-- AJUSTES (Ajuste.ts / AjusteApplicationService.ts)
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_inv_crear_ajuste$$
CREATE PROCEDURE sp_inv_crear_ajuste(
  IN  p_codigo                VARCHAR(30),
  IN  p_almacen_id            INT UNSIGNED,
  IN  p_tipo_ajuste           VARCHAR(20),
  IN  p_solicitante_id        INT UNSIGNED,
  IN  p_lineas                JSON,
  IN  p_observacion           TEXT,
  IN  p_documento_origen_tipo VARCHAR(40),
  IN  p_documento_origen_id   VARCHAR(64),
  IN  p_solicitar             TINYINT(1),
  OUT p_ajuste_id             INT UNSIGNED
)
BEGIN
  DECLARE v_idx        INT DEFAULT 0;
  DECLARE v_len        INT DEFAULT 0;
  DECLARE v_estado     VARCHAR(20);
  DECLARE v_diferencia INT;
  DECLARE v_objetivo   INT;

  SET v_len = JSON_LENGTH(p_lineas);
  IF v_len IS NULL OR v_len = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: el ajuste requiere al menos una línea.';
  END IF;

  SET v_estado = IF(p_solicitar = 0, 'borrador', 'solicitado');

  START TRANSACTION;

  INSERT INTO ajuste (
    codigo, almacen_id, tipo_ajuste, estado, solicitante_id, version,
    observacion, documento_origen_tipo, documento_origen_id, dominio_id
  ) VALUES (
    p_codigo, p_almacen_id, p_tipo_ajuste, v_estado, p_solicitante_id, 1,
    p_observacion, p_documento_origen_tipo, p_documento_origen_id, fn_inv_uuid()
  );
  SET p_ajuste_id = LAST_INSERT_ID();

  WHILE v_idx < v_len DO
    SET v_objetivo   = JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].cantidad_objetivo')));
    SET v_diferencia = JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].diferencia')));

    IF v_objetivo IS NULL OR v_objetivo < 0 THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ADJUSTMENT: la cantidad objetivo debe ser un entero >= 0.';
    END IF;
    IF v_diferencia IS NULL OR v_diferencia = 0 THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ADJUSTMENT: cada línea de ajuste requiere diferencia distinta de cero.';
    END IF;

    INSERT INTO ajuste_detalle (
      ajuste_id, producto_id, cantidad_objetivo, diferencia, motivo_codigo,
      linea_conteo_id, observacion, dominio_id
    ) VALUES (
      p_ajuste_id,
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].producto_id'))),
      v_objetivo, v_diferencia,
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].motivo_codigo'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].linea_conteo_id'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].observacion'))),
      fn_inv_uuid()
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_inv_solicitar_ajuste$$
CREATE PROCEDURE sp_inv_solicitar_ajuste(
  IN  p_ajuste_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
  END IF;
  IF v_estado <> 'borrador' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede solicitar un ajuste en borrador.';
  END IF;

  UPDATE ajuste SET estado = 'solicitado', version = version + 1 WHERE id = p_ajuste_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_rechazar_ajuste$$
CREATE PROCEDURE sp_inv_rechazar_ajuste(
  IN  p_ajuste_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
  END IF;
  IF v_estado <> 'solicitado' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede rechazar un ajuste solicitado.';
  END IF;

  UPDATE ajuste SET estado = 'rechazado', version = version + 1 WHERE id = p_ajuste_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_cancelar_ajuste$$
CREATE PROCEDURE sp_inv_cancelar_ajuste(
  IN  p_ajuste_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
  END IF;
  IF v_estado NOT IN ('borrador','solicitado') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede cancelar un ajuste en borrador o solicitado.';
  END IF;

  UPDATE ajuste SET estado = 'cancelado', version = version + 1 WHERE id = p_ajuste_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_aprobar_ajuste$$
CREATE PROCEDURE sp_inv_aprobar_ajuste(
  IN  p_ajuste_id        INT UNSIGNED,
  IN  p_aprobador_id     INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
  END IF;
  IF v_estado <> 'solicitado' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede aprobar un ajuste solicitado.';
  END IF;

  UPDATE ajuste SET estado = 'aprobado', aprobador_id = p_aprobador_id, version = version + 1
   WHERE id = p_ajuste_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_aplicar_ajuste$$
CREATE PROCEDURE sp_inv_aplicar_ajuste(
  IN  p_ajuste_id                   INT UNSIGNED,
  IN  p_actor_id                    INT UNSIGNED,
  IN  p_expected_version            INT UNSIGNED,
  IN  p_idempotency_key             VARCHAR(100),
  IN  p_permitir_bloqueo_conteo_id  CHAR(36),
  OUT p_estado                      VARCHAR(20),
  OUT p_version                     INT UNSIGNED
)
BEGIN
  DECLARE v_almacen_id    INT UNSIGNED;
  DECLARE v_estado        VARCHAR(20);
  DECLARE v_version       INT UNSIGNED;
  DECLARE v_done          INT DEFAULT 0;
  DECLARE v_detalle_id    INT UNSIGNED;
  DECLARE v_producto_id   INT UNSIGNED;
  DECLARE v_diferencia    INT;
  DECLARE v_motivo_codigo VARCHAR(40);
  DECLARE v_sentido       VARCHAR(10);
  DECLARE v_cantidad      INT UNSIGNED;
  DECLARE v_mov_id        INT UNSIGNED;
  DECLARE v_saldo         INT;
  DECLARE v_replayed      TINYINT(1);

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, diferencia, motivo_codigo
    FROM ajuste_detalle
    WHERE ajuste_id = p_ajuste_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
  ELSE
    SELECT estado, version, almacen_id INTO v_estado, v_version, v_almacen_id
    FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
    END IF;
    IF v_estado <> 'aprobado' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se aplica un ajuste aprobado.';
    END IF;

    START TRANSACTION;

    OPEN cur_lineas;
    read_loop: LOOP
      FETCH cur_lineas INTO v_detalle_id, v_producto_id, v_diferencia, v_motivo_codigo;
      IF v_done = 1 THEN
        LEAVE read_loop;
      END IF;

      SET v_sentido  = IF(v_diferencia > 0, 'entrada', 'salida');
      SET v_cantidad = ABS(v_diferencia);

      CALL sp_inv_registrar_movimiento(
        CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
        'ajuste', v_sentido, v_producto_id, v_almacen_id, v_cantidad,
        'ajuste', p_ajuste_id, v_detalle_id,
        p_actor_id, v_motivo_codigo, NULL, NULL,
        p_permitir_bloqueo_conteo_id, 0,
        v_mov_id, v_saldo, v_replayed
      );
    END LOOP;
    CLOSE cur_lineas;

    UPDATE ajuste SET estado = 'aplicado', version = version + 1 WHERE id = p_ajuste_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'aplicar_ajuste', 'ajuste', p_ajuste_id,
            JSON_OBJECT('id', p_ajuste_id, 'estado', 'aplicado'))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_inv_revertir_ajuste$$
CREATE PROCEDURE sp_inv_revertir_ajuste(
  IN  p_ajuste_id        INT UNSIGNED,
  IN  p_actor_id         INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  IN  p_idempotency_key  VARCHAR(100),
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_almacen_id  INT UNSIGNED;
  DECLARE v_estado      VARCHAR(20);
  DECLARE v_version     INT UNSIGNED;
  DECLARE v_done        INT DEFAULT 0;
  DECLARE v_detalle_id  INT UNSIGNED;
  DECLARE v_producto_id INT UNSIGNED;
  DECLARE v_diferencia  INT;
  DECLARE v_sentido     VARCHAR(10);
  DECLARE v_cantidad    INT UNSIGNED;
  DECLARE v_mov_id      INT UNSIGNED;
  DECLARE v_saldo       INT;
  DECLARE v_replayed    TINYINT(1);

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, diferencia
    FROM ajuste_detalle
    WHERE ajuste_id = p_ajuste_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
  ELSE
    SELECT estado, version, almacen_id INTO v_estado, v_version, v_almacen_id
    FROM ajuste WHERE id = p_ajuste_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: ajuste no encontrado.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del ajuste no coincide.';
    END IF;
    IF v_estado <> 'aplicado' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se revierte un ajuste aplicado.';
    END IF;

    START TRANSACTION;

    OPEN cur_lineas;
    read_loop: LOOP
      FETCH cur_lineas INTO v_detalle_id, v_producto_id, v_diferencia;
      IF v_done = 1 THEN
        LEAVE read_loop;
      END IF;

      -- Reversión: se invierte el sentido de la diferencia original,
      -- restaurando el saldo previo a la aplicación (mismo tipo 'ajuste').
      SET v_sentido  = IF(v_diferencia < 0, 'entrada', 'salida');
      SET v_cantidad = ABS(v_diferencia);

      CALL sp_inv_registrar_movimiento(
        CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
        'ajuste', v_sentido, v_producto_id, v_almacen_id, v_cantidad,
        'ajuste', p_ajuste_id, v_detalle_id,
        p_actor_id, 'REVERSION_AJUSTE', CONCAT('Reversión del ajuste ', p_ajuste_id), NULL,
        NULL, 1,
        v_mov_id, v_saldo, v_replayed
      );
    END LOOP;
    CLOSE cur_lineas;

    UPDATE ajuste SET estado = 'revertido', version = version + 1 WHERE id = p_ajuste_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'revertir_ajuste', 'ajuste', p_ajuste_id,
            JSON_OBJECT('id', p_ajuste_id, 'estado', 'revertido'))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM ajuste WHERE id = p_ajuste_id;
  END IF;
END$$

-- =============================================================================
-- DESCARTES (Descarte.ts / DescarteApplicationService.ts)
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_inv_crear_descarte$$
CREATE PROCEDURE sp_inv_crear_descarte(
  IN  p_codigo                VARCHAR(40),
  IN  p_almacen_id            INT UNSIGNED,
  IN  p_solicitante_id        INT UNSIGNED,
  IN  p_lineas                JSON,
  IN  p_observacion           TEXT,
  IN  p_documento_origen_tipo VARCHAR(40),
  IN  p_documento_origen_id   VARCHAR(64),
  IN  p_conteo_origen_id      INT UNSIGNED,
  IN  p_solicitar             TINYINT(1),
  OUT p_descarte_id           INT UNSIGNED
)
BEGIN
  DECLARE v_idx          INT DEFAULT 0;
  DECLARE v_len          INT DEFAULT 0;
  DECLARE v_estado       VARCHAR(20);
  DECLARE v_cantidad     INT;
  DECLARE v_producto_id  INT UNSIGNED;
  DECLARE v_motivo       VARCHAR(40);
  DECLARE v_costo        DECIMAL(18,0);

  SET v_len = JSON_LENGTH(p_lineas);
  IF v_len IS NULL OR v_len = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: el descarte requiere al menos una línea.';
  END IF;

  SET v_estado = IF(p_solicitar = 0, 'borrador', 'solicitado');

  START TRANSACTION;

  INSERT INTO descarte (
    codigo, almacen_id, estado, solicitante_id, version, observacion,
    documento_origen_tipo, documento_origen_id, conteo_origen_id, dominio_id
  ) VALUES (
    p_codigo, p_almacen_id, v_estado, p_solicitante_id, 1, p_observacion,
    p_documento_origen_tipo, p_documento_origen_id, p_conteo_origen_id, fn_inv_uuid()
  );
  SET p_descarte_id = LAST_INSERT_ID();

  WHILE v_idx < v_len DO
    SET v_producto_id = JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].producto_id')));
    SET v_cantidad    = JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].cantidad')));
    SET v_motivo      = JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].motivo_codigo')));

    IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: cada línea de descarte requiere cantidad > 0.';
    END IF;
    IF v_motivo IS NULL OR TRIM(v_motivo) = '' THEN
      ROLLBACK;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: cada línea de descarte requiere motivo tipificado.';
    END IF;

    SELECT costo INTO v_costo FROM productos WHERE id = v_producto_id;

    INSERT INTO descarte_detalle (
      descarte_id, producto_id, cantidad, costo, motivo_codigo, observacion, dominio_id
    ) VALUES (
      p_descarte_id, v_producto_id, v_cantidad, COALESCE(v_costo, 0), v_motivo,
      JSON_UNQUOTE(JSON_EXTRACT(p_lineas, CONCAT('$[', v_idx, '].observacion'))),
      fn_inv_uuid()
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_inv_solicitar_descarte$$
CREATE PROCEDURE sp_inv_solicitar_descarte(
  IN  p_descarte_id      INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM descarte WHERE id = p_descarte_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
  END IF;
  IF v_estado <> 'borrador' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede solicitar un descarte en borrador.';
  END IF;

  UPDATE descarte SET estado = 'solicitado', version = version + 1 WHERE id = p_descarte_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_rechazar_descarte$$
CREATE PROCEDURE sp_inv_rechazar_descarte(
  IN  p_descarte_id      INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM descarte WHERE id = p_descarte_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
  END IF;
  IF v_estado <> 'solicitado' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede rechazar un descarte solicitado.';
  END IF;

  UPDATE descarte SET estado = 'rechazado', version = version + 1 WHERE id = p_descarte_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_cancelar_descarte$$
CREATE PROCEDURE sp_inv_cancelar_descarte(
  IN  p_descarte_id      INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM descarte WHERE id = p_descarte_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
  END IF;
  IF v_estado NOT IN ('borrador','solicitado') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede cancelar un descarte en borrador o solicitado.';
  END IF;

  UPDATE descarte SET estado = 'cancelado', version = version + 1 WHERE id = p_descarte_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_aprobar_descarte$$
CREATE PROCEDURE sp_inv_aprobar_descarte(
  IN  p_descarte_id      INT UNSIGNED,
  IN  p_aprobador_id     INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado       VARCHAR(20);
  DECLARE v_version      INT UNSIGNED;
  DECLARE v_solicitante  INT UNSIGNED;

  START TRANSACTION;

  SELECT estado, version, solicitante_id INTO v_estado, v_version, v_solicitante
  FROM descarte WHERE id = p_descarte_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
  END IF;
  IF v_estado <> 'solicitado' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede aprobar un descarte solicitado.';
  END IF;
  IF p_aprobador_id = v_solicitante THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: el aprobador debe ser distinto del solicitante.';
  END IF;

  UPDATE descarte SET estado = 'aprobado', aprobador_id = p_aprobador_id, version = version + 1
   WHERE id = p_descarte_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_aplicar_descarte$$
CREATE PROCEDURE sp_inv_aplicar_descarte(
  IN  p_descarte_id                 INT UNSIGNED,
  IN  p_actor_id                    INT UNSIGNED,
  IN  p_expected_version            INT UNSIGNED,
  IN  p_idempotency_key             VARCHAR(100),
  IN  p_permitir_bloqueo_conteo_id  CHAR(36),
  OUT p_estado                      VARCHAR(20),
  OUT p_version                     INT UNSIGNED
)
BEGIN
  DECLARE v_almacen_id    INT UNSIGNED;
  DECLARE v_estado        VARCHAR(20);
  DECLARE v_version       INT UNSIGNED;
  DECLARE v_done          INT DEFAULT 0;
  DECLARE v_detalle_id    INT UNSIGNED;
  DECLARE v_producto_id   INT UNSIGNED;
  DECLARE v_cantidad      INT UNSIGNED;
  DECLARE v_motivo_codigo VARCHAR(40);
  DECLARE v_mov_id        INT UNSIGNED;
  DECLARE v_saldo         INT;
  DECLARE v_replayed      TINYINT(1);

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, cantidad, motivo_codigo
    FROM descarte_detalle
    WHERE descarte_id = p_descarte_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
  ELSE
    SELECT estado, version, almacen_id INTO v_estado, v_version, v_almacen_id
    FROM descarte WHERE id = p_descarte_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
    END IF;
    IF v_estado <> 'aprobado' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se aplica un descarte aprobado.';
    END IF;

    START TRANSACTION;

    OPEN cur_lineas;
    read_loop: LOOP
      FETCH cur_lineas INTO v_detalle_id, v_producto_id, v_cantidad, v_motivo_codigo;
      IF v_done = 1 THEN
        LEAVE read_loop;
      END IF;

      CALL sp_inv_registrar_movimiento(
        CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
        'descarte', 'salida', v_producto_id, v_almacen_id, v_cantidad,
        'descarte', p_descarte_id, v_detalle_id,
        p_actor_id, v_motivo_codigo, NULL, NULL,
        p_permitir_bloqueo_conteo_id, 0,
        v_mov_id, v_saldo, v_replayed
      );
    END LOOP;
    CLOSE cur_lineas;

    UPDATE descarte SET estado = 'aplicado', version = version + 1 WHERE id = p_descarte_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'aplicar_descarte', 'descarte', p_descarte_id,
            JSON_OBJECT('id', p_descarte_id, 'estado', 'aplicado'))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_inv_revertir_descarte$$
CREATE PROCEDURE sp_inv_revertir_descarte(
  IN  p_descarte_id      INT UNSIGNED,
  IN  p_actor_id         INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  IN  p_idempotency_key  VARCHAR(100),
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_almacen_id  INT UNSIGNED;
  DECLARE v_estado      VARCHAR(20);
  DECLARE v_version     INT UNSIGNED;
  DECLARE v_done        INT DEFAULT 0;
  DECLARE v_detalle_id  INT UNSIGNED;
  DECLARE v_producto_id INT UNSIGNED;
  DECLARE v_cantidad    INT UNSIGNED;
  DECLARE v_mov_id      INT UNSIGNED;
  DECLARE v_saldo       INT;
  DECLARE v_replayed    TINYINT(1);

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, cantidad
    FROM descarte_detalle
    WHERE descarte_id = p_descarte_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF EXISTS (SELECT 1 FROM inventario_idempotencia WHERE idempotency_key = p_idempotency_key) THEN
    SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
  ELSE
    SELECT estado, version, almacen_id INTO v_estado, v_version, v_almacen_id
    FROM descarte WHERE id = p_descarte_id FOR UPDATE;

    IF v_estado IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: descarte no encontrado.';
    END IF;
    IF v_version <> p_expected_version THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del descarte no coincide.';
    END IF;
    IF v_estado <> 'aplicado' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se revierte un descarte aplicado.';
    END IF;

    START TRANSACTION;

    OPEN cur_lineas;
    read_loop: LOOP
      FETCH cur_lineas INTO v_detalle_id, v_producto_id, v_cantidad;
      IF v_done = 1 THEN
        LEAVE read_loop;
      END IF;

      CALL sp_inv_registrar_movimiento(
        CONCAT(p_idempotency_key, ':linea:', v_detalle_id),
        'devolucion_entrada', 'entrada', v_producto_id, v_almacen_id, v_cantidad,
        'descarte', p_descarte_id, v_detalle_id,
        p_actor_id, 'REVERSION_DESCARTE', CONCAT('Reversión del descarte ', p_descarte_id), NULL,
        NULL, 1,
        v_mov_id, v_saldo, v_replayed
      );
    END LOOP;
    CLOSE cur_lineas;

    UPDATE descarte SET estado = 'revertido', version = version + 1 WHERE id = p_descarte_id;

    INSERT INTO inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
    VALUES (p_idempotency_key, 'revertir_descarte', 'descarte', p_descarte_id,
            JSON_OBJECT('id', p_descarte_id, 'estado', 'revertido'))
    ON DUPLICATE KEY UPDATE fecha_registro = fecha_registro;

    COMMIT;

    SELECT estado, version INTO p_estado, p_version FROM descarte WHERE id = p_descarte_id;
  END IF;
END$$

-- =============================================================================
-- CONTEOS FÍSICOS (ConteoFisico.ts / ConteoApplicationService.ts)
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_inv_crear_conteo$$
CREATE PROCEDURE sp_inv_crear_conteo(
  IN  p_codigo               VARCHAR(40),
  IN  p_almacen_id           INT UNSIGNED,
  IN  p_sucursal_id          INT UNSIGNED,
  IN  p_tipo_conteo          VARCHAR(20),
  IN  p_descripcion_alcance TEXT,
  IN  p_responsable_id       INT UNSIGNED,
  IN  p_alcance_producto_ids JSON,
  OUT p_conteo_id            INT UNSIGNED
)
BEGIN
  DECLARE v_conflicto INT DEFAULT 0;
  DECLARE v_idx       INT DEFAULT 0;
  DECLARE v_len       INT DEFAULT 0;
  DECLARE v_prod_id    INT UNSIGNED;

  IF p_descripcion_alcance IS NULL OR TRIM(p_descripcion_alcance) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT_REF: el conteo requiere describir el alcance.';
  END IF;

  SELECT COUNT(*) INTO v_conflicto
  FROM conteo_fisico
  WHERE almacen_id = p_almacen_id AND estado NOT IN ('cerrado','cancelado');

  IF v_conflicto > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONFLICT: ya existe una sesión de conteo activa para el almacén.';
  END IF;

  START TRANSACTION;

  INSERT INTO conteo_fisico (
    codigo, almacen_id, sucursal_id, tipo_conteo, descripcion_alcance,
    estado, responsable_id, bloqueo_activo, version, dominio_id
  ) VALUES (
    p_codigo, p_almacen_id, p_sucursal_id, p_tipo_conteo, TRIM(p_descripcion_alcance),
    'borrador', p_responsable_id, 0, 1, fn_inv_uuid()
  );
  SET p_conteo_id = LAST_INSERT_ID();

  SET v_len = COALESCE(JSON_LENGTH(p_alcance_producto_ids), 0);
  WHILE v_idx < v_len DO
    SET v_prod_id = JSON_UNQUOTE(JSON_EXTRACT(p_alcance_producto_ids, CONCAT('$[', v_idx, ']')));

    INSERT INTO conteo_alcance_producto (
      conteo_id, producto_id, existencia_actual, stock_minimo, seleccionado, dominio_id
    )
    SELECT p_conteo_id, v_prod_id, COALESCE(i.stock, 0), COALESCE(i.stock_minimo, 0), 1, fn_inv_uuid()
    FROM productos p
    LEFT JOIN inventario i ON i.producto_id = p.id AND i.almacen_id = p_almacen_id
    WHERE p.id = v_prod_id;

    SET v_idx = v_idx + 1;
  END WHILE;

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_inv_abrir_conteo$$
CREATE PROCEDURE sp_inv_abrir_conteo(
  IN  p_conteo_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED,
  OUT p_lineas_creadas   INT UNSIGNED
)
BEGIN
  DECLARE v_estado      VARCHAR(20);
  DECLARE v_version     INT UNSIGNED;
  DECLARE v_almacen_id  INT UNSIGNED;
  DECLARE v_dominio_id  CHAR(36);
  DECLARE v_conflicto   INT DEFAULT 0;
  DECLARE v_alcance_cnt INT DEFAULT 0;
  DECLARE v_scope_cnt   INT DEFAULT 0;

  START TRANSACTION;

  SELECT estado, version, almacen_id, dominio_id
    INTO v_estado, v_version, v_almacen_id, v_dominio_id
  FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado <> 'borrador' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se puede abrir un conteo en borrador.';
  END IF;

  SELECT COUNT(*) INTO v_conflicto
  FROM conteo_fisico
  WHERE almacen_id = v_almacen_id AND estado NOT IN ('cerrado','cancelado') AND id <> p_conteo_id;

  IF v_conflicto > 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONFLICT: ya existe otra sesión de conteo activa para el almacén.';
  END IF;

  SELECT COUNT(*) INTO v_alcance_cnt
  FROM conteo_alcance_producto WHERE conteo_id = p_conteo_id AND seleccionado = 1;

  SELECT COUNT(*) INTO v_scope_cnt
  FROM inventario i
  WHERE i.almacen_id = v_almacen_id
    AND (
      v_alcance_cnt = 0
      OR i.producto_id IN (
        SELECT producto_id FROM conteo_alcance_producto
        WHERE conteo_id = p_conteo_id AND seleccionado = 1
      )
    );

  IF v_scope_cnt = 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VALIDATION: no hay existencias en el alcance para tomar snapshot.';
  END IF;

  INSERT INTO snapshot_conteo (conteo_id, producto_id, cantidad_teorica, costo_referencia, version, dominio_id)
  SELECT p_conteo_id, i.producto_id, i.stock, p.costo, 1, fn_inv_uuid()
  FROM inventario i
  JOIN productos p ON p.id = i.producto_id
  WHERE i.almacen_id = v_almacen_id
    AND (
      v_alcance_cnt = 0
      OR i.producto_id IN (
        SELECT producto_id FROM conteo_alcance_producto
        WHERE conteo_id = p_conteo_id AND seleccionado = 1
      )
    );

  INSERT INTO linea_conteo (conteo_id, snapshot_id, producto_id, estado_linea, version, dominio_id)
  SELECT p_conteo_id, s.id, s.producto_id, 'pendiente', 1, fn_inv_uuid()
  FROM snapshot_conteo s
  WHERE s.conteo_id = p_conteo_id;

  SET p_lineas_creadas = v_scope_cnt;

  UPDATE conteo_fisico
     SET estado = 'abierto', bloqueo_activo = 1, version = version + 1
   WHERE id = p_conteo_id;

  UPDATE almacenes
     SET bloqueado_por_conteo = 1, conteo_bloqueante_id = v_dominio_id
   WHERE id = v_almacen_id;

  UPDATE inventario
     SET bloqueado_por_conteo = 1, conteo_bloqueante_id = v_dominio_id
   WHERE almacen_id = v_almacen_id
     AND producto_id IN (SELECT producto_id FROM snapshot_conteo WHERE conteo_id = p_conteo_id);

  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_registrar_linea_conteo$$
CREATE PROCEDURE sp_inv_registrar_linea_conteo(
  IN  p_conteo_id        INT UNSIGNED,
  IN  p_linea_id         INT UNSIGNED,
  IN  p_cantidad_contada INT,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado      VARCHAR(20);
  DECLARE v_version     INT UNSIGNED;
  DECLARE v_snapshot_id INT UNSIGNED;
  DECLARE v_teorica     INT;

  IF p_cantidad_contada IS NULL OR p_cantidad_contada < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: la cantidad contada debe ser un entero >= 0.';
  END IF;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado NOT IN ('abierto','en_conteo') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se registran cantidades en conteo abierto o en captura.';
  END IF;

  SELECT snapshot_id INTO v_snapshot_id
  FROM linea_conteo WHERE id = p_linea_id AND conteo_id = p_conteo_id FOR UPDATE;

  IF v_snapshot_id IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT_REF: línea de conteo no encontrada.';
  END IF;

  SELECT cantidad_teorica INTO v_teorica FROM snapshot_conteo WHERE id = v_snapshot_id;

  UPDATE linea_conteo
     SET cantidad_contada = p_cantidad_contada,
         cantidad_aceptada = p_cantidad_contada,
         diferencia = p_cantidad_contada - v_teorica,
         estado_linea = 'contada',
         version = version + 1
   WHERE id = p_linea_id;

  UPDATE conteo_fisico SET estado = 'en_conteo', version = version + 1 WHERE id = p_conteo_id;

  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_enviar_revision_conteo$$
CREATE PROCEDURE sp_inv_enviar_revision_conteo(
  IN  p_conteo_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado     VARCHAR(20);
  DECLARE v_version    INT UNSIGNED;
  DECLARE v_pendientes  INT DEFAULT 0;

  START TRANSACTION;

  SELECT estado, version INTO v_estado, v_version FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado NOT IN ('en_conteo','abierto') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: el conteo no está listo para revisión.';
  END IF;

  SELECT COUNT(*) INTO v_pendientes
  FROM linea_conteo WHERE conteo_id = p_conteo_id AND estado_linea = 'pendiente';

  IF v_pendientes > 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_QUANTITY: todas las líneas del alcance deben estar contadas antes de la revisión.';
  END IF;

  UPDATE conteo_fisico SET estado = 'en_revision', version = version + 1 WHERE id = p_conteo_id;
  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_clasificar_linea_conteo$$
CREATE PROCEDURE sp_inv_clasificar_linea_conteo(
  IN  p_conteo_id             INT UNSIGNED,
  IN  p_linea_id              INT UNSIGNED,
  IN  p_expected_version      INT UNSIGNED,
  IN  p_clasificacion         VARCHAR(20),
  IN  p_regularizacion_tipo   VARCHAR(20),
  IN  p_regularizacion_id     INT UNSIGNED,
  OUT p_version               INT UNSIGNED
)
BEGIN
  DECLARE v_estado_conteo  VARCHAR(20);
  DECLARE v_version_conteo INT UNSIGNED;
  DECLARE v_diferencia     INT;
  DECLARE v_existe         INT UNSIGNED;
  DECLARE v_estado_linea   VARCHAR(20);

  START TRANSACTION;

  SELECT estado, version INTO v_estado_conteo, v_version_conteo
  FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado_conteo IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version_conteo <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado_conteo <> 'en_revision' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se clasifica en revisión.';
  END IF;

  SELECT id, diferencia INTO v_existe, v_diferencia
  FROM linea_conteo WHERE id = p_linea_id AND conteo_id = p_conteo_id FOR UPDATE;

  IF v_existe IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT_REF: línea de conteo no encontrada.';
  END IF;

  SET v_diferencia = COALESCE(v_diferencia, 0);
  IF v_diferencia = 0 AND p_clasificacion <> 'cuadra' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ADJUSTMENT: una línea sin diferencia solo puede clasificarse como cuadra.';
  END IF;
  IF v_diferencia <> 0 AND p_clasificacion = 'cuadra' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ADJUSTMENT: una línea con diferencia no puede clasificarse como cuadra.';
  END IF;

  SET v_estado_linea = IF(
    p_regularizacion_tipo IS NOT NULL AND p_clasificacion <> 'investigacion',
    'regularizada',
    'revisada'
  );

  UPDATE linea_conteo
     SET clasificacion = p_clasificacion,
         estado_linea = v_estado_linea,
         regularizacion_tipo = p_regularizacion_tipo,
         regularizacion_id = p_regularizacion_id,
         version = version + 1
   WHERE id = p_linea_id;

  UPDATE conteo_fisico SET version = version + 1 WHERE id = p_conteo_id;

  COMMIT;

  SELECT version INTO p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_cerrar_conteo$$
CREATE PROCEDURE sp_inv_cerrar_conteo(
  IN  p_conteo_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado     VARCHAR(20);
  DECLARE v_version    INT UNSIGNED;
  DECLARE v_almacen_id INT UNSIGNED;
  DECLARE v_dominio_id CHAR(36);
  DECLARE v_malas      INT DEFAULT 0;

  START TRANSACTION;

  SELECT estado, version, almacen_id, dominio_id
    INTO v_estado, v_version, v_almacen_id, v_dominio_id
  FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado <> 'en_revision' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se cierra un conteo en revisión.';
  END IF;

  SELECT COUNT(*) INTO v_malas
  FROM linea_conteo
  WHERE conteo_id = p_conteo_id
    AND (
      (COALESCE(diferencia, 0) = 0 AND (clasificacion IS NULL OR clasificacion <> 'cuadra'))
      OR (
        COALESCE(diferencia, 0) <> 0
        AND (
          clasificacion IS NULL
          OR clasificacion = 'investigacion'
          OR estado_linea <> 'regularizada'
          OR regularizacion_id IS NULL
        )
      )
    );

  IF v_malas > 0 THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ADJUSTMENT: cierre estricto, hay líneas sin clasificación o regularización.';
  END IF;

  UPDATE conteo_fisico SET estado = 'cerrado', bloqueo_activo = 0, version = version + 1 WHERE id = p_conteo_id;

  UPDATE almacenes
     SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
   WHERE id = v_almacen_id AND conteo_bloqueante_id = v_dominio_id;

  UPDATE inventario
     SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
   WHERE almacen_id = v_almacen_id AND conteo_bloqueante_id = v_dominio_id;

  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DROP PROCEDURE IF EXISTS sp_inv_cancelar_conteo$$
CREATE PROCEDURE sp_inv_cancelar_conteo(
  IN  p_conteo_id        INT UNSIGNED,
  IN  p_expected_version INT UNSIGNED,
  OUT p_estado           VARCHAR(20),
  OUT p_version          INT UNSIGNED
)
BEGIN
  DECLARE v_estado         VARCHAR(20);
  DECLARE v_version        INT UNSIGNED;
  DECLARE v_almacen_id     INT UNSIGNED;
  DECLARE v_dominio_id     CHAR(36);
  DECLARE v_estaba_activo  TINYINT(1);

  START TRANSACTION;

  SELECT estado, version, almacen_id, dominio_id, bloqueo_activo
    INTO v_estado, v_version, v_almacen_id, v_dominio_id, v_estaba_activo
  FROM conteo_fisico WHERE id = p_conteo_id FOR UPDATE;

  IF v_estado IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND: conteo no encontrado.';
  END IF;
  IF v_version <> p_expected_version THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERSION_CONFLICT: versión del conteo no coincide.';
  END IF;
  IF v_estado NOT IN ('borrador','abierto') THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_MOVEMENT_TYPE: solo se cancela un conteo en borrador o abierto.';
  END IF;

  UPDATE conteo_fisico SET estado = 'cancelado', bloqueo_activo = 0, version = version + 1 WHERE id = p_conteo_id;

  IF v_estaba_activo = 1 THEN
    UPDATE almacenes
       SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
     WHERE id = v_almacen_id AND conteo_bloqueante_id = v_dominio_id;

    UPDATE inventario
       SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
     WHERE almacen_id = v_almacen_id AND conteo_bloqueante_id = v_dominio_id;
  END IF;

  COMMIT;

  SELECT estado, version INTO p_estado, p_version FROM conteo_fisico WHERE id = p_conteo_id;
END$$

DELIMITER ;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '10_procedimientos.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 10_procedimientos.sql aplicado.' AS resultado;
