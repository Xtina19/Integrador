-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 09_StoredProcedures.sql
-- Equivalente MySQL: database/mysql/inventario_definitivo/09_funciones.sql,
--                     10_procedimientos.sql, 11_triggers.sql
--
-- Conversión MySQL 8 -> SQL Server 2022 T-SQL. Reglas aplicadas:
--   - INT UNSIGNED               -> INT
--   - TINYINT(1)                 -> BIT
--   - TEXT / JSON                -> NVARCHAR(MAX)
--   - DELIMITER $$ / DROP ... $$ -> IF OBJECT_ID(...) IS NOT NULL DROP ...; GO
--   - SIGNAL SQLSTATE '45000'    -> THROW 50000, N'msg', 1;
--   - LAST_INSERT_ID()           -> CAST(SCOPE_IDENTITY() AS INT)
--   - START TRANSACTION/COMMIT/ROLLBACK -> BEGIN TRAN/COMMIT TRAN/ROLLBACK TRAN
--   - ... FOR UPDATE             -> ... WITH (UPDLOCK, ROWLOCK)
--   - IF(a,b,c)                  -> IIF(a,b,c) / CASE
--   - JSON_OBJECT('k', v)        -> JSON_OBJECT('k':v)  (nativo en SQL Server 2022)
--   - JSON_LENGTH/EXTRACT/UNQUOTE-> OPENJSON(...) WITH (...) / JSON_VALUE
--   - INSERT IGNORE              -> IF NOT EXISTS (...) INSERT ...
--   - ON DUPLICATE KEY UPDATE x=x (no-op) -> IF NOT EXISTS (...) INSERT ...
--   - LIMIT 1                    -> TOP (1)
--   - UUID() / fn_inv_uuid()     -> LOWER(CONVERT(CHAR(36), NEWID()))
--   - Parámetros JSON de líneas  -> NVARCHAR(MAX) + OPENJSON
--   - Cursores CONTINUE HANDLER  -> cursores T-SQL estándar con @@FETCH_STATUS
--
-- NOTA sobre NEWID() en funciones: SQL Server prohíbe llamar a funciones no
-- deterministas "con efecto lateral" (NEWID, RAND, ...) dentro de UDFs (error
-- 443). Se usa el patrón estándar de una vista auxiliar (dbo.vw_inv_newid)
-- para poder exponer fn_inv_uuid() como función escalar idéntica en firma a
-- la versión MySQL.
--
-- NOTA sobre triggers BEFORE de MySQL: SQL Server no tiene BEFORE triggers.
-- `inventario.estado_stock` se recalcula con triggers INSTEAD OF INSERT/UPDATE
-- (reemplazan la sentencia original y escriben la fila ya con estado_stock
-- calculado en la misma operación, equivalente exacto de un BEFORE trigger).
-- Los triggers de auditoría de estado (ajuste/transferencia/descarte/conteo)
-- son AFTER UPDATE set-based (usan INSERTED/DELETED unidos por id, sin
-- FOR EACH ROW) tal como pide la tarea.
--
-- NOTA sobre updated_at: `inventario` NO tiene un trigger updated_at aparte;
-- ese bump ya está incluido dentro del propio INSTEAD OF UPDATE de
-- estado_stock (ver sección de triggers de dominio) para evitar dos triggers
-- separados operando sobre la misma tabla en la misma operación.
-- =============================================================================

USE LibroSys;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================================================
-- SECCIÓN 1: FUNCIONES (equivalente de 09_funciones.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vista auxiliar requerida para poder usar NEWID() dentro de fn_inv_uuid().
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.vw_inv_newid', N'V') IS NOT NULL
  DROP VIEW dbo.vw_inv_newid;
GO
CREATE VIEW dbo.vw_inv_newid
AS
  SELECT NEWID() AS new_id;
GO

-- -----------------------------------------------------------------------------
-- fn_inv_uuid
-- Genera un identificador de dominio compatible con IIdGenerator (UUID v4).
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.fn_inv_uuid', N'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_inv_uuid;
GO
CREATE FUNCTION dbo.fn_inv_uuid()
RETURNS CHAR(36)
AS
BEGIN
  DECLARE @v_id CHAR(36);
  SELECT @v_id = LOWER(CONVERT(CHAR(36), new_id)) FROM dbo.vw_inv_newid;
  RETURN @v_id;
END
GO

-- -----------------------------------------------------------------------------
-- fn_inv_estado_stock
-- Espejo SQL de la regla aplicada por los triggers INSTEAD OF de inventario.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.fn_inv_estado_stock', N'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_inv_estado_stock;
GO
CREATE FUNCTION dbo.fn_inv_estado_stock(
  @p_stock  INT,
  @p_minimo INT
)
RETURNS NVARCHAR(20)
AS
BEGIN
  RETURN CASE
    WHEN @p_stock <= 0 THEN N'agotado'
    WHEN @p_stock <= @p_minimo THEN N'bajo'
    ELSE N'normal'
  END;
END
GO

-- -----------------------------------------------------------------------------
-- fn_inv_sentido_movimiento
-- Espejo SQL de sentidoDe() en TipoMovimiento.ts. Para 'ajuste' y
-- 'compensacion' el sentido depende del signo de la operación y no puede
-- inferirse solo del tipo; se devuelve NULL para que el llamador decida.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.fn_inv_sentido_movimiento', N'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_inv_sentido_movimiento;
GO
CREATE FUNCTION dbo.fn_inv_sentido_movimiento(
  @p_tipo_movimiento NVARCHAR(30)
)
RETURNS NVARCHAR(10)
AS
BEGIN
  RETURN CASE @p_tipo_movimiento
    WHEN N'transferencia_entrada' THEN N'entrada'
    WHEN N'recepcion'             THEN N'entrada'
    WHEN N'devolucion_entrada'    THEN N'entrada'
    WHEN N'transferencia_salida'  THEN N'salida'
    WHEN N'descarte'              THEN N'salida'
    WHEN N'venta'                 THEN N'salida'
    ELSE NULL
  END;
END
GO

-- -----------------------------------------------------------------------------
-- fn_inv_valor_existencia
-- Valor monetario de la existencia de un producto en un almacén
-- (stock * costo unitario, estándar DECIMAL(18,2)).
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.fn_inv_valor_existencia', N'FN') IS NOT NULL
  DROP FUNCTION dbo.fn_inv_valor_existencia;
GO
CREATE FUNCTION dbo.fn_inv_valor_existencia(
  @p_producto_id INT,
  @p_almacen_id  INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
  DECLARE @v_valor DECIMAL(18,2) = 0;

  SELECT TOP (1) @v_valor = COALESCE(i.stock * p.costo, 0)
  FROM dbo.inventario i
  JOIN dbo.productos p ON p.id = i.producto_id
  WHERE i.producto_id = @p_producto_id AND i.almacen_id = @p_almacen_id;

  RETURN COALESCE(@v_valor, 0);
END
GO

-- =============================================================================
-- SECCIÓN 2: PROCEDIMIENTOS (equivalente de 10_procedimientos.sql)
-- =============================================================================

-- =============================================================================
-- NÚCLEO: MOVIMIENTOS DE INVENTARIO (equivalente de InventoryEngine)
-- =============================================================================

IF OBJECT_ID(N'dbo.sp_inv_registrar_movimiento', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_registrar_movimiento;
GO
CREATE PROCEDURE dbo.sp_inv_registrar_movimiento(
  @p_idempotency_key            NVARCHAR(100),
  @p_tipo_movimiento            NVARCHAR(30),
  @p_sentido                    NVARCHAR(10),
  @p_producto_id                INT,
  @p_almacen_id                 INT,
  @p_cantidad                   INT,
  @p_documento_tipo             NVARCHAR(40),
  @p_documento_id               NVARCHAR(64),
  @p_documento_linea_id         NVARCHAR(64),
  @p_usuario_id                 INT,
  @p_motivo_codigo              NVARCHAR(40),
  @p_observacion                NVARCHAR(255),
  @p_movimiento_compensa_id     INT,
  @p_permitir_bloqueo_conteo_id CHAR(36),
  @p_ignorar_bloqueo            BIT,
  @p_movimiento_id              INT OUTPUT,
  @p_saldo_posterior            INT OUTPUT,
  @p_replayed                   BIT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_stock                     INT;
  DECLARE @v_version                   INT;
  DECLARE @v_bloqueado                 BIT;
  DECLARE @v_conteo_bloqueante         CHAR(36);
  DECLARE @v_almacen_bloqueado         BIT;
  DECLARE @v_almacen_conteo_bloqueante CHAR(36);
  DECLARE @v_saldo_anterior            INT;
  DECLARE @v_saldo_nuevo               INT;
  DECLARE @v_delta                     INT;
  DECLARE @v_existing_id               INT;

  IF @p_idempotency_key IS NULL OR LTRIM(RTRIM(@p_idempotency_key)) = N''
    THROW 50000, N'MISSING_IDEMPOTENCY_KEY: la clave de idempotencia es obligatoria.', 1;
  IF @p_usuario_id IS NULL
    THROW 50000, N'MISSING_ACTOR: el movimiento requiere un usuario actor.', 1;
  IF @p_cantidad IS NULL OR @p_cantidad = 0
    THROW 50000, N'INVALID_QUANTITY: la cantidad del movimiento debe ser mayor que 0.', 1;
  IF @p_sentido NOT IN (N'entrada', N'salida')
    THROW 50000, N'INVALID_MOVEMENT_TYPE: sentido inválido, debe ser entrada o salida.', 1;

  SET @v_existing_id = NULL;
  SELECT TOP (1) @v_existing_id = id, @p_saldo_posterior = saldo_posterior
  FROM dbo.movimiento_inventario
  WHERE idempotency_key = @p_idempotency_key;

  IF @v_existing_id IS NOT NULL
  BEGIN
    SET @p_movimiento_id = @v_existing_id;
    SET @p_replayed = 1;
  END
  ELSE
  BEGIN
    BEGIN TRAN;

    IF NOT EXISTS (
      SELECT 1 FROM dbo.inventario
      WHERE producto_id = @p_producto_id AND almacen_id = @p_almacen_id
    )
    BEGIN
      INSERT INTO dbo.inventario (producto_id, almacen_id, stock, stock_minimo)
      VALUES (@p_producto_id, @p_almacen_id, 0, 10);
    END

    SELECT @v_stock = stock, @v_version = version,
           @v_bloqueado = bloqueado_por_conteo, @v_conteo_bloqueante = conteo_bloqueante_id
    FROM dbo.inventario WITH (UPDLOCK, ROWLOCK)
    WHERE producto_id = @p_producto_id AND almacen_id = @p_almacen_id;

    SELECT @v_almacen_bloqueado = bloqueado_por_conteo, @v_almacen_conteo_bloqueante = conteo_bloqueante_id
    FROM dbo.almacenes WITH (UPDLOCK, ROWLOCK)
    WHERE id = @p_almacen_id;

    IF @p_ignorar_bloqueo = 0
       AND (@v_bloqueado = 1 OR @v_almacen_bloqueado = 1)
       AND NOT (
             @p_permitir_bloqueo_conteo_id IS NOT NULL
             AND (@v_conteo_bloqueante = @p_permitir_bloqueo_conteo_id
                  OR @v_almacen_conteo_bloqueante = @p_permitir_bloqueo_conteo_id)
           )
    BEGIN
      ROLLBACK TRAN;
      THROW 50000, N'ALMACEN_BLOQUEADO: el almacén está bloqueado por un conteo físico activo.', 1;
    END

    SET @v_saldo_anterior = @v_stock;
    SET @v_delta = IIF(@p_sentido = N'entrada', @p_cantidad, -@p_cantidad);
    SET @v_saldo_nuevo = @v_saldo_anterior + @v_delta;

    IF @v_saldo_nuevo < 0
    BEGIN
      ROLLBACK TRAN;
      THROW 50000, N'NEGATIVE_STOCK: la operación produciría stock negativo.', 1;
    END

    UPDATE dbo.inventario
       SET stock = @v_saldo_nuevo, version = version + 1
     WHERE producto_id = @p_producto_id AND almacen_id = @p_almacen_id;

    INSERT INTO dbo.movimiento_inventario (
      producto_id, almacen_id, usuario_id, tipo_movimiento, cantidad,
      saldo_anterior, saldo_posterior, referencia, referencia_tipo, observaciones,
      idempotency_key, motivo_codigo, movimiento_compensa_id, dominio_id, sentido,
      documento_tipo, documento_id, documento_linea_id
    ) VALUES (
      @p_producto_id, @p_almacen_id, @p_usuario_id, @p_tipo_movimiento, @p_cantidad,
      @v_saldo_anterior, @v_saldo_nuevo, @p_documento_id, @p_documento_tipo, @p_observacion,
      @p_idempotency_key, @p_motivo_codigo, @p_movimiento_compensa_id, dbo.fn_inv_uuid(), @p_sentido,
      @p_documento_tipo, @p_documento_id, @p_documento_linea_id
    );

    SET @p_movimiento_id = CAST(SCOPE_IDENTITY() AS INT);

    INSERT INTO dbo.auditoria_inventario (
      tipo_accion, usuario_id, movimiento_id, documento_tipo, documento_id,
      producto_id, almacen_id, valor_antes, valor_despues, detalle, idempotency_key, resultado
    ) VALUES (
      N'movimiento', @p_usuario_id, @p_movimiento_id, @p_documento_tipo, @p_documento_id,
      @p_producto_id, @p_almacen_id,
      JSON_OBJECT('saldo':@v_saldo_anterior, 'version':@v_version),
      JSON_OBJECT('saldo':@v_saldo_nuevo, 'version':@v_version + 1),
      CONCAT(N'Movimiento ', @p_tipo_movimiento, N' (', @p_sentido, N')'),
      @p_idempotency_key, N'OK'
    );

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (
        @p_idempotency_key, @p_tipo_movimiento, @p_documento_tipo, @p_documento_id,
        JSON_OBJECT('movimientoId':@p_movimiento_id, 'saldoPosterior':@v_saldo_nuevo)
      );
    END

    COMMIT TRAN;

    SET @p_saldo_posterior = @v_saldo_nuevo;
    SET @p_replayed = 0;
  END
END
GO

-- -----------------------------------------------------------------------------
-- sp_actualizar_inventario — RECREADO por compatibilidad. Misma firma que la
-- versión legada, delega en sp_inv_registrar_movimiento.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_actualizar_inventario', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_actualizar_inventario;
GO
CREATE PROCEDURE dbo.sp_actualizar_inventario(
  @p_producto_id     INT,
  @p_almacen_id      INT,
  @p_cantidad        INT,
  @p_tipo_movimiento NVARCHAR(30),
  @p_referencia      NVARCHAR(50),
  @p_referencia_tipo NVARCHAR(50),
  @p_usuario_id      INT,
  @p_observaciones   NVARCHAR(255)
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_tipo         NVARCHAR(30);
  DECLARE @v_sentido      NVARCHAR(10);
  DECLARE @v_cantidad_abs INT;
  DECLARE @v_mov_id       INT;
  DECLARE @v_saldo        INT;
  DECLARE @v_replayed     BIT;

  IF @p_cantidad IS NULL OR @p_cantidad = 0
    THROW 50000, N'INVALID_QUANTITY: la cantidad del movimiento debe ser distinta de 0.', 1;

  SET @v_tipo = CASE @p_tipo_movimiento
    WHEN N'entrada' THEN N'recepcion'
    WHEN N'salida'  THEN N'ajuste'
    ELSE @p_tipo_movimiento
  END;
  SET @v_sentido = IIF(@p_cantidad >= 0, N'entrada', N'salida');
  SET @v_cantidad_abs = ABS(@p_cantidad);

  -- SQL Server: EXEC no admite expresiones en parámetros con nombre
  DECLARE @v_idem NVARCHAR(100) = CONCAT(N'legacy:', dbo.fn_inv_uuid());

  EXEC dbo.sp_inv_registrar_movimiento
    @p_idempotency_key            = @v_idem,
    @p_tipo_movimiento            = @v_tipo,
    @p_sentido                    = @v_sentido,
    @p_producto_id                = @p_producto_id,
    @p_almacen_id                 = @p_almacen_id,
    @p_cantidad                   = @v_cantidad_abs,
    @p_documento_tipo             = @p_referencia_tipo,
    @p_documento_id               = @p_referencia,
    @p_documento_linea_id         = NULL,
    @p_usuario_id                 = @p_usuario_id,
    @p_motivo_codigo              = NULL,
    @p_observacion                = @p_observaciones,
    @p_movimiento_compensa_id     = NULL,
    @p_permitir_bloqueo_conteo_id = NULL,
    @p_ignorar_bloqueo            = 0,
    @p_movimiento_id              = @v_mov_id OUTPUT,
    @p_saldo_posterior            = @v_saldo OUTPUT,
    @p_replayed                   = @v_replayed OUTPUT;
END
GO

-- =============================================================================
-- TRANSFERENCIAS
-- =============================================================================

IF OBJECT_ID(N'dbo.sp_inv_crear_transferencia', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_crear_transferencia;
GO
CREATE PROCEDURE dbo.sp_inv_crear_transferencia(
  @p_codigo             NVARCHAR(30),
  @p_almacen_origen_id  INT,
  @p_almacen_destino_id INT,
  @p_solicitante_id     INT,
  @p_lineas             NVARCHAR(MAX),
  @p_observacion        NVARCHAR(500),
  @p_solicitar          BIT,
  @p_transferencia_id   INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_len    INT;
  DECLARE @v_estado NVARCHAR(20);

  IF @p_almacen_origen_id = @p_almacen_destino_id
    THROW 50000, N'INVALID_DOCUMENT_REF: el almacén origen y destino deben ser distintos.', 1;

  SET @v_len = (SELECT COUNT(*) FROM OPENJSON(@p_lineas));
  IF @v_len IS NULL OR @v_len = 0
    THROW 50000, N'INVALID_QUANTITY: la transferencia requiere al menos una línea.', 1;

  SET @v_estado = IIF(@p_solicitar = 0, N'borrador', N'solicitada');

  BEGIN TRAN;

  INSERT INTO dbo.transferencia (
    codigo, almacen_origen_id, almacen_destino_id, usuario_solicita_id,
    estado, observaciones, version, dominio_id
  ) VALUES (
    @p_codigo, @p_almacen_origen_id, @p_almacen_destino_id, @p_solicitante_id,
    @v_estado, @p_observacion, 1, dbo.fn_inv_uuid()
  );
  SET @p_transferencia_id = CAST(SCOPE_IDENTITY() AS INT);

  INSERT INTO dbo.detalle_transferencia (
    transferencia_id, producto_id, cantidad_solicitada, cantidad_despachada,
    cantidad_recibida, cantidad_faltante, cantidad_danada, dominio_id
  )
  SELECT
    @p_transferencia_id, j.producto_id, j.cantidad_solicitada, 0, 0, 0, 0, dbo.fn_inv_uuid()
  FROM OPENJSON(@p_lineas) WITH (
    producto_id          INT '$.producto_id',
    cantidad_solicitada  INT '$.cantidad_solicitada'
  ) AS j;

  COMMIT TRAN;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_solicitar_transferencia', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_solicitar_transferencia;
GO
CREATE PROCEDURE dbo.sp_inv_solicitar_transferencia(
  @p_transferencia_id INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version
  FROM dbo.transferencia WITH (UPDLOCK, ROWLOCK) WHERE id = @p_transferencia_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: transferencia no encontrada.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión de la transferencia no coincide.', 1;
  END
  IF @v_estado <> N'borrador'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se solicita una transferencia en borrador.', 1;
  END

  UPDATE dbo.transferencia SET estado = N'solicitada', version = version + 1 WHERE id = @p_transferencia_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_despachar_transferencia', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_despachar_transferencia;
GO
CREATE PROCEDURE dbo.sp_inv_despachar_transferencia(
  @p_transferencia_id INT,
  @p_actor_id         INT,
  @p_expected_version INT,
  @p_idempotency_key  NVARCHAR(100),
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado           NVARCHAR(20);
  DECLARE @v_version          INT;
  DECLARE @v_almacen_origen   INT;
  DECLARE @v_origen_bloqueado BIT;
  DECLARE @v_detalle_id       INT;
  DECLARE @v_idem_linea       NVARCHAR(160);
  DECLARE @v_producto_id      INT;
  DECLARE @v_cantidad         INT;
  DECLARE @v_mov_id           INT;
  DECLARE @v_saldo            INT;
  DECLARE @v_replayed         BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_origen = almacen_origen_id
    FROM dbo.transferencia WITH (UPDLOCK, ROWLOCK) WHERE id = @p_transferencia_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: transferencia no encontrada.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión de la transferencia no coincide.', 1;
    IF @v_estado <> N'solicitada'
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se despacha una transferencia solicitada.', 1;

    SELECT @v_origen_bloqueado = bloqueado_por_conteo FROM dbo.almacenes WHERE id = @v_almacen_origen;
    IF @v_origen_bloqueado = 1
      THROW 50000, N'ALMACEN_BLOQUEADO: el almacén origen está bloqueado por conteo.', 1;

    BEGIN TRAN;

    UPDATE dbo.detalle_transferencia
       SET cantidad_despachada = cantidad_solicitada
     WHERE transferencia_id = @p_transferencia_id;

    DECLARE cur_lineas CURSOR LOCAL FAST_FORWARD FOR
      SELECT id, producto_id, cantidad_solicitada
      FROM dbo.detalle_transferencia
      WHERE transferencia_id = @p_transferencia_id;

    OPEN cur_lineas;
    FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);
      EXEC dbo.sp_inv_registrar_movimiento
        @p_idempotency_key            = @v_idem_linea,
        @p_tipo_movimiento            = N'transferencia_salida',
        @p_sentido                    = N'salida',
        @p_producto_id                = @v_producto_id,
        @p_almacen_id                 = @v_almacen_origen,
        @p_cantidad                   = @v_cantidad,
        @p_documento_tipo             = N'transferencia',
        @p_documento_id               = @p_transferencia_id,
        @p_documento_linea_id         = @v_detalle_id,
        @p_usuario_id                 = @p_actor_id,
        @p_motivo_codigo              = NULL,
        @p_observacion                = NULL,
        @p_movimiento_compensa_id     = NULL,
        @p_permitir_bloqueo_conteo_id = NULL,
        @p_ignorar_bloqueo            = 1,
        @p_movimiento_id              = @v_mov_id OUTPUT,
        @p_saldo_posterior            = @v_saldo OUTPUT,
        @p_replayed                   = @v_replayed OUTPUT;

      FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad;
    END
    CLOSE cur_lineas;
    DEALLOCATE cur_lineas;

    UPDATE dbo.transferencia SET estado = N'en_transito', version = version + 1 WHERE id = @p_transferencia_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'despachar_transferencia', N'transferencia', @p_transferencia_id,
              JSON_OBJECT('id':@p_transferencia_id, 'estado':N'en_transito'));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
  END
END
GO

IF OBJECT_ID(N'dbo.sp_inv_recibir_transferencia', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_recibir_transferencia;
GO
CREATE PROCEDURE dbo.sp_inv_recibir_transferencia(
  @p_transferencia_id INT,
  @p_actor_id         INT,
  @p_expected_version INT,
  @p_idempotency_key  NVARCHAR(100),
  @p_recepciones      NVARCHAR(MAX),
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado            NVARCHAR(20);
  DECLARE @v_version           INT;
  DECLARE @v_almacen_destino   INT;
  DECLARE @v_destino_bloqueado BIT;
  DECLARE @v_len               INT;
  DECLARE @v_detalle_id        INT;
  DECLARE @v_idem_linea        NVARCHAR(160);
  DECLARE @v_producto_id       INT;
  DECLARE @v_cant_recibida     INT;
  DECLARE @v_cant_faltante     INT;
  DECLARE @v_cant_danada       INT;
  DECLARE @v_despachada        INT;
  DECLARE @v_recibida_prev     INT;
  DECLARE @v_faltante_prev     INT;
  DECLARE @v_danada_prev       INT;
  DECLARE @v_pendiente         INT;
  DECLARE @v_completa          INT;
  DECLARE @v_mov_id            INT;
  DECLARE @v_saldo             INT;
  DECLARE @v_replayed          BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_destino = almacen_destino_id
    FROM dbo.transferencia WITH (UPDLOCK, ROWLOCK) WHERE id = @p_transferencia_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: transferencia no encontrada.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión de la transferencia no coincide.', 1;
    IF @v_estado NOT IN (N'en_transito', N'recibida_parcial')
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se recibe una transferencia en tránsito o parcial.', 1;

    SELECT @v_destino_bloqueado = bloqueado_por_conteo FROM dbo.almacenes WHERE id = @v_almacen_destino;
    IF @v_destino_bloqueado = 1
      THROW 50000, N'ALMACEN_BLOQUEADO: el almacén destino está bloqueado por conteo.', 1;

    SET @v_len = (SELECT COUNT(*) FROM OPENJSON(@p_recepciones));
    IF @v_len IS NULL OR @v_len = 0
      THROW 50000, N'INVALID_QUANTITY: debe indicar al menos una recepción.', 1;

    BEGIN TRAN;

    DECLARE cur_recepciones CURSOR LOCAL FAST_FORWARD FOR
      SELECT detalle_id, COALESCE(cantidad_recibida, 0), COALESCE(cantidad_faltante, 0), COALESCE(cantidad_danada, 0)
      FROM OPENJSON(@p_recepciones) WITH (
        detalle_id        INT '$.detalle_id',
        cantidad_recibida INT '$.cantidad_recibida',
        cantidad_faltante INT '$.cantidad_faltante',
        cantidad_danada   INT '$.cantidad_danada'
      );

    OPEN cur_recepciones;
    FETCH NEXT FROM cur_recepciones INTO @v_detalle_id, @v_cant_recibida, @v_cant_faltante, @v_cant_danada;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      SELECT @v_producto_id = producto_id, @v_despachada = cantidad_despachada,
             @v_recibida_prev = cantidad_recibida, @v_faltante_prev = cantidad_faltante, @v_danada_prev = cantidad_danada
      FROM dbo.detalle_transferencia WITH (UPDLOCK, ROWLOCK)
      WHERE id = @v_detalle_id AND transferencia_id = @p_transferencia_id;

      IF @v_producto_id IS NULL
      BEGIN
        ROLLBACK TRAN;
        THROW 50000, N'INVALID_DOCUMENT_REF: línea de transferencia no encontrada.', 1;
      END

      SET @v_pendiente = @v_despachada - @v_recibida_prev - @v_faltante_prev - @v_danada_prev;
      IF (@v_cant_recibida + @v_cant_faltante + @v_cant_danada) > @v_pendiente
      BEGIN
        ROLLBACK TRAN;
        THROW 50000, N'INVALID_QUANTITY: la recepción supera lo pendiente de la línea.', 1;
      END

      IF @v_cant_recibida > 0
      BEGIN
        SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);
        EXEC dbo.sp_inv_registrar_movimiento
          @p_idempotency_key            = @v_idem_linea,
          @p_tipo_movimiento            = N'transferencia_entrada',
          @p_sentido                    = N'entrada',
          @p_producto_id                = @v_producto_id,
          @p_almacen_id                 = @v_almacen_destino,
          @p_cantidad                   = @v_cant_recibida,
          @p_documento_tipo             = N'transferencia',
          @p_documento_id               = @p_transferencia_id,
          @p_documento_linea_id         = @v_detalle_id,
          @p_usuario_id                 = @p_actor_id,
          @p_motivo_codigo              = NULL,
          @p_observacion                = NULL,
          @p_movimiento_compensa_id     = NULL,
          @p_permitir_bloqueo_conteo_id = NULL,
          @p_ignorar_bloqueo            = 1,
          @p_movimiento_id              = @v_mov_id OUTPUT,
          @p_saldo_posterior            = @v_saldo OUTPUT,
          @p_replayed                   = @v_replayed OUTPUT;
      END

      UPDATE dbo.detalle_transferencia
         SET cantidad_recibida = cantidad_recibida + @v_cant_recibida,
             cantidad_faltante = cantidad_faltante + @v_cant_faltante,
             cantidad_danada   = cantidad_danada + @v_cant_danada
       WHERE id = @v_detalle_id;

      FETCH NEXT FROM cur_recepciones INTO @v_detalle_id, @v_cant_recibida, @v_cant_faltante, @v_cant_danada;
    END
    CLOSE cur_recepciones;
    DEALLOCATE cur_recepciones;

    SELECT @v_completa = COUNT(*)
    FROM dbo.detalle_transferencia
    WHERE transferencia_id = @p_transferencia_id
      AND (cantidad_recibida + cantidad_faltante + cantidad_danada) <> cantidad_despachada;

    UPDATE dbo.transferencia
       SET estado = IIF(@v_completa = 0, N'recibida', N'recibida_parcial'),
           version = version + 1
     WHERE id = @p_transferencia_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'recibir_transferencia', N'transferencia', @p_transferencia_id,
              JSON_OBJECT('id':@p_transferencia_id, 'completa': CAST(IIF(@v_completa = 0, 1, 0) AS BIT)));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
  END
END
GO

IF OBJECT_ID(N'dbo.sp_inv_cancelar_transferencia', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_cancelar_transferencia;
GO
CREATE PROCEDURE dbo.sp_inv_cancelar_transferencia(
  @p_transferencia_id INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version
  FROM dbo.transferencia WITH (UPDLOCK, ROWLOCK) WHERE id = @p_transferencia_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: transferencia no encontrada.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión de la transferencia no coincide.', 1;
  END
  IF @v_estado NOT IN (N'borrador', N'solicitada')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se cancela una transferencia en borrador o solicitada.', 1;
  END

  UPDATE dbo.transferencia SET estado = N'cancelada', version = version + 1 WHERE id = @p_transferencia_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.transferencia WHERE id = @p_transferencia_id;
END
GO

-- =============================================================================
-- AJUSTES
-- =============================================================================

IF OBJECT_ID(N'dbo.sp_inv_crear_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_crear_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_crear_ajuste(
  @p_codigo                NVARCHAR(30),
  @p_almacen_id            INT,
  @p_tipo_ajuste           NVARCHAR(20),
  @p_solicitante_id        INT,
  @p_lineas                NVARCHAR(MAX),
  @p_observacion           NVARCHAR(MAX),
  @p_documento_origen_tipo NVARCHAR(40),
  @p_documento_origen_id   NVARCHAR(64),
  @p_solicitar             BIT,
  @p_ajuste_id             INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_len    INT;
  DECLARE @v_estado NVARCHAR(20);

  SET @v_len = (SELECT COUNT(*) FROM OPENJSON(@p_lineas));
  IF @v_len IS NULL OR @v_len = 0
    THROW 50000, N'INVALID_QUANTITY: el ajuste requiere al menos una línea.', 1;

  IF EXISTS (
    SELECT 1 FROM OPENJSON(@p_lineas) WITH (cantidad_objetivo INT '$.cantidad_objetivo') AS j
    WHERE j.cantidad_objetivo IS NULL OR j.cantidad_objetivo < 0
  )
    THROW 50000, N'INVALID_ADJUSTMENT: la cantidad objetivo debe ser un entero >= 0.', 1;

  IF EXISTS (
    SELECT 1 FROM OPENJSON(@p_lineas) WITH (diferencia INT '$.diferencia') AS j
    WHERE j.diferencia IS NULL OR j.diferencia = 0
  )
    THROW 50000, N'INVALID_ADJUSTMENT: cada línea de ajuste requiere diferencia distinta de cero.', 1;

  SET @v_estado = IIF(@p_solicitar = 0, N'borrador', N'solicitado');

  BEGIN TRAN;

  INSERT INTO dbo.ajuste (
    codigo, almacen_id, tipo_ajuste, estado, solicitante_id, version,
    observacion, documento_origen_tipo, documento_origen_id, dominio_id
  ) VALUES (
    @p_codigo, @p_almacen_id, @p_tipo_ajuste, @v_estado, @p_solicitante_id, 1,
    @p_observacion, @p_documento_origen_tipo, @p_documento_origen_id, dbo.fn_inv_uuid()
  );
  SET @p_ajuste_id = CAST(SCOPE_IDENTITY() AS INT);

  INSERT INTO dbo.ajuste_detalle (
    ajuste_id, producto_id, cantidad_objetivo, diferencia, motivo_codigo,
    linea_conteo_id, observacion, dominio_id
  )
  SELECT @p_ajuste_id, j.producto_id, j.cantidad_objetivo, j.diferencia, j.motivo_codigo,
         j.linea_conteo_id, j.observacion, dbo.fn_inv_uuid()
  FROM OPENJSON(@p_lineas) WITH (
    producto_id         INT            '$.producto_id',
    cantidad_objetivo    INT            '$.cantidad_objetivo',
    diferencia           INT            '$.diferencia',
    motivo_codigo        NVARCHAR(40)   '$.motivo_codigo',
    linea_conteo_id      INT            '$.linea_conteo_id',
    observacion          NVARCHAR(MAX)  '$.observacion'
  ) AS j;

  COMMIT TRAN;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_solicitar_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_solicitar_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_solicitar_ajuste(
  @p_ajuste_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
  END
  IF @v_estado <> N'borrador'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede solicitar un ajuste en borrador.', 1;
  END

  UPDATE dbo.ajuste SET estado = N'solicitado', version = version + 1 WHERE id = @p_ajuste_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_rechazar_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_rechazar_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_rechazar_ajuste(
  @p_ajuste_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
  END
  IF @v_estado <> N'solicitado'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede rechazar un ajuste solicitado.', 1;
  END

  UPDATE dbo.ajuste SET estado = N'rechazado', version = version + 1 WHERE id = @p_ajuste_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_cancelar_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_cancelar_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_cancelar_ajuste(
  @p_ajuste_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
  END
  IF @v_estado NOT IN (N'borrador', N'solicitado')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede cancelar un ajuste en borrador o solicitado.', 1;
  END

  UPDATE dbo.ajuste SET estado = N'cancelado', version = version + 1 WHERE id = @p_ajuste_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_aprobar_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_aprobar_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_aprobar_ajuste(
  @p_ajuste_id        INT,
  @p_aprobador_id     INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
  END
  IF @v_estado <> N'solicitado'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede aprobar un ajuste solicitado.', 1;
  END

  UPDATE dbo.ajuste SET estado = N'aprobado', aprobador_id = @p_aprobador_id, version = version + 1
   WHERE id = @p_ajuste_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_aplicar_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_aplicar_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_aplicar_ajuste(
  @p_ajuste_id                  INT,
  @p_actor_id                   INT,
  @p_expected_version           INT,
  @p_idempotency_key            NVARCHAR(100),
  @p_permitir_bloqueo_conteo_id CHAR(36),
  @p_estado                     NVARCHAR(20) OUTPUT,
  @p_version                    INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_almacen_id    INT;
  DECLARE @v_estado        NVARCHAR(20);
  DECLARE @v_version       INT;
  DECLARE @v_detalle_id    INT;
  DECLARE @v_idem_linea    NVARCHAR(160);
  DECLARE @v_producto_id   INT;
  DECLARE @v_diferencia    INT;
  DECLARE @v_motivo_codigo NVARCHAR(40);
  DECLARE @v_sentido       NVARCHAR(10);
  DECLARE @v_cantidad      INT;
  DECLARE @v_mov_id        INT;
  DECLARE @v_saldo         INT;
  DECLARE @v_replayed      BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id
    FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
    IF @v_estado <> N'aprobado'
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se aplica un ajuste aprobado.', 1;

    BEGIN TRAN;

    DECLARE cur_lineas CURSOR LOCAL FAST_FORWARD FOR
      SELECT id, producto_id, diferencia, motivo_codigo
      FROM dbo.ajuste_detalle
      WHERE ajuste_id = @p_ajuste_id;

    OPEN cur_lineas;
    FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_diferencia, @v_motivo_codigo;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      SET @v_sentido  = IIF(@v_diferencia > 0, N'entrada', N'salida');
      SET @v_cantidad = ABS(@v_diferencia);
      SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);

      EXEC dbo.sp_inv_registrar_movimiento
        @p_idempotency_key            = @v_idem_linea,
        @p_tipo_movimiento            = N'ajuste',
        @p_sentido                    = @v_sentido,
        @p_producto_id                = @v_producto_id,
        @p_almacen_id                 = @v_almacen_id,
        @p_cantidad                   = @v_cantidad,
        @p_documento_tipo             = N'ajuste',
        @p_documento_id               = @p_ajuste_id,
        @p_documento_linea_id         = @v_detalle_id,
        @p_usuario_id                 = @p_actor_id,
        @p_motivo_codigo              = @v_motivo_codigo,
        @p_observacion                = NULL,
        @p_movimiento_compensa_id     = NULL,
        @p_permitir_bloqueo_conteo_id = @p_permitir_bloqueo_conteo_id,
        @p_ignorar_bloqueo            = 0,
        @p_movimiento_id              = @v_mov_id OUTPUT,
        @p_saldo_posterior            = @v_saldo OUTPUT,
        @p_replayed                   = @v_replayed OUTPUT;

      FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_diferencia, @v_motivo_codigo;
    END
    CLOSE cur_lineas;
    DEALLOCATE cur_lineas;

    UPDATE dbo.ajuste SET estado = N'aplicado', version = version + 1 WHERE id = @p_ajuste_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'aplicar_ajuste', N'ajuste', @p_ajuste_id,
              JSON_OBJECT('id':@p_ajuste_id, 'estado':N'aplicado'));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
  END
END
GO

IF OBJECT_ID(N'dbo.sp_inv_revertir_ajuste', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_revertir_ajuste;
GO
CREATE PROCEDURE dbo.sp_inv_revertir_ajuste(
  @p_ajuste_id        INT,
  @p_actor_id         INT,
  @p_expected_version INT,
  @p_idempotency_key  NVARCHAR(100),
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_almacen_id  INT;
  DECLARE @v_estado      NVARCHAR(20);
  DECLARE @v_version     INT;
  DECLARE @v_detalle_id  INT;
  DECLARE @v_idem_linea  NVARCHAR(160);
  DECLARE @v_obs_linea   NVARCHAR(200);
  DECLARE @v_producto_id INT;
  DECLARE @v_diferencia  INT;
  DECLARE @v_sentido     NVARCHAR(10);
  DECLARE @v_cantidad    INT;
  DECLARE @v_mov_id      INT;
  DECLARE @v_saldo       INT;
  DECLARE @v_replayed    BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id
    FROM dbo.ajuste WITH (UPDLOCK, ROWLOCK) WHERE id = @p_ajuste_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: ajuste no encontrado.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión del ajuste no coincide.', 1;
    IF @v_estado <> N'aplicado'
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se revierte un ajuste aplicado.', 1;

    BEGIN TRAN;

    DECLARE cur_lineas CURSOR LOCAL FAST_FORWARD FOR
      SELECT id, producto_id, diferencia
      FROM dbo.ajuste_detalle
      WHERE ajuste_id = @p_ajuste_id;

    OPEN cur_lineas;
    FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_diferencia;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      -- Reversión: se invierte el sentido de la diferencia original,
      -- restaurando el saldo previo a la aplicación (mismo tipo 'ajuste').
      SET @v_sentido  = IIF(@v_diferencia < 0, N'entrada', N'salida');
      SET @v_cantidad = ABS(@v_diferencia);
      SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);
      SET @v_obs_linea = CONCAT(N'Reversión del ajuste ', @p_ajuste_id);

      EXEC dbo.sp_inv_registrar_movimiento
        @p_idempotency_key            = @v_idem_linea,
        @p_tipo_movimiento            = N'ajuste',
        @p_sentido                    = @v_sentido,
        @p_producto_id                = @v_producto_id,
        @p_almacen_id                 = @v_almacen_id,
        @p_cantidad                   = @v_cantidad,
        @p_documento_tipo             = N'ajuste',
        @p_documento_id               = @p_ajuste_id,
        @p_documento_linea_id         = @v_detalle_id,
        @p_usuario_id                 = @p_actor_id,
        @p_motivo_codigo              = N'REVERSION_AJUSTE',
        @p_observacion                = @v_obs_linea,
        @p_movimiento_compensa_id     = NULL,
        @p_permitir_bloqueo_conteo_id = NULL,
        @p_ignorar_bloqueo            = 1,
        @p_movimiento_id              = @v_mov_id OUTPUT,
        @p_saldo_posterior            = @v_saldo OUTPUT,
        @p_replayed                   = @v_replayed OUTPUT;

      FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_diferencia;
    END
    CLOSE cur_lineas;
    DEALLOCATE cur_lineas;

    UPDATE dbo.ajuste SET estado = N'revertido', version = version + 1 WHERE id = @p_ajuste_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'revertir_ajuste', N'ajuste', @p_ajuste_id,
              JSON_OBJECT('id':@p_ajuste_id, 'estado':N'revertido'));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.ajuste WHERE id = @p_ajuste_id;
  END
END
GO

-- =============================================================================
-- DESCARTES
-- =============================================================================

IF OBJECT_ID(N'dbo.sp_inv_crear_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_crear_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_crear_descarte(
  @p_codigo                NVARCHAR(40),
  @p_almacen_id            INT,
  @p_solicitante_id        INT,
  @p_lineas                NVARCHAR(MAX),
  @p_observacion           NVARCHAR(MAX),
  @p_documento_origen_tipo NVARCHAR(40),
  @p_documento_origen_id   NVARCHAR(64),
  @p_conteo_origen_id      INT,
  @p_solicitar             BIT,
  @p_descarte_id           INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_len    INT;
  DECLARE @v_estado NVARCHAR(20);

  SET @v_len = (SELECT COUNT(*) FROM OPENJSON(@p_lineas));
  IF @v_len IS NULL OR @v_len = 0
    THROW 50000, N'INVALID_QUANTITY: el descarte requiere al menos una línea.', 1;

  IF EXISTS (
    SELECT 1 FROM OPENJSON(@p_lineas) WITH (cantidad INT '$.cantidad') AS j
    WHERE j.cantidad IS NULL OR j.cantidad <= 0
  )
    THROW 50000, N'INVALID_QUANTITY: cada línea de descarte requiere cantidad > 0.', 1;

  IF EXISTS (
    SELECT 1 FROM OPENJSON(@p_lineas) WITH (motivo_codigo NVARCHAR(40) '$.motivo_codigo') AS j
    WHERE j.motivo_codigo IS NULL OR LTRIM(RTRIM(j.motivo_codigo)) = N''
  )
    THROW 50000, N'INVALID_MOVEMENT_TYPE: cada línea de descarte requiere motivo tipificado.', 1;

  SET @v_estado = IIF(@p_solicitar = 0, N'borrador', N'solicitado');

  BEGIN TRAN;

  INSERT INTO dbo.descarte (
    codigo, almacen_id, estado, solicitante_id, version, observacion,
    documento_origen_tipo, documento_origen_id, conteo_origen_id, dominio_id
  ) VALUES (
    @p_codigo, @p_almacen_id, @v_estado, @p_solicitante_id, 1, @p_observacion,
    @p_documento_origen_tipo, @p_documento_origen_id, @p_conteo_origen_id, dbo.fn_inv_uuid()
  );
  SET @p_descarte_id = CAST(SCOPE_IDENTITY() AS INT);

  INSERT INTO dbo.descarte_detalle (
    descarte_id, producto_id, cantidad, costo, motivo_codigo, observacion, dominio_id
  )
  SELECT
    @p_descarte_id, j.producto_id, j.cantidad, COALESCE(p.costo, 0), j.motivo_codigo, j.observacion, dbo.fn_inv_uuid()
  FROM OPENJSON(@p_lineas) WITH (
    producto_id   INT           '$.producto_id',
    cantidad      INT           '$.cantidad',
    motivo_codigo NVARCHAR(40)  '$.motivo_codigo',
    observacion   NVARCHAR(MAX) '$.observacion'
  ) AS j
  LEFT JOIN dbo.productos p ON p.id = j.producto_id;

  COMMIT TRAN;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_solicitar_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_solicitar_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_solicitar_descarte(
  @p_descarte_id      INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
  END
  IF @v_estado <> N'borrador'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede solicitar un descarte en borrador.', 1;
  END

  UPDATE dbo.descarte SET estado = N'solicitado', version = version + 1 WHERE id = @p_descarte_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_rechazar_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_rechazar_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_rechazar_descarte(
  @p_descarte_id      INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
  END
  IF @v_estado <> N'solicitado'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede rechazar un descarte solicitado.', 1;
  END

  UPDATE dbo.descarte SET estado = N'rechazado', version = version + 1 WHERE id = @p_descarte_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_cancelar_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_cancelar_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_cancelar_descarte(
  @p_descarte_id      INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado  NVARCHAR(20);
  DECLARE @v_version INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
  END
  IF @v_estado NOT IN (N'borrador', N'solicitado')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede cancelar un descarte en borrador o solicitado.', 1;
  END

  UPDATE dbo.descarte SET estado = N'cancelado', version = version + 1 WHERE id = @p_descarte_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_aprobar_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_aprobar_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_aprobar_descarte(
  @p_descarte_id      INT,
  @p_aprobador_id     INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado      NVARCHAR(20);
  DECLARE @v_version     INT;
  DECLARE @v_solicitante INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version, @v_solicitante = solicitante_id
  FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
  END
  IF @v_estado <> N'solicitado'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede aprobar un descarte solicitado.', 1;
  END
  IF @p_aprobador_id = @v_solicitante
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: el aprobador debe ser distinto del solicitante.', 1;
  END

  UPDATE dbo.descarte SET estado = N'aprobado', aprobador_id = @p_aprobador_id, version = version + 1
   WHERE id = @p_descarte_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_aplicar_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_aplicar_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_aplicar_descarte(
  @p_descarte_id                INT,
  @p_actor_id                   INT,
  @p_expected_version           INT,
  @p_idempotency_key            NVARCHAR(100),
  @p_permitir_bloqueo_conteo_id CHAR(36),
  @p_estado                     NVARCHAR(20) OUTPUT,
  @p_version                    INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_almacen_id    INT;
  DECLARE @v_estado        NVARCHAR(20);
  DECLARE @v_version       INT;
  DECLARE @v_detalle_id    INT;
  DECLARE @v_idem_linea    NVARCHAR(160);
  DECLARE @v_producto_id   INT;
  DECLARE @v_cantidad      INT;
  DECLARE @v_motivo_codigo NVARCHAR(40);
  DECLARE @v_mov_id        INT;
  DECLARE @v_saldo         INT;
  DECLARE @v_replayed      BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id
    FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
    IF @v_estado <> N'aprobado'
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se aplica un descarte aprobado.', 1;

    BEGIN TRAN;

    DECLARE cur_lineas CURSOR LOCAL FAST_FORWARD FOR
      SELECT id, producto_id, cantidad, motivo_codigo
      FROM dbo.descarte_detalle
      WHERE descarte_id = @p_descarte_id;

    OPEN cur_lineas;
    FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad, @v_motivo_codigo;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);
      EXEC dbo.sp_inv_registrar_movimiento
        @p_idempotency_key            = @v_idem_linea,
        @p_tipo_movimiento            = N'descarte',
        @p_sentido                    = N'salida',
        @p_producto_id                = @v_producto_id,
        @p_almacen_id                 = @v_almacen_id,
        @p_cantidad                   = @v_cantidad,
        @p_documento_tipo             = N'descarte',
        @p_documento_id               = @p_descarte_id,
        @p_documento_linea_id         = @v_detalle_id,
        @p_usuario_id                 = @p_actor_id,
        @p_motivo_codigo              = @v_motivo_codigo,
        @p_observacion                = NULL,
        @p_movimiento_compensa_id     = NULL,
        @p_permitir_bloqueo_conteo_id = @p_permitir_bloqueo_conteo_id,
        @p_ignorar_bloqueo            = 0,
        @p_movimiento_id              = @v_mov_id OUTPUT,
        @p_saldo_posterior            = @v_saldo OUTPUT,
        @p_replayed                   = @v_replayed OUTPUT;

      FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad, @v_motivo_codigo;
    END
    CLOSE cur_lineas;
    DEALLOCATE cur_lineas;

    UPDATE dbo.descarte SET estado = N'aplicado', version = version + 1 WHERE id = @p_descarte_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'aplicar_descarte', N'descarte', @p_descarte_id,
              JSON_OBJECT('id':@p_descarte_id, 'estado':N'aplicado'));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
  END
END
GO

IF OBJECT_ID(N'dbo.sp_inv_revertir_descarte', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_revertir_descarte;
GO
CREATE PROCEDURE dbo.sp_inv_revertir_descarte(
  @p_descarte_id      INT,
  @p_actor_id         INT,
  @p_expected_version INT,
  @p_idempotency_key  NVARCHAR(100),
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_almacen_id  INT;
  DECLARE @v_estado      NVARCHAR(20);
  DECLARE @v_version     INT;
  DECLARE @v_detalle_id  INT;
  DECLARE @v_idem_linea  NVARCHAR(160);
  DECLARE @v_obs_linea   NVARCHAR(200);
  DECLARE @v_producto_id INT;
  DECLARE @v_cantidad    INT;
  DECLARE @v_mov_id      INT;
  DECLARE @v_saldo       INT;
  DECLARE @v_replayed    BIT;

  IF EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
  BEGIN
    SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
  END
  ELSE
  BEGIN
    SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id
    FROM dbo.descarte WITH (UPDLOCK, ROWLOCK) WHERE id = @p_descarte_id;

    IF @v_estado IS NULL
      THROW 50000, N'NOT_FOUND: descarte no encontrado.', 1;
    IF @v_version <> @p_expected_version
      THROW 50000, N'VERSION_CONFLICT: versión del descarte no coincide.', 1;
    IF @v_estado <> N'aplicado'
      THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se revierte un descarte aplicado.', 1;

    BEGIN TRAN;

    DECLARE cur_lineas CURSOR LOCAL FAST_FORWARD FOR
      SELECT id, producto_id, cantidad
      FROM dbo.descarte_detalle
      WHERE descarte_id = @p_descarte_id;

    OPEN cur_lineas;
    FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad;
    WHILE @@FETCH_STATUS = 0
    BEGIN
      SET @v_idem_linea = CONCAT(@p_idempotency_key, N':linea:', @v_detalle_id);
      SET @v_obs_linea = CONCAT(N'Reversión del descarte ', @p_descarte_id);
      EXEC dbo.sp_inv_registrar_movimiento
        @p_idempotency_key            = @v_idem_linea,
        @p_tipo_movimiento            = N'devolucion_entrada',
        @p_sentido                    = N'entrada',
        @p_producto_id                = @v_producto_id,
        @p_almacen_id                 = @v_almacen_id,
        @p_cantidad                   = @v_cantidad,
        @p_documento_tipo             = N'descarte',
        @p_documento_id               = @p_descarte_id,
        @p_documento_linea_id         = @v_detalle_id,
        @p_usuario_id                 = @p_actor_id,
        @p_motivo_codigo              = N'REVERSION_DESCARTE',
        @p_observacion                = @v_obs_linea,
        @p_movimiento_compensa_id     = NULL,
        @p_permitir_bloqueo_conteo_id = NULL,
        @p_ignorar_bloqueo            = 1,
        @p_movimiento_id              = @v_mov_id OUTPUT,
        @p_saldo_posterior            = @v_saldo OUTPUT,
        @p_replayed                   = @v_replayed OUTPUT;

      FETCH NEXT FROM cur_lineas INTO @v_detalle_id, @v_producto_id, @v_cantidad;
    END
    CLOSE cur_lineas;
    DEALLOCATE cur_lineas;

    UPDATE dbo.descarte SET estado = N'revertido', version = version + 1 WHERE id = @p_descarte_id;

    IF NOT EXISTS (SELECT 1 FROM dbo.inventario_idempotencia WHERE idempotency_key = @p_idempotency_key)
    BEGIN
      INSERT INTO dbo.inventario_idempotencia (idempotency_key, tipo_operacion, documento_tipo, documento_id, resultado)
      VALUES (@p_idempotency_key, N'revertir_descarte', N'descarte', @p_descarte_id,
              JSON_OBJECT('id':@p_descarte_id, 'estado':N'revertido'));
    END

    COMMIT TRAN;

    SELECT @p_estado = estado, @p_version = version FROM dbo.descarte WHERE id = @p_descarte_id;
  END
END
GO

-- =============================================================================
-- CONTEOS FÍSICOS
-- =============================================================================

IF OBJECT_ID(N'dbo.sp_inv_crear_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_crear_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_crear_conteo(
  @p_codigo               NVARCHAR(40),
  @p_almacen_id           INT,
  @p_sucursal_id          INT,
  @p_tipo_conteo          NVARCHAR(20),
  @p_descripcion_alcance  NVARCHAR(MAX),
  @p_responsable_id       INT,
  @p_alcance_producto_ids NVARCHAR(MAX),
  @p_conteo_id            INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_conflicto INT = 0;

  IF @p_descripcion_alcance IS NULL OR LTRIM(RTRIM(@p_descripcion_alcance)) = N''
    THROW 50000, N'INVALID_DOCUMENT_REF: el conteo requiere describir el alcance.', 1;

  SELECT @v_conflicto = COUNT(*)
  FROM dbo.conteo_fisico
  WHERE almacen_id = @p_almacen_id AND estado NOT IN (N'cerrado', N'cancelado');

  IF @v_conflicto > 0
    THROW 50000, N'CONFLICT: ya existe una sesión de conteo activa para el almacén.', 1;

  BEGIN TRAN;

  INSERT INTO dbo.conteo_fisico (
    codigo, almacen_id, sucursal_id, tipo_conteo, descripcion_alcance,
    estado, responsable_id, bloqueo_activo, version, dominio_id
  ) VALUES (
    @p_codigo, @p_almacen_id, @p_sucursal_id, @p_tipo_conteo, LTRIM(RTRIM(@p_descripcion_alcance)),
    N'borrador', @p_responsable_id, 0, 1, dbo.fn_inv_uuid()
  );
  SET @p_conteo_id = CAST(SCOPE_IDENTITY() AS INT);

  IF @p_alcance_producto_ids IS NOT NULL
  BEGIN
    INSERT INTO dbo.conteo_alcance_producto (
      conteo_id, producto_id, existencia_actual, stock_minimo, seleccionado, dominio_id
    )
    SELECT @p_conteo_id, p.id, COALESCE(i.stock, 0), COALESCE(i.stock_minimo, 0), 1, dbo.fn_inv_uuid()
    FROM OPENJSON(@p_alcance_producto_ids) j
    JOIN dbo.productos p ON p.id = CAST(j.value AS INT)
    LEFT JOIN dbo.inventario i ON i.producto_id = p.id AND i.almacen_id = @p_almacen_id;
  END

  COMMIT TRAN;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_abrir_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_abrir_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_abrir_conteo(
  @p_conteo_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT,
  @p_lineas_creadas   INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado      NVARCHAR(20);
  DECLARE @v_version     INT;
  DECLARE @v_almacen_id  INT;
  DECLARE @v_dominio_id  CHAR(36);
  DECLARE @v_conflicto   INT = 0;
  DECLARE @v_alcance_cnt INT = 0;
  DECLARE @v_scope_cnt   INT = 0;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id, @v_dominio_id = dominio_id
  FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado <> N'borrador'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se puede abrir un conteo en borrador.', 1;
  END

  SELECT @v_conflicto = COUNT(*)
  FROM dbo.conteo_fisico
  WHERE almacen_id = @v_almacen_id AND estado NOT IN (N'cerrado', N'cancelado') AND id <> @p_conteo_id;

  IF @v_conflicto > 0
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'CONFLICT: ya existe otra sesión de conteo activa para el almacén.', 1;
  END

  SELECT @v_alcance_cnt = COUNT(*)
  FROM dbo.conteo_alcance_producto WHERE conteo_id = @p_conteo_id AND seleccionado = 1;

  SELECT @v_scope_cnt = COUNT(*)
  FROM dbo.inventario i
  WHERE i.almacen_id = @v_almacen_id
    AND (
      @v_alcance_cnt = 0
      OR i.producto_id IN (
        SELECT producto_id FROM dbo.conteo_alcance_producto
        WHERE conteo_id = @p_conteo_id AND seleccionado = 1
      )
    );

  IF @v_scope_cnt = 0
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VALIDATION: no hay existencias en el alcance para tomar snapshot.', 1;
  END

  INSERT INTO dbo.snapshot_conteo (conteo_id, producto_id, cantidad_teorica, costo_referencia, version, dominio_id)
  SELECT @p_conteo_id, i.producto_id, i.stock, p.costo, 1, dbo.fn_inv_uuid()
  FROM dbo.inventario i
  JOIN dbo.productos p ON p.id = i.producto_id
  WHERE i.almacen_id = @v_almacen_id
    AND (
      @v_alcance_cnt = 0
      OR i.producto_id IN (
        SELECT producto_id FROM dbo.conteo_alcance_producto
        WHERE conteo_id = @p_conteo_id AND seleccionado = 1
      )
    );

  INSERT INTO dbo.linea_conteo (conteo_id, snapshot_id, producto_id, estado_linea, version, dominio_id)
  SELECT @p_conteo_id, s.id, s.producto_id, N'pendiente', 1, dbo.fn_inv_uuid()
  FROM dbo.snapshot_conteo s
  WHERE s.conteo_id = @p_conteo_id;

  SET @p_lineas_creadas = @v_scope_cnt;

  UPDATE dbo.conteo_fisico
     SET estado = N'abierto', bloqueo_activo = 1, version = version + 1
   WHERE id = @p_conteo_id;

  UPDATE dbo.almacenes
     SET bloqueado_por_conteo = 1, conteo_bloqueante_id = @v_dominio_id
   WHERE id = @v_almacen_id;

  UPDATE dbo.inventario
     SET bloqueado_por_conteo = 1, conteo_bloqueante_id = @v_dominio_id
   WHERE almacen_id = @v_almacen_id
     AND producto_id IN (SELECT producto_id FROM dbo.snapshot_conteo WHERE conteo_id = @p_conteo_id);

  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_registrar_linea_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_registrar_linea_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_registrar_linea_conteo(
  @p_conteo_id        INT,
  @p_linea_id         INT,
  @p_cantidad_contada INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado      NVARCHAR(20);
  DECLARE @v_version     INT;
  DECLARE @v_snapshot_id INT;
  DECLARE @v_teorica     INT;

  IF @p_cantidad_contada IS NULL OR @p_cantidad_contada < 0
    THROW 50000, N'INVALID_QUANTITY: la cantidad contada debe ser un entero >= 0.', 1;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado NOT IN (N'abierto', N'en_conteo')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se registran cantidades en conteo abierto o en captura.', 1;
  END

  SELECT @v_snapshot_id = snapshot_id
  FROM dbo.linea_conteo WITH (UPDLOCK, ROWLOCK) WHERE id = @p_linea_id AND conteo_id = @p_conteo_id;

  IF @v_snapshot_id IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_DOCUMENT_REF: línea de conteo no encontrada.', 1;
  END

  SELECT @v_teorica = cantidad_teorica FROM dbo.snapshot_conteo WHERE id = @v_snapshot_id;

  UPDATE dbo.linea_conteo
     SET cantidad_contada  = @p_cantidad_contada,
         cantidad_aceptada = @p_cantidad_contada,
         diferencia        = @p_cantidad_contada - @v_teorica,
         estado_linea      = N'contada',
         version           = version + 1
   WHERE id = @p_linea_id;

  UPDATE dbo.conteo_fisico SET estado = N'en_conteo', version = version + 1 WHERE id = @p_conteo_id;

  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_enviar_revision_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_enviar_revision_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_enviar_revision_conteo(
  @p_conteo_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado     NVARCHAR(20);
  DECLARE @v_version    INT;
  DECLARE @v_pendientes INT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado NOT IN (N'en_conteo', N'abierto')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: el conteo no está listo para revisión.', 1;
  END

  SELECT @v_pendientes = COUNT(*) FROM dbo.linea_conteo WHERE conteo_id = @p_conteo_id AND estado_linea = N'pendiente';

  IF @v_pendientes > 0
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_QUANTITY: todas las líneas del alcance deben estar contadas antes de la revisión.', 1;
  END

  UPDATE dbo.conteo_fisico SET estado = N'en_revision', version = version + 1 WHERE id = @p_conteo_id;
  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_clasificar_linea_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_clasificar_linea_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_clasificar_linea_conteo(
  @p_conteo_id           INT,
  @p_linea_id            INT,
  @p_expected_version    INT,
  @p_clasificacion       NVARCHAR(20),
  @p_regularizacion_tipo NVARCHAR(20),
  @p_regularizacion_id   INT,
  @p_version             INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado_conteo  NVARCHAR(20);
  DECLARE @v_version_conteo INT;
  DECLARE @v_diferencia     INT;
  DECLARE @v_existe         INT;
  DECLARE @v_estado_linea   NVARCHAR(20);

  BEGIN TRAN;

  SELECT @v_estado_conteo = estado, @v_version_conteo = version
  FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado_conteo IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version_conteo <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado_conteo <> N'en_revision'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se clasifica en revisión.', 1;
  END

  SELECT @v_existe = id, @v_diferencia = diferencia
  FROM dbo.linea_conteo WITH (UPDLOCK, ROWLOCK) WHERE id = @p_linea_id AND conteo_id = @p_conteo_id;

  IF @v_existe IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_DOCUMENT_REF: línea de conteo no encontrada.', 1;
  END

  SET @v_diferencia = COALESCE(@v_diferencia, 0);
  IF @v_diferencia = 0 AND @p_clasificacion <> N'cuadra'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_ADJUSTMENT: una línea sin diferencia solo puede clasificarse como cuadra.', 1;
  END
  IF @v_diferencia <> 0 AND @p_clasificacion = N'cuadra'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_ADJUSTMENT: una línea con diferencia no puede clasificarse como cuadra.', 1;
  END

  SET @v_estado_linea = IIF(
    @p_regularizacion_tipo IS NOT NULL AND @p_clasificacion <> N'investigacion',
    N'regularizada',
    N'revisada'
  );

  UPDATE dbo.linea_conteo
     SET clasificacion        = @p_clasificacion,
         estado_linea         = @v_estado_linea,
         regularizacion_tipo  = @p_regularizacion_tipo,
         regularizacion_id    = @p_regularizacion_id,
         version              = version + 1
   WHERE id = @p_linea_id;

  UPDATE dbo.conteo_fisico SET version = version + 1 WHERE id = @p_conteo_id;

  COMMIT TRAN;

  SELECT @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_cerrar_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_cerrar_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_cerrar_conteo(
  @p_conteo_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado     NVARCHAR(20);
  DECLARE @v_version    INT;
  DECLARE @v_almacen_id INT;
  DECLARE @v_dominio_id CHAR(36);
  DECLARE @v_malas      INT = 0;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id, @v_dominio_id = dominio_id
  FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado <> N'en_revision'
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se cierra un conteo en revisión.', 1;
  END

  SELECT @v_malas = COUNT(*)
  FROM dbo.linea_conteo
  WHERE conteo_id = @p_conteo_id
    AND (
      (COALESCE(diferencia, 0) = 0 AND (clasificacion IS NULL OR clasificacion <> N'cuadra'))
      OR (
        COALESCE(diferencia, 0) <> 0
        AND (
          clasificacion IS NULL
          OR clasificacion = N'investigacion'
          OR estado_linea <> N'regularizada'
          OR regularizacion_id IS NULL
        )
      )
    );

  IF @v_malas > 0
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_ADJUSTMENT: cierre estricto, hay líneas sin clasificación o regularización.', 1;
  END

  UPDATE dbo.conteo_fisico SET estado = N'cerrado', bloqueo_activo = 0, version = version + 1 WHERE id = @p_conteo_id;

  UPDATE dbo.almacenes
     SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
   WHERE id = @v_almacen_id AND conteo_bloqueante_id = @v_dominio_id;

  UPDATE dbo.inventario
     SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
   WHERE almacen_id = @v_almacen_id AND conteo_bloqueante_id = @v_dominio_id;

  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

IF OBJECT_ID(N'dbo.sp_inv_cancelar_conteo', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_inv_cancelar_conteo;
GO
CREATE PROCEDURE dbo.sp_inv_cancelar_conteo(
  @p_conteo_id        INT,
  @p_expected_version INT,
  @p_estado           NVARCHAR(20) OUTPUT,
  @p_version          INT OUTPUT
)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @v_estado        NVARCHAR(20);
  DECLARE @v_version       INT;
  DECLARE @v_almacen_id    INT;
  DECLARE @v_dominio_id    CHAR(36);
  DECLARE @v_estaba_activo BIT;

  BEGIN TRAN;

  SELECT @v_estado = estado, @v_version = version, @v_almacen_id = almacen_id, @v_dominio_id = dominio_id, @v_estaba_activo = bloqueo_activo
  FROM dbo.conteo_fisico WITH (UPDLOCK, ROWLOCK) WHERE id = @p_conteo_id;

  IF @v_estado IS NULL
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'NOT_FOUND: conteo no encontrado.', 1;
  END
  IF @v_version <> @p_expected_version
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'VERSION_CONFLICT: versión del conteo no coincide.', 1;
  END
  IF @v_estado NOT IN (N'borrador', N'abierto')
  BEGIN
    ROLLBACK TRAN;
    THROW 50000, N'INVALID_MOVEMENT_TYPE: solo se cancela un conteo en borrador o abierto.', 1;
  END

  UPDATE dbo.conteo_fisico SET estado = N'cancelado', bloqueo_activo = 0, version = version + 1 WHERE id = @p_conteo_id;

  IF @v_estaba_activo = 1
  BEGIN
    UPDATE dbo.almacenes
       SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
     WHERE id = @v_almacen_id AND conteo_bloqueante_id = @v_dominio_id;

    UPDATE dbo.inventario
       SET bloqueado_por_conteo = 0, conteo_bloqueante_id = NULL
     WHERE almacen_id = @v_almacen_id AND conteo_bloqueante_id = @v_dominio_id;
  END

  COMMIT TRAN;

  SELECT @p_estado = estado, @p_version = version FROM dbo.conteo_fisico WHERE id = @p_conteo_id;
END
GO

-- =============================================================================
-- SECCIÓN 3: TRIGGERS DE DOMINIO (equivalente de 11_triggers.sql)
--
-- REGLA DE ORO: ningún trigger de esta sección muta `inventario.stock`. Todas
-- las mutaciones de stock pasan por sp_inv_registrar_movimiento.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- inventario.estado_stock — SQL Server no soporta BEFORE triggers; se usan
-- INSTEAD OF INSERT/UPDATE que escriben la fila con estado_stock ya calculado
-- (equivalente exacto de un BEFORE trigger). El INSTEAD OF UPDATE también
-- incorpora el bump de updated_at (ver nota de cabecera del archivo), por lo
-- que `inventario` no tiene un trigger updated_at independiente.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.trg_inventario_estado_stock_insert', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_inventario_estado_stock_insert;
GO
CREATE TRIGGER dbo.trg_inventario_estado_stock_insert
ON dbo.inventario
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;

  /*
    AFTER INSERT (no INSTEAD OF):
    - Respeta DEFAULT e IDENTITY / IDENTITY_INSERT del INSERT original.
    - Recalcula estado_stock con la misma función de negocio.
  */
  UPDATE t
     SET t.estado_stock = dbo.fn_inv_estado_stock(t.stock, t.stock_minimo)
  FROM dbo.inventario t
  INNER JOIN inserted i ON i.id = t.id;
END
GO

IF OBJECT_ID(N'dbo.trg_inventario_estado_stock', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_inventario_estado_stock;
GO
CREATE TRIGGER dbo.trg_inventario_estado_stock
ON dbo.inventario
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  -- SQL Server: no se permite INSTEAD OF UPDATE en tablas con FK CASCADE
  -- (producto/almacén). AFTER UPDATE mantiene el recálculo de estado_stock.
  IF NOT UPDATE(stock) AND NOT UPDATE(stock_minimo)
    RETURN;

  UPDATE t
     SET t.estado_stock = dbo.fn_inv_estado_stock(t.stock, t.stock_minimo),
         t.updated_at   = IIF(UPDATE(updated_at), t.updated_at, SYSUTCDATETIME())
  FROM dbo.inventario t
  INNER JOIN inserted i ON i.id = t.id;
END
GO

-- -----------------------------------------------------------------------------
-- trg_ajuste_audit_estado — set-based (INSERTED/DELETED unidos por id, sin
-- FOR EACH ROW), cubre cualquier cantidad de filas afectadas por el UPDATE.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.trg_ajuste_audit_estado', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_ajuste_audit_estado;
GO
CREATE TRIGGER dbo.trg_ajuste_audit_estado
ON dbo.ajuste
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.auditoria_inventario (
    tipo_accion, usuario_id, documento_tipo, documento_id,
    valor_antes, valor_despues, detalle, dominio_id
  )
  SELECT
    CASE i.estado
      WHEN N'aplicado'  THEN N'aplicacion'
      WHEN N'aprobado'  THEN N'aprobacion'
      WHEN N'rechazado' THEN N'rechazo'
      WHEN N'cancelado' THEN N'cancelacion'
      WHEN N'revertido' THEN N'reversion'
      ELSE N'movimiento'
    END,
    COALESCE(i.aprobador_id, i.solicitante_id),
    N'ajuste', i.id,
    JSON_OBJECT('estado':d.estado, 'version':d.version),
    JSON_OBJECT('estado':i.estado, 'version':i.version),
    CONCAT(N'Ajuste ', i.codigo, N': ', d.estado, N' -> ', i.estado),
    dbo.fn_inv_uuid()
  FROM inserted i
  INNER JOIN deleted d ON d.id = i.id
  WHERE i.estado <> d.estado;
END
GO

-- -----------------------------------------------------------------------------
-- trg_transferencia_audit_estado
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.trg_transferencia_audit_estado', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_transferencia_audit_estado;
GO
CREATE TRIGGER dbo.trg_transferencia_audit_estado
ON dbo.transferencia
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.auditoria_inventario (
    tipo_accion, usuario_id, documento_tipo, documento_id,
    valor_antes, valor_despues, detalle, dominio_id
  )
  SELECT
    CASE i.estado
      WHEN N'recibida'         THEN N'aplicacion'
      WHEN N'recibida_parcial' THEN N'aplicacion'
      WHEN N'cancelada'        THEN N'cancelacion'
      ELSE N'movimiento'
    END,
    COALESCE(i.usuario_aprueba_id, i.usuario_solicita_id),
    N'transferencia', i.id,
    JSON_OBJECT('estado':d.estado, 'version':d.version),
    JSON_OBJECT('estado':i.estado, 'version':i.version),
    CONCAT(N'Transferencia ', i.codigo, N': ', d.estado, N' -> ', i.estado),
    dbo.fn_inv_uuid()
  FROM inserted i
  INNER JOIN deleted d ON d.id = i.id
  WHERE i.estado <> d.estado;
END
GO

-- -----------------------------------------------------------------------------
-- trg_descarte_audit_estado
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.trg_descarte_audit_estado', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_descarte_audit_estado;
GO
CREATE TRIGGER dbo.trg_descarte_audit_estado
ON dbo.descarte
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.auditoria_inventario (
    tipo_accion, usuario_id, documento_tipo, documento_id,
    valor_antes, valor_despues, detalle, dominio_id
  )
  SELECT
    CASE i.estado
      WHEN N'aplicado'  THEN N'aplicacion'
      WHEN N'aprobado'  THEN N'aprobacion'
      WHEN N'rechazado' THEN N'rechazo'
      WHEN N'cancelado' THEN N'cancelacion'
      WHEN N'revertido' THEN N'reversion'
      ELSE N'movimiento'
    END,
    COALESCE(i.aprobador_id, i.solicitante_id),
    N'descarte', i.id,
    JSON_OBJECT('estado':d.estado, 'version':d.version),
    JSON_OBJECT('estado':i.estado, 'version':i.version),
    CONCAT(N'Descarte ', i.codigo, N': ', d.estado, N' -> ', i.estado),
    dbo.fn_inv_uuid()
  FROM inserted i
  INNER JOIN deleted d ON d.id = i.id
  WHERE i.estado <> d.estado;
END
GO

-- -----------------------------------------------------------------------------
-- trg_conteo_audit_estado
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.trg_conteo_audit_estado', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_conteo_audit_estado;
GO
CREATE TRIGGER dbo.trg_conteo_audit_estado
ON dbo.conteo_fisico
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.auditoria_inventario (
    tipo_accion, usuario_id, documento_tipo, documento_id,
    valor_antes, valor_despues, detalle, dominio_id
  )
  SELECT
    CASE i.estado
      WHEN N'cerrado'   THEN N'aplicacion'
      WHEN N'cancelado' THEN N'cancelacion'
      ELSE N'movimiento'
    END,
    i.responsable_id,
    N'conteo_fisico', i.id,
    JSON_OBJECT('estado':d.estado, 'version':d.version),
    JSON_OBJECT('estado':i.estado, 'version':i.version),
    CONCAT(N'Conteo ', i.codigo, N': ', d.estado, N' -> ', i.estado),
    dbo.fn_inv_uuid()
  FROM inserted i
  INNER JOIN deleted d ON d.id = i.id
  WHERE i.estado <> d.estado;

  INSERT INTO dbo.auditoria_conteo_fisico (conteo_id, accion, usuario_id, resultado, detalle, dominio_id)
  SELECT
    i.id, CONCAT(N'estado:', d.estado, N'->', i.estado), i.responsable_id, N'OK',
    CONCAT(N'Transición de estado registrada por trigger para conteo ', i.codigo),
    dbo.fn_inv_uuid()
  FROM inserted i
  INNER JOIN deleted d ON d.id = i.id
  WHERE i.estado <> d.estado;
END
GO

-- =============================================================================
-- SECCIÓN 4: TRIGGERS updated_at (equivalente de ON UPDATE CURRENT_TIMESTAMP)
--
-- Patrón: si la sentencia UPDATE ya fijó updated_at explícitamente se respeta
-- ese valor (UPDATE(updated_at) = true); en caso contrario se recalcula con
-- SYSUTCDATETIME(), igual que ON UPDATE CURRENT_TIMESTAMP en MySQL.
-- `inventario` queda fuera de esta lista: su bump de updated_at ya vive en el
-- trigger INSTEAD OF UPDATE de la Sección 3.
-- NOTA: se asume columna PK `id` en cada tabla, salvo indicación contraria.
-- Ajustar el nombre de columna si el DDL real de ventas_secuencia_factura o
-- numeracion_documentos usa una clave distinta.
-- =============================================================================

IF OBJECT_ID(N'dbo.trg_productos_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_productos_updated_at;
GO
CREATE TRIGGER dbo.trg_productos_updated_at
ON dbo.productos
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.productos t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_transferencia_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_transferencia_updated_at;
GO
CREATE TRIGGER dbo.trg_transferencia_updated_at
ON dbo.transferencia
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.transferencia t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_ajuste_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_ajuste_updated_at;
GO
CREATE TRIGGER dbo.trg_ajuste_updated_at
ON dbo.ajuste
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.ajuste t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_conteo_fisico_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_conteo_fisico_updated_at;
GO
CREATE TRIGGER dbo.trg_conteo_fisico_updated_at
ON dbo.conteo_fisico
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.conteo_fisico t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_descarte_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_descarte_updated_at;
GO
CREATE TRIGGER dbo.trg_descarte_updated_at
ON dbo.descarte
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.descarte t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_linea_conteo_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_linea_conteo_updated_at;
GO
CREATE TRIGGER dbo.trg_linea_conteo_updated_at
ON dbo.linea_conteo
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.linea_conteo t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_snapshot_conteo_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_snapshot_conteo_updated_at;
GO
CREATE TRIGGER dbo.trg_snapshot_conteo_updated_at
ON dbo.snapshot_conteo
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.snapshot_conteo t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_ventas_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_ventas_updated_at;
GO
CREATE TRIGGER dbo.trg_ventas_updated_at
ON dbo.ventas
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.ventas t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_venta_clientes_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_venta_clientes_updated_at;
GO
CREATE TRIGGER dbo.trg_venta_clientes_updated_at
ON dbo.venta_clientes
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.venta_clientes t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_notas_credito_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_notas_credito_updated_at;
GO
CREATE TRIGGER dbo.trg_notas_credito_updated_at
ON dbo.notas_credito
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.notas_credito t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_orden_compra_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_orden_compra_updated_at;
GO
CREATE TRIGGER dbo.trg_orden_compra_updated_at
ON dbo.orden_compra
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.orden_compra t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_detalle_orden_compra_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_detalle_orden_compra_updated_at;
GO
CREATE TRIGGER dbo.trg_detalle_orden_compra_updated_at
ON dbo.detalle_orden_compra
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.detalle_orden_compra t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_recepcion_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_recepcion_updated_at;
GO
CREATE TRIGGER dbo.trg_recepcion_updated_at
ON dbo.recepcion
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.recepcion t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_detalle_recepcion_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_detalle_recepcion_updated_at;
GO
CREATE TRIGGER dbo.trg_detalle_recepcion_updated_at
ON dbo.detalle_recepcion
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.detalle_recepcion t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_factura_proveedor_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_factura_proveedor_updated_at;
GO
CREATE TRIGGER dbo.trg_factura_proveedor_updated_at
ON dbo.factura_proveedor
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.factura_proveedor t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_detalle_factura_proveedor_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_detalle_factura_proveedor_updated_at;
GO
CREATE TRIGGER dbo.trg_detalle_factura_proveedor_updated_at
ON dbo.detalle_factura_proveedor
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.detalle_factura_proveedor t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_condiciones_pago_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_condiciones_pago_updated_at;
GO
CREATE TRIGGER dbo.trg_condiciones_pago_updated_at
ON dbo.condiciones_pago
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.condiciones_pago t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_usuarios_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_usuarios_updated_at;
GO
CREATE TRIGGER dbo.trg_usuarios_updated_at
ON dbo.usuarios
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.usuarios t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_roles_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_roles_updated_at;
GO
CREATE TRIGGER dbo.trg_roles_updated_at
ON dbo.roles
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.roles t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_categorias_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_categorias_updated_at;
GO
CREATE TRIGGER dbo.trg_categorias_updated_at
ON dbo.categorias
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.categorias t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_editoriales_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_editoriales_updated_at;
GO
CREATE TRIGGER dbo.trg_editoriales_updated_at
ON dbo.editoriales
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.editoriales t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_proveedores_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_proveedores_updated_at;
GO
CREATE TRIGGER dbo.trg_proveedores_updated_at
ON dbo.proveedores
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.proveedores t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_sucursales_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_sucursales_updated_at;
GO
CREATE TRIGGER dbo.trg_sucursales_updated_at
ON dbo.sucursales
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.sucursales t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_almacenes_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_almacenes_updated_at;
GO
CREATE TRIGGER dbo.trg_almacenes_updated_at
ON dbo.almacenes
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.almacenes t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_monedas_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_monedas_updated_at;
GO
CREATE TRIGGER dbo.trg_monedas_updated_at
ON dbo.monedas
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.monedas t INNER JOIN inserted i ON t.id = i.id;
END
GO

IF OBJECT_ID(N'dbo.trg_ventas_secuencia_factura_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_ventas_secuencia_factura_updated_at;
GO
CREATE TRIGGER dbo.trg_ventas_secuencia_factura_updated_at
ON dbo.ventas_secuencia_factura
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  -- PK de la tabla es sucursal_dominio_id (no existe columna id)
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.ventas_secuencia_factura t
  INNER JOIN inserted i ON t.sucursal_dominio_id = i.sucursal_dominio_id;
END
GO

IF OBJECT_ID(N'dbo.trg_numeracion_documentos_updated_at', N'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_numeracion_documentos_updated_at;
GO
CREATE TRIGGER dbo.trg_numeracion_documentos_updated_at
ON dbo.numeracion_documentos
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF UPDATE(updated_at) RETURN;
  UPDATE t SET t.updated_at = SYSUTCDATETIME()
  FROM dbo.numeracion_documentos t INNER JOIN inserted i ON t.id = i.id;
END
GO

PRINT N'09_StoredProcedures.sql :: funciones, procedimientos y triggers de Inventario (+ updated_at) creados.';
GO
