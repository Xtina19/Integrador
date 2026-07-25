-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 05_Inventario.sql
-- Equivalente: mysql/05_inventario.sql + 08_transferencias.sql
--            + inventario_definitivo (02..08) forma final
-- =============================================================================

USE LibroSys;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =============================================================================
-- Versionado del pack Inventario
-- =============================================================================
IF OBJECT_ID(N'dbo.inventario_schema_version', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.inventario_schema_version (
    id            INT           NOT NULL IDENTITY(1,1),
    version       NVARCHAR(20)  NOT NULL,
    script_name   NVARCHAR(100) NOT NULL,
    checksum      NVARCHAR(64)  NULL,
    applied_at    DATETIME2(0)  NOT NULL
                    CONSTRAINT DF_inv_schema_version_applied DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_inventario_schema_version PRIMARY KEY (id),
    CONSTRAINT UK_inv_schema_version_script UNIQUE (script_name)
  );
END
GO

-- =============================================================================
-- Catálogos auxiliares
-- =============================================================================
IF OBJECT_ID(N'dbo.cat_motivo_descarte', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cat_motivo_descarte (
    codigo        NVARCHAR(40)  NOT NULL,
    nombre        NVARCHAR(150) NOT NULL,
    descripcion   NVARCHAR(255) NULL,
    activo        BIT           NOT NULL CONSTRAINT DF_cat_motivo_descarte_activo DEFAULT (1),
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_cat_motivo_descarte_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_cat_motivo_descarte PRIMARY KEY (codigo)
  );
END
GO

IF OBJECT_ID(N'dbo.cat_motivo_ajuste', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cat_motivo_ajuste (
    codigo        NVARCHAR(40)  NOT NULL,
    nombre        NVARCHAR(150) NOT NULL,
    descripcion   NVARCHAR(255) NULL,
    activo        BIT           NOT NULL CONSTRAINT DF_cat_motivo_ajuste_activo DEFAULT (1),
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_cat_motivo_ajuste_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_cat_motivo_ajuste PRIMARY KEY (codigo)
  );
END
GO

IF OBJECT_ID(N'dbo.cat_clasificacion_conteo', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cat_clasificacion_conteo (
    codigo        NVARCHAR(30)  NOT NULL,
    nombre        NVARCHAR(100) NOT NULL,
    descripcion   NVARCHAR(255) NULL,
    activo        BIT           NOT NULL CONSTRAINT DF_cat_clasificacion_conteo_activo DEFAULT (1),
    CONSTRAINT PK_cat_clasificacion_conteo PRIMARY KEY (codigo)
  );
END
GO

-- =============================================================================
-- inventario (existencias)
-- =============================================================================
IF OBJECT_ID(N'dbo.inventario', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.inventario (
    id                    INT           NOT NULL IDENTITY(1,1),
    producto_id           INT           NOT NULL,
    almacen_id            INT           NOT NULL,
    stock                 INT           NOT NULL CONSTRAINT DF_inventario_stock DEFAULT (0),
    stock_minimo          INT           NOT NULL CONSTRAINT DF_inventario_stock_minimo DEFAULT (10),
    ubicacion             NVARCHAR(150) NULL,
    estado_stock          NVARCHAR(20)  NOT NULL CONSTRAINT DF_inventario_estado_stock DEFAULT (N'normal'),
    version               INT           NOT NULL CONSTRAINT DF_inventario_version DEFAULT (1),
    bloqueado_por_conteo  BIT           NOT NULL CONSTRAINT DF_inventario_bloqueado DEFAULT (0),
    conteo_bloqueante_id  CHAR(36)      NULL,
    dominio_id            CHAR(36)      NULL,
    updated_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_inventario_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_inventario PRIMARY KEY (id),
    CONSTRAINT UK_inventario_producto_almacen UNIQUE (producto_id, almacen_id),
    CONSTRAINT FK_inventario_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_inventario_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_inventario_stock CHECK (stock >= 0),
    CONSTRAINT CK_inventario_estado_stock CHECK (estado_stock IN (N'normal', N'bajo', N'agotado'))
  );
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'UK_inventario_dominio_id' AND object_id = OBJECT_ID(N'dbo.inventario')
)
  CREATE UNIQUE INDEX UK_inventario_dominio_id ON dbo.inventario (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- =============================================================================
-- movimiento_inventario (ledger / kardex)
-- =============================================================================
IF OBJECT_ID(N'dbo.movimiento_inventario', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.movimiento_inventario (
    id                      INT           NOT NULL IDENTITY(1,1),
    producto_id             INT           NOT NULL,
    almacen_id              INT           NOT NULL,
    usuario_id              INT           NULL,
    tipo_movimiento         NVARCHAR(40)  NOT NULL,
    cantidad                INT           NOT NULL,
    saldo_anterior          INT           NOT NULL CONSTRAINT DF_mov_saldo_anterior DEFAULT (0),
    saldo_posterior         INT           NOT NULL,
    referencia              NVARCHAR(50)  NULL,
    referencia_tipo         NVARCHAR(50)  NULL,
    documento_tipo          NVARCHAR(40)  NULL,
    documento_id            NVARCHAR(64)  NULL,
    documento_linea_id      NVARCHAR(64)  NULL,
    observaciones           NVARCHAR(255) NULL,
    fecha_movimiento        DATETIME2(0)  NOT NULL CONSTRAINT DF_mov_fecha DEFAULT (SYSUTCDATETIME()),
    idempotency_key         NVARCHAR(100) NULL,
    motivo_codigo           NVARCHAR(40)  NULL,
    movimiento_compensa_id  INT           NULL,
    dominio_id              CHAR(36)      NULL,
    sentido                 NVARCHAR(10)  NOT NULL,
    CONSTRAINT PK_movimiento_inventario PRIMARY KEY (id),
    CONSTRAINT FK_movimiento_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_movimiento_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_movimiento_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_movimiento_compensa
      -- SQL Server: self-FK no admite ON DELETE SET NULL (error 1785 ciclos).
      -- Equivalente funcional a RESTRICT: la app/SP limpia la referencia antes de borrar.
      FOREIGN KEY (movimiento_compensa_id) REFERENCES dbo.movimiento_inventario (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_movimiento_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT CK_movimiento_sentido CHECK (sentido IN (N'entrada', N'salida')),
    CONSTRAINT CK_movimiento_tipo CHECK (tipo_movimiento IN (
      N'transferencia_salida', N'transferencia_entrada', N'descarte', N'ajuste',
      N'recepcion', N'venta', N'devolucion_entrada', N'compensacion'
    ))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_movimiento_idempotency' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE UNIQUE INDEX UK_movimiento_idempotency ON dbo.movimiento_inventario (idempotency_key) WHERE idempotency_key IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_movimiento_dominio_id' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE UNIQUE INDEX UK_movimiento_dominio_id ON dbo.movimiento_inventario (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- =============================================================================
-- transferencia / detalle_transferencia
-- =============================================================================
IF OBJECT_ID(N'dbo.transferencia', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.transferencia (
    id                      INT           NOT NULL IDENTITY(1,1),
    codigo                  NVARCHAR(30)  NOT NULL,
    almacen_origen_id       INT           NOT NULL,
    almacen_destino_id      INT           NOT NULL,
    usuario_solicita_id     INT           NOT NULL,
    usuario_aprueba_id      INT           NULL,
    fecha_solicitud         DATETIME2(0)  NOT NULL CONSTRAINT DF_transferencia_fecha_sol DEFAULT (SYSUTCDATETIME()),
    fecha_envio             DATETIME2(0)  NULL,
    fecha_recepcion         DATETIME2(0)  NULL,
    transporte              NVARCHAR(100) NULL,
    estado                  NVARCHAR(30)  NOT NULL CONSTRAINT DF_transferencia_estado DEFAULT (N'borrador'),
    observaciones           NVARCHAR(MAX) NULL,
    version                 INT           NOT NULL CONSTRAINT DF_transferencia_version DEFAULT (1),
    dominio_id              CHAR(36)      NULL,
    created_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_transferencia_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_transferencia_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_transferencia PRIMARY KEY (id),
    CONSTRAINT UK_transferencia_codigo UNIQUE (codigo),
    CONSTRAINT FK_transferencia_origen
      FOREIGN KEY (almacen_origen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_transferencia_destino
      FOREIGN KEY (almacen_destino_id) REFERENCES dbo.almacenes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_transferencia_solicita
      FOREIGN KEY (usuario_solicita_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_transferencia_aprueba
      FOREIGN KEY (usuario_aprueba_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_transferencia_almacenes CHECK (almacen_origen_id <> almacen_destino_id),
    CONSTRAINT CK_transferencia_estado CHECK (estado IN (
      N'borrador', N'solicitada', N'en_transito', N'recibida_parcial', N'recibida', N'cancelada'
    ))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_transferencia_dominio_id' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE UNIQUE INDEX UK_transferencia_dominio_id ON dbo.transferencia (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.detalle_transferencia', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.detalle_transferencia (
    id                      INT           NOT NULL IDENTITY(1,1),
    transferencia_id        INT           NOT NULL,
    producto_id             INT           NOT NULL,
    cantidad_solicitada     INT           NOT NULL,
    cantidad_despachada     INT           NOT NULL CONSTRAINT DF_det_trf_despachada DEFAULT (0),
    cantidad_recibida       INT           NOT NULL CONSTRAINT DF_det_trf_recibida DEFAULT (0),
    cantidad_faltante       INT           NOT NULL CONSTRAINT DF_det_trf_faltante DEFAULT (0),
    cantidad_danada         INT           NOT NULL CONSTRAINT DF_det_trf_danada DEFAULT (0),
    dominio_id              CHAR(36)      NULL,
    created_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_det_trf_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_detalle_transferencia PRIMARY KEY (id),
    CONSTRAINT UK_detalle_transferencia_producto UNIQUE (transferencia_id, producto_id),
    CONSTRAINT FK_detalle_transferencia
      FOREIGN KEY (transferencia_id) REFERENCES dbo.transferencia (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_transferencia_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_detalle_transferencia_cantidades CHECK (
      cantidad_solicitada > 0
      AND cantidad_despachada <= cantidad_solicitada
      AND (cantidad_recibida + cantidad_faltante + cantidad_danada) <= cantidad_despachada
    )
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_detalle_transferencia_dominio_id' AND object_id = OBJECT_ID(N'dbo.detalle_transferencia'))
  CREATE UNIQUE INDEX UK_detalle_transferencia_dominio_id ON dbo.detalle_transferencia (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- =============================================================================
-- ajuste / ajuste_detalle
-- =============================================================================
IF OBJECT_ID(N'dbo.ajuste', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ajuste (
    id                      INT           NOT NULL IDENTITY(1,1),
    codigo                  NVARCHAR(30)  NOT NULL,
    almacen_id              INT           NOT NULL,
    tipo_ajuste             NVARCHAR(30)  NOT NULL,
    estado                  NVARCHAR(20)  NOT NULL CONSTRAINT DF_ajuste_estado DEFAULT (N'borrador'),
    solicitante_id          INT           NOT NULL,
    aprobador_id            INT           NULL,
    version                 INT           NOT NULL CONSTRAINT DF_ajuste_version DEFAULT (1),
    observacion             NVARCHAR(MAX) NULL,
    documento_origen_tipo   NVARCHAR(40)  NULL,
    documento_origen_id     NVARCHAR(64)  NULL,
    dominio_id              CHAR(36)      NULL,
    created_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_ajuste_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_ajuste_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ajuste PRIMARY KEY (id),
    CONSTRAINT UK_ajuste_codigo UNIQUE (codigo),
    CONSTRAINT FK_ajuste_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_ajuste_solicitante
      FOREIGN KEY (solicitante_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_ajuste_aprobador
      FOREIGN KEY (aprobador_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_ajuste_version CHECK (version >= 1),
    CONSTRAINT CK_ajuste_tipo CHECK (tipo_ajuste IN (N'positivo', N'negativo', N'digitacion', N'conteo', N'error_documental')),
    CONSTRAINT CK_ajuste_estado CHECK (estado IN (
      N'borrador', N'solicitado', N'aprobado', N'rechazado', N'aplicado', N'cancelado', N'revertido'
    ))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_ajuste_dominio_id' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE UNIQUE INDEX UK_ajuste_dominio_id ON dbo.ajuste (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.ajuste_detalle', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ajuste_detalle (
    id                  INT           NOT NULL IDENTITY(1,1),
    ajuste_id           INT           NOT NULL,
    producto_id         INT           NOT NULL,
    cantidad_objetivo   INT           NOT NULL,
    diferencia          INT           NOT NULL,
    motivo_codigo       NVARCHAR(40)  NULL,
    linea_conteo_id     INT           NULL,
    observacion         NVARCHAR(255) NULL,
    dominio_id          CHAR(36)      NULL,
    created_at          DATETIME2(0)  NOT NULL CONSTRAINT DF_ajuste_detalle_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ajuste_detalle PRIMARY KEY (id),
    CONSTRAINT FK_ajuste_detalle_ajuste
      FOREIGN KEY (ajuste_id) REFERENCES dbo.ajuste (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_ajuste_detalle_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_ajuste_detalle_motivo
      FOREIGN KEY (motivo_codigo) REFERENCES dbo.cat_motivo_ajuste (codigo)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_ajuste_detalle_objetivo CHECK (cantidad_objetivo >= 0),
    CONSTRAINT CK_ajuste_detalle_diferencia CHECK (diferencia <> 0)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_ajuste_detalle_dominio_id' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE UNIQUE INDEX UK_ajuste_detalle_dominio_id ON dbo.ajuste_detalle (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- =============================================================================
-- Conteo físico
-- =============================================================================
IF OBJECT_ID(N'dbo.conteo_fisico', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.conteo_fisico (
    id                    INT           NOT NULL IDENTITY(1,1),
    codigo                NVARCHAR(40)  NOT NULL,
    almacen_id            INT           NOT NULL,
    sucursal_id           INT           NULL,
    tipo_conteo           NVARCHAR(30)  NOT NULL,
    descripcion_alcance   NVARCHAR(MAX) NOT NULL,
    estado                NVARCHAR(20)  NOT NULL CONSTRAINT DF_conteo_fisico_estado DEFAULT (N'borrador'),
    responsable_id        INT           NOT NULL,
    bloqueo_activo        BIT           NOT NULL CONSTRAINT DF_conteo_fisico_bloqueo DEFAULT (0),
    version               INT           NOT NULL CONSTRAINT DF_conteo_fisico_version DEFAULT (1),
    dominio_id            CHAR(36)      NULL,
    created_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_conteo_fisico_created DEFAULT (SYSUTCDATETIME()),
    updated_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_conteo_fisico_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_conteo_fisico PRIMARY KEY (id),
    CONSTRAINT UK_conteo_fisico_codigo UNIQUE (codigo),
    CONSTRAINT FK_conteo_fisico_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_conteo_fisico_sucursal
      FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_conteo_fisico_responsable
      FOREIGN KEY (responsable_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_conteo_fisico_version CHECK (version >= 1),
    CONSTRAINT CK_conteo_fisico_tipo CHECK (tipo_conteo IN (N'general', N'parcial', N'ciclico', N'extraordinario')),
    CONSTRAINT CK_conteo_fisico_estado CHECK (estado IN (
      N'borrador', N'abierto', N'en_conteo', N'en_revision', N'cerrado', N'cancelado'
    ))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_conteo_fisico_dominio_id' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE UNIQUE INDEX UK_conteo_fisico_dominio_id ON dbo.conteo_fisico (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.conteo_alcance_producto', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.conteo_alcance_producto (
    id                  INT           NOT NULL IDENTITY(1,1),
    conteo_id           INT           NOT NULL,
    producto_id         INT           NOT NULL,
    existencia_actual   INT           NOT NULL CONSTRAINT DF_conteo_alcance_existencia DEFAULT (0),
    stock_minimo        INT           NOT NULL CONSTRAINT DF_conteo_alcance_minimo DEFAULT (0),
    seleccionado        BIT           NOT NULL CONSTRAINT DF_conteo_alcance_seleccionado DEFAULT (1),
    dominio_id          CHAR(36)      NULL,
    created_at          DATETIME2(0)  NOT NULL CONSTRAINT DF_conteo_alcance_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_conteo_alcance_producto PRIMARY KEY (id),
    CONSTRAINT UK_conteo_alcance_producto UNIQUE (conteo_id, producto_id),
    CONSTRAINT FK_conteo_alcance_conteo
      FOREIGN KEY (conteo_id) REFERENCES dbo.conteo_fisico (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_conteo_alcance_producto_fk
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_conteo_alcance_dominio_id' AND object_id = OBJECT_ID(N'dbo.conteo_alcance_producto'))
  CREATE UNIQUE INDEX UK_conteo_alcance_dominio_id ON dbo.conteo_alcance_producto (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.snapshot_conteo', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.snapshot_conteo (
    id                  INT            NOT NULL IDENTITY(1,1),
    conteo_id           INT            NOT NULL,
    producto_id         INT            NOT NULL,
    cantidad_teorica    INT            NOT NULL,
    costo_referencia    DECIMAL(18,4)  NULL,
    version             INT            NOT NULL CONSTRAINT DF_snapshot_conteo_version DEFAULT (1),
    dominio_id          CHAR(36)       NULL,
    created_at          DATETIME2(0)   NOT NULL CONSTRAINT DF_snapshot_conteo_created DEFAULT (SYSUTCDATETIME()),
    updated_at          DATETIME2(0)   NOT NULL CONSTRAINT DF_snapshot_conteo_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_snapshot_conteo PRIMARY KEY (id),
    CONSTRAINT UK_snapshot_conteo_producto UNIQUE (conteo_id, producto_id),
    CONSTRAINT FK_snapshot_conteo_conteo
      FOREIGN KEY (conteo_id) REFERENCES dbo.conteo_fisico (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_snapshot_conteo_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_snapshot_conteo_cantidad CHECK (cantidad_teorica >= 0)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_snapshot_conteo_dominio_id' AND object_id = OBJECT_ID(N'dbo.snapshot_conteo'))
  CREATE UNIQUE INDEX UK_snapshot_conteo_dominio_id ON dbo.snapshot_conteo (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.linea_conteo', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.linea_conteo (
    id                    INT           NOT NULL IDENTITY(1,1),
    conteo_id             INT           NOT NULL,
    snapshot_id           INT           NOT NULL,
    producto_id           INT           NOT NULL,
    cantidad_contada      INT           NULL,
    cantidad_reconteo     INT           NULL,
    cantidad_aceptada     INT           NULL,
    diferencia            INT           NULL,
    clasificacion         NVARCHAR(30)  NULL,
    estado_linea          NVARCHAR(20)  NOT NULL CONSTRAINT DF_linea_conteo_estado DEFAULT (N'pendiente'),
    regularizacion_tipo   NVARCHAR(20)  NULL,
    regularizacion_id     INT           NULL,
    observacion           NVARCHAR(MAX) NULL,
    version               INT           NOT NULL CONSTRAINT DF_linea_conteo_version DEFAULT (1),
    dominio_id            CHAR(36)      NULL,
    created_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_linea_conteo_created DEFAULT (SYSUTCDATETIME()),
    updated_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_linea_conteo_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_linea_conteo PRIMARY KEY (id),
    CONSTRAINT UK_linea_conteo_snapshot UNIQUE (conteo_id, snapshot_id),
    CONSTRAINT FK_linea_conteo_conteo
      FOREIGN KEY (conteo_id) REFERENCES dbo.conteo_fisico (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_linea_conteo_snapshot
      FOREIGN KEY (snapshot_id) REFERENCES dbo.snapshot_conteo (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_linea_conteo_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_linea_conteo_clasificacion CHECK (
      clasificacion IS NULL OR clasificacion IN (N'cuadra', N'sobrante', N'faltante', N'dano', N'investigacion')
    ),
    CONSTRAINT CK_linea_conteo_estado CHECK (estado_linea IN (
      N'pendiente', N'contada', N'en_reconteo', N'revisada', N'regularizada'
    )),
    CONSTRAINT CK_linea_conteo_reg_tipo CHECK (
      regularizacion_tipo IS NULL OR regularizacion_tipo IN (N'ajuste', N'descarte')
    )
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_linea_conteo_dominio_id' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE UNIQUE INDEX UK_linea_conteo_dominio_id ON dbo.linea_conteo (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- FK diferida: ajuste_detalle.linea_conteo_id → linea_conteo
IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ajuste_detalle_linea_conteo'
)
BEGIN
  ALTER TABLE dbo.ajuste_detalle
    ADD CONSTRAINT FK_ajuste_detalle_linea_conteo
      -- SQL Server 1785: CASCADE/SET NULL choca con otras rutas hacia conteo/ajuste.
      FOREIGN KEY (linea_conteo_id) REFERENCES dbo.linea_conteo (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION;
END
GO

IF OBJECT_ID(N'dbo.auditoria_conteo_fisico', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auditoria_conteo_fisico (
    id              INT           NOT NULL IDENTITY(1,1),
    conteo_id       INT           NOT NULL,
    accion          NVARCHAR(80)  NOT NULL,
    usuario_id      INT           NULL,
    resultado       NVARCHAR(20)  NOT NULL CONSTRAINT DF_auditoria_conteo_resultado DEFAULT (N'OK'),
    detalle         NVARCHAR(MAX) NULL,
    ip_address      NVARCHAR(45)  NULL,
    dominio_id      CHAR(36)      NULL,
    created_at      DATETIME2(0)  NOT NULL CONSTRAINT DF_auditoria_conteo_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_auditoria_conteo_fisico PRIMARY KEY (id),
    CONSTRAINT FK_auditoria_conteo_conteo
      FOREIGN KEY (conteo_id) REFERENCES dbo.conteo_fisico (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_auditoria_conteo_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_auditoria_conteo_resultado CHECK (resultado IN (N'OK', N'RECHAZADO', N'ERROR'))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_auditoria_conteo_dominio_id' AND object_id = OBJECT_ID(N'dbo.auditoria_conteo_fisico'))
  CREATE UNIQUE INDEX UK_auditoria_conteo_dominio_id ON dbo.auditoria_conteo_fisico (dominio_id) WHERE dominio_id IS NOT NULL;
GO

-- =============================================================================
-- Descarte
-- =============================================================================
IF OBJECT_ID(N'dbo.descarte', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.descarte (
    id                      INT           NOT NULL IDENTITY(1,1),
    codigo                  NVARCHAR(40)  NOT NULL,
    almacen_id              INT           NOT NULL,
    sucursal_id             INT           NULL,
    estado                  NVARCHAR(20)  NOT NULL CONSTRAINT DF_descarte_estado DEFAULT (N'borrador'),
    solicitante_id          INT           NOT NULL,
    aprobador_id            INT           NULL,
    version                 INT           NOT NULL CONSTRAINT DF_descarte_version DEFAULT (1),
    observacion             NVARCHAR(MAX) NULL,
    documento_origen_tipo   NVARCHAR(40)  NULL,
    documento_origen_id     NVARCHAR(64)  NULL,
    conteo_origen_id        INT           NULL,
    ajuste_origen_id        INT           NULL,
    transferencia_origen_id INT           NULL,
    movimiento_origen_id    INT           NULL,
    kardex_origen_id        INT           NULL,
    dominio_id              CHAR(36)      NULL,
    created_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_descarte_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)  NOT NULL CONSTRAINT DF_descarte_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_descarte PRIMARY KEY (id),
    CONSTRAINT UK_descarte_codigo UNIQUE (codigo),
    CONSTRAINT FK_descarte_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_descarte_sucursal
      FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_descarte_solicitante
      FOREIGN KEY (solicitante_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_descarte_aprobador
      FOREIGN KEY (aprobador_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_descarte_conteo_origen
      FOREIGN KEY (conteo_origen_id) REFERENCES dbo.conteo_fisico (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT FK_descarte_ajuste_origen
      FOREIGN KEY (ajuste_origen_id) REFERENCES dbo.ajuste (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT FK_descarte_transferencia_origen
      FOREIGN KEY (transferencia_origen_id) REFERENCES dbo.transferencia (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT FK_descarte_movimiento_origen
      FOREIGN KEY (movimiento_origen_id) REFERENCES dbo.movimiento_inventario (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT CK_descarte_version CHECK (version >= 1),
    CONSTRAINT CK_descarte_estado CHECK (estado IN (
      N'borrador', N'solicitado', N'aprobado', N'rechazado', N'aplicado', N'cancelado', N'revertido'
    ))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_descarte_dominio_id' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE UNIQUE INDEX UK_descarte_dominio_id ON dbo.descarte (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.descarte_detalle', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.descarte_detalle (
    id                  INT            NOT NULL IDENTITY(1,1),
    descarte_id         INT            NOT NULL,
    producto_id         INT            NOT NULL,
    cantidad            INT            NOT NULL,
    costo               DECIMAL(18,4)  NOT NULL CONSTRAINT DF_descarte_detalle_costo DEFAULT (0.0000),
    motivo_codigo       NVARCHAR(40)   NOT NULL,
    observacion         NVARCHAR(255)  NULL,
    dominio_id          CHAR(36)       NULL,
    created_at          DATETIME2(0)   NOT NULL CONSTRAINT DF_descarte_detalle_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_descarte_detalle PRIMARY KEY (id),
    CONSTRAINT FK_descarte_detalle_descarte
      FOREIGN KEY (descarte_id) REFERENCES dbo.descarte (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_descarte_detalle_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_descarte_detalle_motivo
      FOREIGN KEY (motivo_codigo) REFERENCES dbo.cat_motivo_descarte (codigo)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_descarte_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT CK_descarte_detalle_costo CHECK (costo >= 0)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_descarte_detalle_dominio_id' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE UNIQUE INDEX UK_descarte_detalle_dominio_id ON dbo.descarte_detalle (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.descarte_evidencia', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.descarte_evidencia (
    id                    INT           NOT NULL IDENTITY(1,1),
    descarte_id           INT           NOT NULL,
    tipo                  NVARCHAR(30)  NOT NULL,
    nombre_archivo        NVARCHAR(255) NULL,
    url_referencia        NVARCHAR(500) NULL,
    comentario            NVARCHAR(MAX) NULL,
    created_by            INT           NULL,
    created_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_descarte_evidencia_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_descarte_evidencia PRIMARY KEY (id),
    CONSTRAINT FK_descarte_evidencia_descarte
      FOREIGN KEY (descarte_id) REFERENCES dbo.descarte (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_descarte_evidencia_usuario
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_descarte_evidencia_tipo CHECK (tipo IN (
      N'fotografia', N'pdf', N'acta', N'documento', N'comentario'
    ))
  );
END
GO

-- =============================================================================
-- Auditoría e idempotencia
-- =============================================================================
IF OBJECT_ID(N'dbo.auditoria_inventario', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auditoria_inventario (
    id                BIGINT         NOT NULL IDENTITY(1,1),
    tipo_accion       NVARCHAR(20)   NOT NULL CONSTRAINT DF_auditoria_inv_tipo DEFAULT (N'movimiento'),
    usuario_id        INT            NULL,
    fecha             DATETIME2(0)   NOT NULL CONSTRAINT DF_auditoria_inv_fecha DEFAULT (SYSUTCDATETIME()),
    resultado         NVARCHAR(20)   NOT NULL CONSTRAINT DF_auditoria_inv_resultado DEFAULT (N'OK'),
    movimiento_id     INT            NULL,
    documento_tipo    NVARCHAR(40)   NULL,
    documento_id      NVARCHAR(64)   NULL,
    producto_id       INT            NULL,
    almacen_id        INT            NULL,
    valor_antes       NVARCHAR(MAX)  NULL, -- JSON
    valor_despues     NVARCHAR(MAX)  NULL, -- JSON
    detalle           NVARCHAR(MAX)  NULL,
    idempotency_key   NVARCHAR(100)  NULL,
    dominio_id        CHAR(36)       NULL,
    CONSTRAINT PK_auditoria_inventario PRIMARY KEY (id),
    CONSTRAINT FK_auditoria_inventario_movimiento
      -- Evita 1785 (múltiples rutas CASCADE vía producto/almacén/movimiento).
      FOREIGN KEY (movimiento_id) REFERENCES dbo.movimiento_inventario (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT FK_auditoria_inventario_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_auditoria_inventario_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_auditoria_inventario_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_auditoria_inv_tipo CHECK (tipo_accion IN (
      N'movimiento', N'aplicacion', N'aprobacion', N'rechazo', N'cancelacion', N'reversion', N'error'
    )),
    CONSTRAINT CK_auditoria_inv_resultado CHECK (resultado IN (N'OK', N'RECHAZADO', N'ERROR'))
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UK_auditoria_inventario_dominio_id' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE UNIQUE INDEX UK_auditoria_inventario_dominio_id ON dbo.auditoria_inventario (dominio_id) WHERE dominio_id IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.inventario_idempotencia', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.inventario_idempotencia (
    idempotency_key   NVARCHAR(100) NOT NULL,
    tipo_operacion    NVARCHAR(60)  NOT NULL,
    documento_tipo    NVARCHAR(40)  NULL,
    documento_id      NVARCHAR(64)  NULL,
    resultado         NVARCHAR(MAX) NULL, -- JSON
    fecha_registro    DATETIME2(0)  NOT NULL CONSTRAINT DF_inv_idempotencia_fecha DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_inventario_idempotencia PRIMARY KEY (idempotency_key)
  );
END
GO

INSERT INTO dbo.inventario_schema_version (version, script_name)
SELECT N'1.0.0', N'05_Inventario.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.inventario_schema_version WHERE script_name = N'05_Inventario.sql'
);
GO

PRINT N'05_Inventario.sql :: tablas de Inventario creadas.';
GO
