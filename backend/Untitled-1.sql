
-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 02_Seguridad.sql
-- Equivalente MySQL: database/mysql/02_seguridad.sql
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- roles
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.roles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.roles (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(30)  NOT NULL,
    nombre          NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(255) NULL,
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_roles_estado DEFAULT (N'activo'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_roles_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_roles_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_roles PRIMARY KEY (id),
    CONSTRAINT UK_roles_codigo UNIQUE (codigo),
    CONSTRAINT CK_roles_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- permisos
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.permisos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.permisos (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(60)  NOT NULL,
    nombre          NVARCHAR(120) NOT NULL,
    modulo          NVARCHAR(50)  NOT NULL,
    descripcion     NVARCHAR(255) NULL,
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_permisos_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_permisos PRIMARY KEY (id),
    CONSTRAINT UK_permisos_codigo UNIQUE (codigo)
  );
END
GO

-- -----------------------------------------------------------------------------
-- rol_permiso
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.rol_permiso', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.rol_permiso (
    rol_id          INT          NOT NULL,
    permiso_id      INT          NOT NULL,
    created_at      DATETIME2(0) NOT NULL
                      CONSTRAINT DF_rol_permiso_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_rol_permiso PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT FK_rol_permiso_rol
      FOREIGN KEY (rol_id) REFERENCES dbo.roles (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_rol_permiso_permiso
      FOREIGN KEY (permiso_id) REFERENCES dbo.permisos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION
  );
END
GO

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.usuarios', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.usuarios (
    id              INT           NOT NULL IDENTITY(1,1),
    rol_id          INT           NOT NULL,
    codigo          NVARCHAR(20)  NOT NULL,
    nombre          NVARCHAR(150) NOT NULL,
    apellido        NVARCHAR(150) NULL,
    email           NVARCHAR(150) NOT NULL,
    password_hash   NVARCHAR(255) NOT NULL,
    telefono        NVARCHAR(30)  NULL,
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_usuarios_estado DEFAULT (N'activo'),
    ultimo_acceso   DATETIME2(0)  NULL,
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_usuarios_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_usuarios_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_usuarios PRIMARY KEY (id),
    CONSTRAINT UK_usuarios_codigo UNIQUE (codigo),
    CONSTRAINT UK_usuarios_email UNIQUE (email),
    CONSTRAINT FK_usuarios_rol
      FOREIGN KEY (rol_id) REFERENCES dbo.roles (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_usuarios_estado CHECK (estado IN (N'activo', N'inactivo', N'bloqueado')),
    CONSTRAINT CK_usuarios_email CHECK (email LIKE N'%@%.%')
  );
END
GO

PRINT N'02_Seguridad.sql :: roles, permisos, rol_permiso, usuarios creados.';
GO


-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 03_Administracion.sql
-- Equivalente MySQL: database/mysql/03_administracion.sql
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- categorias
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.categorias', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.categorias (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(20)  NOT NULL,
    nombre          NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(MAX) NULL,
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_categorias_estado DEFAULT (N'activo'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_categorias_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_categorias_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_categorias PRIMARY KEY (id),
    CONSTRAINT UK_categorias_codigo UNIQUE (codigo),
    CONSTRAINT UK_categorias_nombre UNIQUE (nombre),
    CONSTRAINT CK_categorias_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- editoriales
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.editoriales', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.editoriales (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(20)  NOT NULL,
    nombre          NVARCHAR(200) NOT NULL,
    pais            NVARCHAR(100) NULL,
    contacto        NVARCHAR(150) NULL,
    email           NVARCHAR(150) NULL,
    telefono        NVARCHAR(30)  NULL,
    tipo_contrato   NVARCHAR(100) NULL,
    fecha_vencimiento DATE        NULL,
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_editoriales_estado DEFAULT (N'activo'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_editoriales_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_editoriales_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_editoriales PRIMARY KEY (id),
    CONSTRAINT UK_editoriales_codigo UNIQUE (codigo),
    CONSTRAINT CK_editoriales_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- proveedores
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.proveedores', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.proveedores (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(20)  NOT NULL,
    nombre          NVARCHAR(200) NOT NULL,
    contacto        NVARCHAR(150) NULL,
    email           NVARCHAR(150) NULL,
    telefono        NVARCHAR(30)  NULL,
    pais            NVARCHAR(100) NULL,
    tipo            NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_proveedores_tipo DEFAULT (N'nacional'),
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_proveedores_estado DEFAULT (N'activo'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_proveedores_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_proveedores_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_proveedores PRIMARY KEY (id),
    CONSTRAINT UK_proveedores_codigo UNIQUE (codigo),
    CONSTRAINT CK_proveedores_tipo CHECK (tipo IN (N'nacional', N'internacional', N'mixto')),
    CONSTRAINT CK_proveedores_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- sucursales
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sucursales', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sucursales (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(20)  NOT NULL,
    nombre          NVARCHAR(150) NOT NULL,
    ciudad          NVARCHAR(100) NULL,
    direccion       NVARCHAR(255) NULL,
    telefono        NVARCHAR(30)  NULL,
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_sucursales_estado DEFAULT (N'activa'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_sucursales_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_sucursales_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_sucursales PRIMARY KEY (id),
    CONSTRAINT UK_sucursales_codigo UNIQUE (codigo),
    CONSTRAINT CK_sucursales_estado CHECK (estado IN (N'activa', N'inactiva'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- almacenes (incluye columnas de bloqueo del pack Inventario definitivo)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.almacenes', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.almacenes (
    id                    INT           NOT NULL IDENTITY(1,1),
    sucursal_id           INT           NULL,
    codigo                NVARCHAR(20)  NOT NULL,
    nombre                NVARCHAR(150) NOT NULL,
    tipo                  NVARCHAR(20)  NOT NULL
                            CONSTRAINT DF_almacenes_tipo DEFAULT (N'central'),
    capacidad             INT           NULL,
    estado                NVARCHAR(20)  NOT NULL
                            CONSTRAINT DF_almacenes_estado DEFAULT (N'activo'),
    bloqueado_por_conteo  BIT           NOT NULL
                            CONSTRAINT DF_almacenes_bloqueado DEFAULT (0),
    conteo_bloqueante_id  CHAR(36)      NULL,
    created_at            DATETIME2(0)  NOT NULL
                            CONSTRAINT DF_almacenes_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at            DATETIME2(0)  NOT NULL
                            CONSTRAINT DF_almacenes_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_almacenes PRIMARY KEY (id),
    CONSTRAINT UK_almacenes_codigo UNIQUE (codigo),
    CONSTRAINT FK_almacenes_sucursal
      FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_almacenes_tipo CHECK (tipo IN (N'central', N'sucursal', N'transito', N'evento')),
    CONSTRAINT CK_almacenes_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- monedas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.monedas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.monedas (
    id              INT           NOT NULL IDENTITY(1,1),
    codigo          NVARCHAR(5)   NOT NULL,
    nombre          NVARCHAR(100) NOT NULL,
    simbolo         NVARCHAR(10)  NOT NULL,
    es_principal    BIT           NOT NULL
                      CONSTRAINT DF_monedas_es_principal DEFAULT (0),
    estado          NVARCHAR(20)  NOT NULL
                      CONSTRAINT DF_monedas_estado DEFAULT (N'activa'),
    created_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_monedas_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL
                      CONSTRAINT DF_monedas_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_monedas PRIMARY KEY (id),
    CONSTRAINT UK_monedas_codigo UNIQUE (codigo),
    CONSTRAINT CK_monedas_estado CHECK (estado IN (N'activa', N'inactiva'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- tasas_cambio
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.tasas_cambio', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.tasas_cambio (
    id                  INT            NOT NULL IDENTITY(1,1),
    moneda_origen_id    INT            NOT NULL,
    moneda_destino_id   INT            NOT NULL,
    tasa                DECIMAL(18,6)  NOT NULL,
    vigente_desde       DATETIME2(0)   NOT NULL,
    vigente_hasta       DATETIME2(0)   NULL,
    actualizado_por_id  INT            NULL,
    created_at          DATETIME2(0)   NOT NULL
                          CONSTRAINT DF_tasas_cambio_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_tasas_cambio PRIMARY KEY (id),
    CONSTRAINT FK_tasas_origen
      FOREIGN KEY (moneda_origen_id) REFERENCES dbo.monedas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_tasas_destino
      FOREIGN KEY (moneda_destino_id) REFERENCES dbo.monedas (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_tasas_usuario
      FOREIGN KEY (actualizado_por_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_tasas_positiva CHECK (tasa > 0),
    CONSTRAINT CK_tasas_monedas_distintas CHECK (moneda_origen_id <> moneda_destino_id)
  );
END
GO

PRINT N'03_Administracion.sql :: maestros administrativos creados.';
GO


-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 04_Catalogo.sql
-- Equivalente MySQL: 05_inventario.sql (productos) + master_data/01_alter_productos_master.sql
-- Forma final del catálogo de productos (incluye extensiones master data).
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.productos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.productos (
    id                  INT            NOT NULL IDENTITY(1,1),
    codigo              NVARCHAR(20)   NOT NULL,
    isbn                NVARCHAR(20)   NOT NULL,
    codigo_barras       NVARCHAR(64)   NULL,
    titulo              NVARCHAR(255)  NOT NULL,
    autor               NVARCHAR(255)  NULL,
    idioma              NVARCHAR(20)   NULL
                          CONSTRAINT DF_productos_idioma DEFAULT (N'es'),
    pais_origen         NVARCHAR(100)  NULL,
    categoria_id        INT            NOT NULL,
    subcategoria        NVARCHAR(80)   NULL,
    editorial_id        INT            NOT NULL,
    moneda_compra_id    INT            NULL,
    costo               DECIMAL(18,4)  NOT NULL
                          CONSTRAINT DF_productos_costo DEFAULT (0.0000),
    costo_promedio      DECIMAL(18,4)  NULL,
    precio              DECIMAL(18,2)  NOT NULL
                          CONSTRAINT DF_productos_precio DEFAULT (0.00),
    peso_kg             DECIMAL(10,3)  NULL,
    dimensiones         NVARCHAR(64)   NULL,
    estado              NVARCHAR(20)   NOT NULL
                          CONSTRAINT DF_productos_estado DEFAULT (N'activo'),
    created_at          DATETIME2(0)   NOT NULL
                          CONSTRAINT DF_productos_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at          DATETIME2(0)   NOT NULL
                          CONSTRAINT DF_productos_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_productos PRIMARY KEY (id),
    CONSTRAINT UK_productos_codigo UNIQUE (codigo),
    CONSTRAINT UK_productos_isbn UNIQUE (isbn),
    CONSTRAINT FK_productos_categoria
      FOREIGN KEY (categoria_id) REFERENCES dbo.categorias (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_productos_editorial
      FOREIGN KEY (editorial_id) REFERENCES dbo.editoriales (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_productos_moneda_compra
      FOREIGN KEY (moneda_compra_id) REFERENCES dbo.monedas (id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT CK_productos_precios CHECK (costo >= 0 AND precio >= 0),
    CONSTRAINT CK_productos_estado CHECK (estado IN (N'activo', N'inactivo', N'descontinuado'))
  );
END
GO

-- UNIQUE filtrado: múltiples NULL en codigo_barras (equivalente MySQL UNIQUE + NULL)
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'UK_productos_codigo_barras' AND object_id = OBJECT_ID(N'dbo.productos')
)
BEGIN
  CREATE UNIQUE INDEX UK_productos_codigo_barras
    ON dbo.productos (codigo_barras)
    WHERE codigo_barras IS NOT NULL;
END
GO

PRINT N'04_Catalogo.sql :: productos (catálogo final) creado.';
GO


-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 05_Inventario.sql
-- Equivalente: mysql/05_inventario.sql + 08_transferencias.sql
--            + inventario_definitivo (02..08) forma final
-- =============================================================================

USE LibTemp;
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

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 06_Compras.sql
-- Equivalente: database/mysql/compras_definitivo/*.sql (COM-DB-1.0.0)
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.compras_schema_version', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.compras_schema_version (
    id            INT           NOT NULL IDENTITY(1,1),
    version       NVARCHAR(20)  NOT NULL,
    script_name   NVARCHAR(100) NOT NULL,
    checksum      NVARCHAR(64)  NULL,
    applied_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_compras_schema_version_applied DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_compras_schema_version PRIMARY KEY (id),
    CONSTRAINT UK_compras_schema_version_script UNIQUE (script_name)
  );
END
GO

-- -----------------------------------------------------------------------------
-- condiciones_pago
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.condiciones_pago', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.condiciones_pago (
    id            INT           NOT NULL IDENTITY(1,1),
    codigo        NVARCHAR(20)  NOT NULL,
    nombre        NVARCHAR(100) NOT NULL,
    dias_credito  INT           NOT NULL CONSTRAINT DF_condiciones_pago_dias DEFAULT (0),
    estado        NVARCHAR(20)  NOT NULL CONSTRAINT DF_condiciones_pago_estado DEFAULT (N'activo'),
    activo        BIT           NOT NULL CONSTRAINT DF_condiciones_pago_activo DEFAULT (1),
    created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_condiciones_pago_created DEFAULT (SYSUTCDATETIME()),
    updated_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_condiciones_pago_updated DEFAULT (SYSUTCDATETIME()),
    created_by    INT           NULL,
    updated_by    INT           NULL,
    CONSTRAINT PK_condiciones_pago PRIMARY KEY (id),
    CONSTRAINT UK_condiciones_pago_codigo UNIQUE (codigo),
    CONSTRAINT FK_condiciones_pago_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_condiciones_pago_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      -- 1785: no puede haber dos ON DELETE SET NULL hacia usuarios en la misma tabla
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_condiciones_dias CHECK (dias_credito >= 0),
    CONSTRAINT CK_condiciones_pago_estado CHECK (estado IN (N'activo', N'inactivo'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- numeracion_documentos
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.numeracion_documentos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.numeracion_documentos (
    id              INT           NOT NULL IDENTITY(1,1),
    tipo_documento  NVARCHAR(10)  NOT NULL,
    anio            SMALLINT      NOT NULL,
    ultimo_numero   INT           NOT NULL CONSTRAINT DF_numeracion_ultimo DEFAULT (0),
    updated_at      DATETIME2(0)  NOT NULL CONSTRAINT DF_numeracion_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_numeracion_documentos PRIMARY KEY (id),
    CONSTRAINT UK_numeracion_tipo_anio UNIQUE (tipo_documento, anio),
    CONSTRAINT CK_numeracion_tipo CHECK (tipo_documento IN (N'OC', N'REC', N'FP')),
    CONSTRAINT CK_numeracion_anio CHECK (anio >= 2000 AND anio <= 2100),
    CONSTRAINT CK_numeracion_ultimo CHECK (ultimo_numero >= 0)
  );
END
GO

-- -----------------------------------------------------------------------------
-- orden_compra
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.orden_compra', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.orden_compra (
    id                      INT            NOT NULL IDENTITY(1,1),
    codigo                  NVARCHAR(30)   NOT NULL,
    proveedor_id            INT            NOT NULL,
    sucursal_id             INT            NULL,
    moneda_id               INT            NOT NULL,
    tasa_cambio             DECIMAL(18,6)  NOT NULL CONSTRAINT DF_orden_compra_tasa DEFAULT (1.000000),
    condicion_pago_id       INT            NOT NULL,
    tipo_compra             NVARCHAR(20)   NOT NULL CONSTRAINT DF_orden_compra_tipo DEFAULT (N'nacional'),
    fecha_orden             DATE           NOT NULL,
    fecha_entrega_estimada  DATE           NULL,
    subtotal                DECIMAL(18,2)  NOT NULL CONSTRAINT DF_orden_compra_subtotal DEFAULT (0.00),
    descuento               DECIMAL(18,2)  NOT NULL CONSTRAINT DF_orden_compra_descuento DEFAULT (0.00),
    impuestos               DECIMAL(18,2)  NOT NULL CONSTRAINT DF_orden_compra_impuestos DEFAULT (0.00),
    total                   DECIMAL(18,2)  NOT NULL CONSTRAINT DF_orden_compra_total DEFAULT (0.00),
    estado                  NVARCHAR(30)   NOT NULL CONSTRAINT DF_orden_compra_estado DEFAULT (N'borrador'),
    activo                  BIT            NOT NULL CONSTRAINT DF_orden_compra_activo DEFAULT (1),
    observaciones           NVARCHAR(MAX)  NULL,
    fecha_aprobacion        DATETIME2(0)   NULL,
    aprobado_por            INT            NULL,
    created_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_orden_compra_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_orden_compra_updated DEFAULT (SYSUTCDATETIME()),
    created_by              INT            NULL,
    updated_by              INT            NULL,
    CONSTRAINT PK_orden_compra PRIMARY KEY (id),
    CONSTRAINT UK_orden_compra_codigo UNIQUE (codigo),
    CONSTRAINT FK_orden_compra_proveedor
      FOREIGN KEY (proveedor_id) REFERENCES dbo.proveedores (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_orden_compra_sucursal
      FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales (id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT FK_orden_compra_moneda
      FOREIGN KEY (moneda_id) REFERENCES dbo.monedas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_orden_compra_condicion_pago
      FOREIGN KEY (condicion_pago_id) REFERENCES dbo.condiciones_pago (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_orden_compra_aprobado_por
      FOREIGN KEY (aprobado_por) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_orden_compra_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_orden_compra_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_orden_compra_totales CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0),
    CONSTRAINT CK_orden_compra_tasa CHECK (tasa_cambio > 0),
    CONSTRAINT CK_orden_compra_tipo CHECK (tipo_compra IN (N'nacional', N'internacional')),
    CONSTRAINT CK_orden_compra_estado CHECK (estado IN (
      N'borrador', N'pendiente_aprobacion', N'aprobada', N'parcialmente_recibida',
      N'recibida', N'cerrada', N'cancelada'
    ))
  );
END
GO

-- -----------------------------------------------------------------------------
-- detalle_orden_compra
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.detalle_orden_compra', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.detalle_orden_compra (
    id                    INT            NOT NULL IDENTITY(1,1),
    orden_compra_id       INT            NOT NULL,
    linea                 INT            NOT NULL,
    producto_id           INT            NOT NULL,
    cantidad_solicitada   INT            NOT NULL,
    costo_unitario        DECIMAL(18,4)  NOT NULL,
    descuento             DECIMAL(18,2)  NOT NULL CONSTRAINT DF_detalle_orden_descuento DEFAULT (0.00),
    impuesto              DECIMAL(18,2)  NOT NULL CONSTRAINT DF_detalle_orden_impuesto DEFAULT (0.00),
    subtotal              DECIMAL(18,2)  NOT NULL,
    activo                BIT            NOT NULL CONSTRAINT DF_detalle_orden_activo DEFAULT (1),
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_orden_created DEFAULT (SYSUTCDATETIME()),
    updated_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_orden_updated DEFAULT (SYSUTCDATETIME()),
    created_by            INT            NULL,
    updated_by            INT            NULL,
    CONSTRAINT PK_detalle_orden_compra PRIMARY KEY (id),
    CONSTRAINT UK_detalle_orden_producto UNIQUE (orden_compra_id, producto_id),
    CONSTRAINT UK_detalle_orden_linea UNIQUE (orden_compra_id, linea),
    CONSTRAINT FK_detalle_orden_compra
      FOREIGN KEY (orden_compra_id) REFERENCES dbo.orden_compra (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_orden_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      -- 1785 con CASCADE paralelo vía otras FKs del grafo compras/catálogo
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_orden_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_orden_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_detalle_orden_cantidad CHECK (cantidad_solicitada > 0),
    CONSTRAINT CK_detalle_orden_montos CHECK (costo_unitario >= 0 AND descuento >= 0 AND impuesto >= 0 AND subtotal >= 0)
  );
END
GO

-- -----------------------------------------------------------------------------
-- recepcion
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.recepcion', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.recepcion (
    id                        INT           NOT NULL IDENTITY(1,1),
    codigo                    NVARCHAR(30)  NOT NULL,
    orden_compra_id           INT           NOT NULL,
    factura_internacional_id  INT           NULL,
    embarque_id               INT           NULL,
    almacen_id                INT           NOT NULL,
    fecha_recepcion           DATE          NOT NULL,
    usuario_receptor          INT           NOT NULL,
    usuario_inspector         INT           NULL,
    resultado_inspeccion      NVARCHAR(30)  NULL,
    observaciones             NVARCHAR(MAX) NULL,
    estado                    NVARCHAR(20)  NOT NULL CONSTRAINT DF_recepcion_estado DEFAULT (N'borrador'),
    activo                    BIT           NOT NULL CONSTRAINT DF_recepcion_activo DEFAULT (1),
    fecha_confirmacion        DATETIME2(0)  NULL,
    created_at                DATETIME2(0)  NOT NULL CONSTRAINT DF_recepcion_created DEFAULT (SYSUTCDATETIME()),
    updated_at                DATETIME2(0)  NOT NULL CONSTRAINT DF_recepcion_updated DEFAULT (SYSUTCDATETIME()),
    created_by                INT           NULL,
    updated_by                INT           NULL,
    CONSTRAINT PK_recepcion PRIMARY KEY (id),
    CONSTRAINT UK_recepcion_codigo UNIQUE (codigo),
    CONSTRAINT FK_recepcion_orden
      FOREIGN KEY (orden_compra_id) REFERENCES dbo.orden_compra (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_recepcion_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      -- 1785: sucursal→almacén y sucursal→orden→recepción
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_recepcion_usuario_receptor
      FOREIGN KEY (usuario_receptor) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_recepcion_usuario_inspector
      FOREIGN KEY (usuario_inspector) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_recepcion_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_recepcion_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_recepcion_estado CHECK (estado IN (N'borrador', N'confirmada', N'anulada')),
    CONSTRAINT CK_recepcion_inspeccion CHECK (
      resultado_inspeccion IS NULL
      OR resultado_inspeccion IN (N'aceptada', N'parcialmente_aceptada', N'rechazada')
    )
  );
END
GO

-- -----------------------------------------------------------------------------
-- detalle_recepcion
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.detalle_recepcion', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.detalle_recepcion (
    id                      INT            NOT NULL IDENTITY(1,1),
    recepcion_id            INT            NOT NULL,
    detalle_orden_compra_id INT            NOT NULL,
    producto_id             INT            NOT NULL,
    cantidad_recibida       INT            NOT NULL,
    costo_unitario          DECIMAL(18,4)  NOT NULL,
    activo                  BIT            NOT NULL CONSTRAINT DF_detalle_recepcion_activo DEFAULT (1),
    created_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_recepcion_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_recepcion_updated DEFAULT (SYSUTCDATETIME()),
    created_by              INT            NULL,
    updated_by              INT            NULL,
    CONSTRAINT PK_detalle_recepcion PRIMARY KEY (id),
    CONSTRAINT UK_detalle_recepcion_doc UNIQUE (recepcion_id, detalle_orden_compra_id),
    CONSTRAINT FK_detalle_recepcion
      FOREIGN KEY (recepcion_id) REFERENCES dbo.recepcion (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_recepcion_doc_oc
      FOREIGN KEY (detalle_orden_compra_id) REFERENCES dbo.detalle_orden_compra (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_recepcion_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_recepcion_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_recepcion_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_detalle_recepcion_cantidad CHECK (cantidad_recibida > 0),
    CONSTRAINT CK_detalle_recepcion_costo CHECK (costo_unitario >= 0)
  );
END
GO

-- -----------------------------------------------------------------------------
-- factura_proveedor
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.factura_proveedor', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.factura_proveedor (
    id                          INT            NOT NULL IDENTITY(1,1),
    codigo                      NVARCHAR(30)   NOT NULL,
    orden_compra_id             INT            NOT NULL,
    proveedor_id                INT            NOT NULL,
    numero_factura              NVARCHAR(50)   NOT NULL,
    ncf                         NVARCHAR(50)   NULL,
    moneda_id                   INT            NOT NULL,
    tasa_cambio                 DECIMAL(18,6)  NOT NULL CONSTRAINT DF_factura_proveedor_tasa DEFAULT (1.000000),
    condicion_pago_id           INT            NOT NULL,
    fecha_emision               DATE           NOT NULL,
    fecha_recepcion_documento   DATE           NULL,
    fecha_vencimiento           DATE           NULL,
    subtotal                    DECIMAL(18,2)  NOT NULL CONSTRAINT DF_factura_proveedor_subtotal DEFAULT (0.00),
    descuento                   DECIMAL(18,2)  NOT NULL CONSTRAINT DF_factura_proveedor_descuento DEFAULT (0.00),
    impuestos                   DECIMAL(18,2)  NOT NULL CONSTRAINT DF_factura_proveedor_impuestos DEFAULT (0.00),
    total                       DECIMAL(18,2)  NOT NULL CONSTRAINT DF_factura_proveedor_total DEFAULT (0.00),
    estado                      NVARCHAR(20)   NOT NULL CONSTRAINT DF_factura_proveedor_estado DEFAULT (N'registrada'),
    estado_pago                 NVARCHAR(20)   NOT NULL CONSTRAINT DF_factura_proveedor_estado_pago DEFAULT (N'pendiente'),
    activo                      BIT            NOT NULL CONSTRAINT DF_factura_proveedor_activo DEFAULT (1),
    observaciones               NVARCHAR(MAX)  NULL,
    created_at                  DATETIME2(0)   NOT NULL CONSTRAINT DF_factura_proveedor_created DEFAULT (SYSUTCDATETIME()),
    updated_at                  DATETIME2(0)   NOT NULL CONSTRAINT DF_factura_proveedor_updated DEFAULT (SYSUTCDATETIME()),
    created_by                  INT            NULL,
    updated_by                  INT            NULL,
    CONSTRAINT PK_factura_proveedor PRIMARY KEY (id),
    CONSTRAINT UK_factura_proveedor_codigo UNIQUE (codigo),
    CONSTRAINT UK_factura_proveedor_numero UNIQUE (proveedor_id, numero_factura),
    CONSTRAINT UK_factura_proveedor_orden UNIQUE (orden_compra_id),
    CONSTRAINT FK_factura_proveedor_orden
      FOREIGN KEY (orden_compra_id) REFERENCES dbo.orden_compra (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_factura_proveedor_proveedor
      FOREIGN KEY (proveedor_id) REFERENCES dbo.proveedores (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_factura_proveedor_moneda
      FOREIGN KEY (moneda_id) REFERENCES dbo.monedas (id)
      -- 1785: orden_compra también CASCADE a monedas → factura vía orden
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_factura_proveedor_condicion_pago
      FOREIGN KEY (condicion_pago_id) REFERENCES dbo.condiciones_pago (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_factura_proveedor_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_factura_proveedor_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_factura_proveedor_totales CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0),
    CONSTRAINT CK_factura_proveedor_tasa CHECK (tasa_cambio > 0),
    CONSTRAINT CK_factura_proveedor_estado CHECK (estado IN (N'registrada', N'contabilizada', N'anulada')),
    CONSTRAINT CK_factura_proveedor_estado_pago CHECK (estado_pago IN (N'pendiente', N'parcial', N'pagada'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- detalle_factura_proveedor
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.detalle_factura_proveedor', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.detalle_factura_proveedor (
    id                      INT            NOT NULL IDENTITY(1,1),
    factura_proveedor_id    INT            NOT NULL,
    linea                   INT            NOT NULL,
    producto_id             INT            NOT NULL,
    detalle_orden_compra_id INT            NULL,
    cantidad                INT            NOT NULL,
    costo_unitario          DECIMAL(18,4)  NOT NULL,
    descuento               DECIMAL(18,2)  NOT NULL CONSTRAINT DF_detalle_factura_descuento DEFAULT (0.00),
    impuesto                DECIMAL(18,2)  NOT NULL CONSTRAINT DF_detalle_factura_impuesto DEFAULT (0.00),
    subtotal                DECIMAL(18,2)  NOT NULL,
    activo                  BIT            NOT NULL CONSTRAINT DF_detalle_factura_activo DEFAULT (1),
    created_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_factura_created DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0)   NOT NULL CONSTRAINT DF_detalle_factura_updated DEFAULT (SYSUTCDATETIME()),
    created_by              INT            NULL,
    updated_by              INT            NULL,
    CONSTRAINT PK_detalle_factura_proveedor PRIMARY KEY (id),
    CONSTRAINT UK_detalle_factura_linea UNIQUE (factura_proveedor_id, linea),
    CONSTRAINT FK_detalle_factura_proveedor
      FOREIGN KEY (factura_proveedor_id) REFERENCES dbo.factura_proveedor (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_factura_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_factura_doc_oc
      FOREIGN KEY (detalle_orden_compra_id) REFERENCES dbo.detalle_orden_compra (id)
      ON UPDATE NO ACTION ON DELETE SET NULL,
    CONSTRAINT FK_detalle_factura_created_by
      FOREIGN KEY (created_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_detalle_factura_updated_by
      FOREIGN KEY (updated_by) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_detalle_factura_cantidad CHECK (cantidad > 0),
    CONSTRAINT CK_detalle_factura_montos CHECK (costo_unitario >= 0 AND descuento >= 0 AND impuesto >= 0 AND subtotal >= 0)
  );
END
GO

INSERT INTO dbo.compras_schema_version (version, script_name)
SELECT N'1.0.0', N'06_Compras.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.compras_schema_version WHERE script_name = N'06_Compras.sql'
);
GO

PRINT N'06_Compras.sql :: tablas de Compras creadas.';
GO

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 07_Ventas.sql
-- Equivalente: database/mysql/ventas_definitivo/*.sql (VEN-DB-1.2.0)
-- Forma final de pagos (sin columna referencia).
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.ventas_schema_version', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ventas_schema_version (
    id            INT           NOT NULL IDENTITY(1,1),
    version       NVARCHAR(20)  NOT NULL,
    script_name   NVARCHAR(100) NOT NULL,
    checksum      NVARCHAR(64)  NULL,
    applied_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_ventas_schema_version_applied DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ventas_schema_version PRIMARY KEY (id),
    CONSTRAINT UK_ventas_schema_version_script UNIQUE (script_name)
  );
END
GO

-- -----------------------------------------------------------------------------
-- venta_clientes
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.venta_clientes', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.venta_clientes (
    id              INT           NOT NULL IDENTITY(1,1),
    dominio_id      NVARCHAR(64)  NOT NULL,
    codigo          NVARCHAR(30)  NULL,
    nombre          NVARCHAR(200) NOT NULL,
    documento       NVARCHAR(50)  NULL,
    email           NVARCHAR(150) NULL,
    telefono        NVARCHAR(30)  NULL,
    activo          BIT           NOT NULL CONSTRAINT DF_venta_clientes_activo DEFAULT (1),
    created_at      DATETIME2(0)  NOT NULL CONSTRAINT DF_venta_clientes_created DEFAULT (SYSUTCDATETIME()),
    updated_at      DATETIME2(0)  NOT NULL CONSTRAINT DF_venta_clientes_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_venta_clientes PRIMARY KEY (id),
    CONSTRAINT UK_venta_clientes_dominio UNIQUE (dominio_id)
  );
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'UK_venta_clientes_codigo' AND object_id = OBJECT_ID(N'dbo.venta_clientes')
)
  CREATE UNIQUE INDEX UK_venta_clientes_codigo ON dbo.venta_clientes (codigo) WHERE codigo IS NOT NULL;
GO

-- -----------------------------------------------------------------------------
-- ventas_ref_catalogo / ventas_secuencia_factura
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.ventas_ref_catalogo', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ventas_ref_catalogo (
    tipo         NVARCHAR(20)  NOT NULL,
    dominio_id   NVARCHAR(64)  NOT NULL,
    erp_id       INT           NOT NULL,
    codigo_erp   NVARCHAR(40)  NULL,
    notas        NVARCHAR(200) NULL,
    created_at   DATETIME2(0)  NOT NULL CONSTRAINT DF_ventas_ref_catalogo_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ventas_ref_catalogo PRIMARY KEY (tipo, dominio_id),
    CONSTRAINT CK_ventas_ref_tipo CHECK (tipo IN (N'sucursal', N'almacen', N'usuario', N'producto', N'cliente'))
  );
END
GO

IF OBJECT_ID(N'dbo.ventas_secuencia_factura', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ventas_secuencia_factura (
    sucursal_dominio_id NVARCHAR(64) NOT NULL,
    ultimo_numero       INT          NOT NULL CONSTRAINT DF_ventas_secuencia_ultimo DEFAULT (1000),
    updated_at          DATETIME2(0) NOT NULL CONSTRAINT DF_ventas_secuencia_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ventas_secuencia_factura PRIMARY KEY (sucursal_dominio_id)
  );
END
GO

-- -----------------------------------------------------------------------------
-- ventas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.ventas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ventas (
    id                         INT            NOT NULL IDENTITY(1,1),
    dominio_id                 CHAR(36)       NOT NULL,
    numero_factura             NVARCHAR(40)   NOT NULL,
    estado                     NVARCHAR(20)   NOT NULL,
    tipo_venta                 NVARCHAR(30)   NOT NULL,
    cliente_id                 INT            NULL,
    cliente_dominio_id         NVARCHAR(64)   NULL,
    sucursal_id                INT            NOT NULL,
    sucursal_dominio_id        NVARCHAR(64)   NOT NULL,
    almacen_id                 INT            NOT NULL,
    almacen_dominio_id         NVARCHAR(64)   NOT NULL,
    usuario_emision_id         INT            NOT NULL,
    usuario_emision_dominio_id NVARCHAR(64)   NOT NULL,
    moneda_codigo              NVARCHAR(3)    NOT NULL CONSTRAINT DF_ventas_moneda DEFAULT (N'DOP'),
    fecha_emision              DATETIME2(0)   NOT NULL,
    subtotal                   DECIMAL(18,2)  NOT NULL CONSTRAINT DF_ventas_subtotal DEFAULT (0),
    total_descuentos           DECIMAL(18,2)  NOT NULL CONSTRAINT DF_ventas_descuentos DEFAULT (0),
    total                      DECIMAL(18,2)  NOT NULL CONSTRAINT DF_ventas_total DEFAULT (0),
    version                    INT            NOT NULL CONSTRAINT DF_ventas_version DEFAULT (1),
    tiene_cambios              BIT            NOT NULL CONSTRAINT DF_ventas_tiene_cambios DEFAULT (0),
    tiene_devoluciones         BIT            NOT NULL CONSTRAINT DF_ventas_tiene_devoluciones DEFAULT (0),
    tiene_notas_credito        BIT            NOT NULL CONSTRAINT DF_ventas_tiene_nc DEFAULT (0),
    motivo_anulacion           NVARCHAR(500)  NULL,
    created_at                 DATETIME2(0)   NOT NULL CONSTRAINT DF_ventas_created DEFAULT (SYSUTCDATETIME()),
    updated_at                 DATETIME2(0)   NOT NULL CONSTRAINT DF_ventas_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ventas PRIMARY KEY (id),
    CONSTRAINT UK_ventas_dominio_id UNIQUE (dominio_id),
    CONSTRAINT UK_ventas_numero_factura UNIQUE (numero_factura),
    -- NOTA SQL Server: ON UPDATE NO ACTION en sucursal/almacén evita error 1785
    -- (múltiples rutas CASCADE: ventas→sucursales y ventas→almacenes→sucursales).
    -- Equivalente funcional a RESTRICT de MySQL en DELETE; UPDATE de PKs no aplica.
    CONSTRAINT FK_ventas_cliente
      FOREIGN KEY (cliente_id) REFERENCES dbo.venta_clientes (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_ventas_sucursal
      FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_ventas_almacen
      FOREIGN KEY (almacen_id) REFERENCES dbo.almacenes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_ventas_usuario
      FOREIGN KEY (usuario_emision_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_ventas_totales CHECK (subtotal >= 0 AND total_descuentos >= 0 AND total >= 0),
    CONSTRAINT CK_ventas_estado CHECK (estado IN (N'emitida', N'anulada')),
    CONSTRAINT CK_ventas_tipo CHECK (tipo_venta IN (N'consumidor_final', N'cliente_registrado')),
    CONSTRAINT CK_ventas_moneda CHECK (moneda_codigo IN (N'DOP', N'USD', N'COP')),
    CONSTRAINT CK_ventas_cliente_tipo CHECK (
      (tipo_venta = N'consumidor_final' AND cliente_id IS NULL)
      OR (tipo_venta = N'cliente_registrado' AND (cliente_id IS NOT NULL OR cliente_dominio_id IS NOT NULL))
    ),
    CONSTRAINT CK_ventas_anulacion CHECK (
      (estado = N'emitida' AND motivo_anulacion IS NULL)
      OR (estado = N'anulada' AND motivo_anulacion IS NOT NULL)
    )
  );
END
GO

-- -----------------------------------------------------------------------------
-- venta_lineas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.venta_lineas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.venta_lineas (
    id                    INT            NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)       NOT NULL,
    venta_id              INT            NOT NULL,
    producto_id           INT            NOT NULL,
    producto_dominio_id   NVARCHAR(64)   NULL,
    descripcion_snapshot  NVARCHAR(300)  NOT NULL,
    cantidad              INT            NOT NULL,
    precio_unitario       DECIMAL(18,2)  NOT NULL,
    descuento_tipo        NVARCHAR(20)   NULL,
    descuento_valor       DECIMAL(18,4)  NULL,
    importe_neto          DECIMAL(18,2)  NOT NULL,
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_venta_lineas_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_venta_lineas PRIMARY KEY (id),
    CONSTRAINT UK_venta_lineas_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_venta_lineas_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_venta_lineas_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_venta_lineas_cantidad CHECK (cantidad > 0),
    CONSTRAINT CK_venta_lineas_montos CHECK (precio_unitario >= 0 AND importe_neto >= 0),
    CONSTRAINT CK_venta_lineas_descuento_tipo CHECK (
      descuento_tipo IS NULL OR descuento_tipo IN (N'monto', N'porcentaje')
    )
  );
END
GO

-- -----------------------------------------------------------------------------
-- pagos (forma final: sin columna referencia)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.pagos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.pagos (
    id                    INT            NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)       NOT NULL,
    venta_id              INT            NOT NULL,
    forma_pago            NVARCHAR(20)   NOT NULL,
    monto                 DECIMAL(18,2)  NOT NULL,
    moneda_codigo         NVARCHAR(3)    NOT NULL CONSTRAINT DF_pagos_moneda DEFAULT (N'DOP'),
    nota_credito_id       NVARCHAR(64)   NULL,
    vuelto                DECIMAL(18,2)  NULL,
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_pagos_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_pagos PRIMARY KEY (id),
    CONSTRAINT UK_pagos_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_pagos_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_pagos_monto CHECK (monto > 0),
    CONSTRAINT CK_pagos_vuelto CHECK (vuelto IS NULL OR vuelto >= 0),
    CONSTRAINT CK_pagos_forma CHECK (forma_pago IN (N'efectivo', N'tarjeta', N'transferencia', N'nota_credito')),
    CONSTRAINT CK_pagos_moneda CHECK (moneda_codigo IN (N'DOP', N'USD', N'COP'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- cambios / cambio_lineas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.cambios', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cambios (
    id                    INT            NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)       NOT NULL,
    venta_id              INT            NOT NULL,
    fecha                 DATETIME2(0)   NOT NULL,
    usuario_id            INT            NOT NULL,
    usuario_dominio_id    NVARCHAR(64)   NOT NULL,
    diferencia_monto      DECIMAL(18,2)  NOT NULL CONSTRAINT DF_cambios_diferencia DEFAULT (0),
    moneda_codigo         NVARCHAR(3)    NOT NULL CONSTRAINT DF_cambios_moneda DEFAULT (N'DOP'),
    resolucion            NVARCHAR(30)   NOT NULL,
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_cambios_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_cambios PRIMARY KEY (id),
    CONSTRAINT UK_cambios_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_cambios_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_cambios_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_cambios_diferencia CHECK (diferencia_monto >= 0),
    CONSTRAINT CK_cambios_moneda CHECK (moneda_codigo IN (N'DOP', N'USD', N'COP')),
    CONSTRAINT CK_cambios_resolucion CHECK (resolucion IN (
      N'cobro', N'devolucion_dinero', N'nota_credito', N'mixto', N'sin_diferencia'
    ))
  );
END
GO

IF OBJECT_ID(N'dbo.cambio_lineas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.cambio_lineas (
    id                    INT            NOT NULL IDENTITY(1,1),
    cambio_id             INT            NOT NULL,
    tipo                  NVARCHAR(20)   NOT NULL,
    producto_id           INT            NOT NULL,
    producto_dominio_id   NVARCHAR(64)   NULL,
    cantidad              INT            NOT NULL,
    precio_unitario       DECIMAL(18,2)  NULL,
    descripcion_snapshot  NVARCHAR(300)  NULL,
    CONSTRAINT PK_cambio_lineas PRIMARY KEY (id),
    CONSTRAINT FK_cambio_lineas_cambio
      FOREIGN KEY (cambio_id) REFERENCES dbo.cambios (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_cambio_lineas_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_cambio_lineas_cantidad CHECK (cantidad > 0),
    CONSTRAINT CK_cambio_lineas_tipo CHECK (tipo IN (N'devuelta', N'nueva'))
  );
END
GO

-- -----------------------------------------------------------------------------
-- devoluciones / devolucion_lineas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.devoluciones', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.devoluciones (
    id                    INT            NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)       NOT NULL,
    venta_id              INT            NOT NULL,
    fecha                 DATETIME2(0)   NOT NULL,
    usuario_id            INT            NOT NULL,
    usuario_dominio_id    NVARCHAR(64)   NOT NULL,
    aptitud_reingreso     NVARCHAR(20)   NOT NULL,
    compensacion          NVARCHAR(20)   NOT NULL,
    monto_compensacion    DECIMAL(18,2)  NOT NULL CONSTRAINT DF_devoluciones_monto DEFAULT (0),
    moneda_codigo         NVARCHAR(3)    NOT NULL CONSTRAINT DF_devoluciones_moneda DEFAULT (N'DOP'),
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_devoluciones_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_devoluciones PRIMARY KEY (id),
    CONSTRAINT UK_devoluciones_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_devoluciones_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_devoluciones_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_devoluciones_monto CHECK (monto_compensacion >= 0),
    CONSTRAINT CK_devoluciones_aptitud CHECK (aptitud_reingreso IN (N'vendible', N'no_apto', N'no_aplica')),
    CONSTRAINT CK_devoluciones_compensacion CHECK (compensacion IN (N'dinero', N'nota_credito', N'mixto')),
    CONSTRAINT CK_devoluciones_moneda CHECK (moneda_codigo IN (N'DOP', N'USD', N'COP'))
  );
END
GO

IF OBJECT_ID(N'dbo.devolucion_lineas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.devolucion_lineas (
    id                    INT           NOT NULL IDENTITY(1,1),
    devolucion_id         INT           NOT NULL,
    producto_id           INT           NOT NULL,
    producto_dominio_id   NVARCHAR(64)  NULL,
    cantidad              INT           NOT NULL,
    CONSTRAINT PK_devolucion_lineas PRIMARY KEY (id),
    CONSTRAINT FK_devolucion_lineas_dev
      FOREIGN KEY (devolucion_id) REFERENCES dbo.devoluciones (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_devolucion_lineas_producto
      FOREIGN KEY (producto_id) REFERENCES dbo.productos (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT CK_devolucion_lineas_cantidad CHECK (cantidad > 0)
  );
END
GO

-- -----------------------------------------------------------------------------
-- notas_credito / nota_credito_aplicaciones
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.notas_credito', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.notas_credito (
    id                    INT            NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)       NOT NULL,
    venta_id              INT            NOT NULL,
    cliente_id            INT            NOT NULL,
    cliente_dominio_id    NVARCHAR(64)   NOT NULL,
    fecha                 DATETIME2(0)   NOT NULL,
    usuario_id            INT            NOT NULL,
    usuario_dominio_id    NVARCHAR(64)   NOT NULL,
    monto                 DECIMAL(18,2)  NOT NULL,
    moneda_codigo         NVARCHAR(3)    NOT NULL CONSTRAINT DF_notas_credito_moneda DEFAULT (N'DOP'),
    motivo                NVARCHAR(500)  NOT NULL,
    estado                NVARCHAR(30)   NOT NULL CONSTRAINT DF_notas_credito_estado DEFAULT (N'emitida'),
    monto_aplicado        DECIMAL(18,2)  NOT NULL CONSTRAINT DF_notas_credito_aplicado DEFAULT (0),
    created_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_notas_credito_created DEFAULT (SYSUTCDATETIME()),
    updated_at            DATETIME2(0)   NOT NULL CONSTRAINT DF_notas_credito_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_notas_credito PRIMARY KEY (id),
    CONSTRAINT UK_notas_credito_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_notas_credito_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_notas_credito_cliente
      FOREIGN KEY (cliente_id) REFERENCES dbo.venta_clientes (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_notas_credito_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_notas_credito_montos CHECK (monto > 0 AND monto_aplicado >= 0 AND monto_aplicado <= monto),
    CONSTRAINT CK_notas_credito_estado CHECK (estado IN (
      N'emitida', N'parcialmente_aplicada', N'aplicada', N'anulada'
    )),
    CONSTRAINT CK_notas_credito_moneda CHECK (moneda_codigo IN (N'DOP', N'USD', N'COP'))
  );
END
GO

IF OBJECT_ID(N'dbo.nota_credito_aplicaciones', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.nota_credito_aplicaciones (
    id                         INT            NOT NULL IDENTITY(1,1),
    nota_credito_id            INT            NOT NULL,
    venta_destino_id           INT            NOT NULL,
    venta_destino_dominio_id   CHAR(36)       NULL,
    monto_aplicado             DECIMAL(18,2)  NOT NULL,
    fecha                      DATETIME2(0)   NOT NULL,
    CONSTRAINT PK_nota_credito_aplicaciones PRIMARY KEY (id),
    CONSTRAINT FK_nc_aplicaciones_nc
      FOREIGN KEY (nota_credito_id) REFERENCES dbo.notas_credito (id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_nc_aplicaciones_venta
      FOREIGN KEY (venta_destino_id) REFERENCES dbo.ventas (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_nc_aplicaciones_monto CHECK (monto_aplicado > 0)
  );
END
GO

-- -----------------------------------------------------------------------------
-- historial_ventas
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.historial_ventas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.historial_ventas (
    id                    INT           NOT NULL IDENTITY(1,1),
    dominio_id            CHAR(36)      NOT NULL,
    venta_id              INT           NOT NULL,
    tipo_evento           NVARCHAR(30)  NOT NULL,
    usuario_id            INT           NOT NULL,
    usuario_dominio_id    NVARCHAR(64)  NOT NULL,
    fecha                 DATETIME2(0)  NOT NULL,
    resultado             NVARCHAR(20)  NOT NULL CONSTRAINT DF_historial_ventas_resultado DEFAULT (N'OK'),
    detalle               NVARCHAR(500) NULL,
    created_at            DATETIME2(0)  NOT NULL CONSTRAINT DF_historial_ventas_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_historial_ventas PRIMARY KEY (id),
    CONSTRAINT UK_historial_ventas_dominio UNIQUE (dominio_id),
    CONSTRAINT FK_historial_ventas_venta
      FOREIGN KEY (venta_id) REFERENCES dbo.ventas (id)
      ON UPDATE CASCADE ON DELETE NO ACTION,
    CONSTRAINT FK_historial_ventas_usuario
      FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios (id)
      ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT CK_historial_ventas_tipo CHECK (tipo_evento IN (
      N'emision', N'reimpresion', N'descuento', N'pago', N'cambio',
      N'devolucion', N'nota_credito', N'aplicacion_nc', N'anulacion'
    )),
    CONSTRAINT CK_historial_ventas_resultado CHECK (resultado IN (N'OK', N'RECHAZADO', N'ERROR'))
  );
END
GO

INSERT INTO dbo.ventas_schema_version (version, script_name)
SELECT N'1.2.0', N'07_Ventas.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.ventas_schema_version WHERE script_name = N'07_Ventas.sql'
);
GO

PRINT N'07_Ventas.sql :: tablas de Ventas creadas.';
GO

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 08_Views.sql
-- Equivalente: inventario_definitivo/12_vistas_indices.sql (vistas)
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- v_inv_existencias
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_existencias
AS
SELECT
  i.id                    AS existencia_id,
  i.dominio_id,
  p.id                    AS producto_id,
  p.codigo                AS producto_codigo,
  p.titulo                AS producto_titulo,
  p.isbn,
  a.id                    AS almacen_id,
  a.codigo                AS almacen_codigo,
  a.nombre                AS almacen_nombre,
  s.id                    AS sucursal_id,
  s.nombre                AS sucursal_nombre,
  i.stock,
  i.stock_minimo,
  i.estado_stock,
  i.version,
  i.bloqueado_por_conteo,
  i.conteo_bloqueante_id,
  p.costo,
  (i.stock * p.costo)     AS valor_existencia,
  i.updated_at
FROM dbo.inventario i
JOIN dbo.productos p ON p.id = i.producto_id
JOIN dbo.almacenes a ON a.id = i.almacen_id
LEFT JOIN dbo.sucursales s ON s.id = a.sucursal_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_kardex
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_kardex
AS
SELECT
  m.id                    AS movimiento_id,
  m.dominio_id,
  m.producto_id,
  p.codigo                AS producto_codigo,
  p.titulo                AS producto_titulo,
  m.almacen_id,
  a.codigo                AS almacen_codigo,
  a.nombre                AS almacen_nombre,
  m.tipo_movimiento,
  m.sentido,
  m.cantidad,
  m.saldo_anterior,
  m.saldo_posterior,
  m.motivo_codigo,
  m.documento_tipo,
  m.documento_id,
  m.documento_linea_id,
  m.referencia,
  m.referencia_tipo,
  m.movimiento_compensa_id,
  m.idempotency_key,
  m.usuario_id,
  u.nombre                AS usuario_nombre,
  m.observaciones,
  m.fecha_movimiento
FROM dbo.movimiento_inventario m
JOIN dbo.productos p ON p.id = m.producto_id
JOIN dbo.almacenes a ON a.id = m.almacen_id
LEFT JOIN dbo.usuarios u ON u.id = m.usuario_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_auditoria
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_auditoria
AS
SELECT
  ai.id                   AS auditoria_id,
  ai.dominio_id,
  ai.tipo_accion,
  ai.resultado,
  ai.usuario_id,
  u.nombre                AS usuario_nombre,
  ai.movimiento_id,
  ai.documento_tipo,
  ai.documento_id,
  ai.producto_id,
  p.codigo                AS producto_codigo,
  ai.almacen_id,
  a.codigo                AS almacen_codigo,
  ai.valor_antes,
  ai.valor_despues,
  ai.detalle,
  ai.idempotency_key,
  ai.fecha
FROM dbo.auditoria_inventario ai
LEFT JOIN dbo.usuarios u ON u.id = ai.usuario_id
LEFT JOIN dbo.productos p ON p.id = ai.producto_id
LEFT JOIN dbo.almacenes a ON a.id = ai.almacen_id;
GO

-- -----------------------------------------------------------------------------
-- v_inv_transferencias_activas
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_transferencias_activas
AS
SELECT
  t.id                      AS transferencia_id,
  t.dominio_id,
  t.codigo,
  t.estado,
  t.version,
  t.almacen_origen_id,
  ao.codigo                 AS almacen_origen_codigo,
  ao.nombre                 AS almacen_origen_nombre,
  t.almacen_destino_id,
  ad.codigo                 AS almacen_destino_codigo,
  ad.nombre                 AS almacen_destino_nombre,
  t.usuario_solicita_id,
  us.nombre                 AS solicitante_nombre,
  t.usuario_aprueba_id,
  t.fecha_solicitud,
  t.fecha_envio,
  t.fecha_recepcion,
  COUNT(dt.id)              AS total_lineas,
  SUM(dt.cantidad_solicitada) AS total_solicitado,
  SUM(dt.cantidad_despachada) AS total_despachado,
  SUM(dt.cantidad_recibida)   AS total_recibido
FROM dbo.transferencia t
JOIN dbo.almacenes ao ON ao.id = t.almacen_origen_id
JOIN dbo.almacenes ad ON ad.id = t.almacen_destino_id
LEFT JOIN dbo.usuarios us ON us.id = t.usuario_solicita_id
LEFT JOIN dbo.detalle_transferencia dt ON dt.transferencia_id = t.id
WHERE t.estado NOT IN (N'recibida', N'cancelada')
GROUP BY
  t.id, t.dominio_id, t.codigo, t.estado, t.version,
  t.almacen_origen_id, ao.codigo, ao.nombre,
  t.almacen_destino_id, ad.codigo, ad.nombre,
  t.usuario_solicita_id, us.nombre, t.usuario_aprueba_id,
  t.fecha_solicitud, t.fecha_envio, t.fecha_recepcion;
GO

-- -----------------------------------------------------------------------------
-- v_inv_conteos_abiertos
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_conteos_abiertos
AS
SELECT
  c.id                      AS conteo_id,
  c.dominio_id,
  c.codigo,
  c.estado,
  c.tipo_conteo,
  c.version,
  c.almacen_id,
  a.codigo                  AS almacen_codigo,
  a.nombre                  AS almacen_nombre,
  c.sucursal_id,
  c.responsable_id,
  r.nombre                  AS responsable_nombre,
  c.bloqueo_activo,
  COUNT(l.id)               AS total_lineas,
  SUM(CASE WHEN l.estado_linea = N'pendiente' THEN 1 ELSE 0 END)     AS lineas_pendientes,
  SUM(CASE WHEN l.estado_linea = N'contada' THEN 1 ELSE 0 END)       AS lineas_contadas,
  SUM(CASE WHEN l.estado_linea = N'regularizada' THEN 1 ELSE 0 END)  AS lineas_regularizadas,
  c.created_at
FROM dbo.conteo_fisico c
JOIN dbo.almacenes a ON a.id = c.almacen_id
LEFT JOIN dbo.usuarios r ON r.id = c.responsable_id
LEFT JOIN dbo.linea_conteo l ON l.conteo_id = c.id
WHERE c.estado NOT IN (N'cerrado', N'cancelado')
GROUP BY
  c.id, c.dominio_id, c.codigo, c.estado, c.tipo_conteo, c.version,
  c.almacen_id, a.codigo, a.nombre, c.sucursal_id, c.responsable_id,
  r.nombre, c.bloqueo_activo, c.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_ajustes_pendientes
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_ajustes_pendientes
AS
SELECT
  aj.id                     AS ajuste_id,
  aj.dominio_id,
  aj.codigo,
  aj.estado,
  aj.tipo_ajuste,
  aj.version,
  aj.almacen_id,
  a.codigo                  AS almacen_codigo,
  aj.solicitante_id,
  sol.nombre                AS solicitante_nombre,
  aj.aprobador_id,
  COUNT(d.id)               AS total_lineas,
  SUM(d.diferencia)         AS diferencia_total,
  aj.created_at
FROM dbo.ajuste aj
JOIN dbo.almacenes a ON a.id = aj.almacen_id
LEFT JOIN dbo.usuarios sol ON sol.id = aj.solicitante_id
LEFT JOIN dbo.ajuste_detalle d ON d.ajuste_id = aj.id
WHERE aj.estado IN (N'borrador', N'solicitado', N'aprobado')
GROUP BY
  aj.id, aj.dominio_id, aj.codigo, aj.estado, aj.tipo_ajuste, aj.version,
  aj.almacen_id, a.codigo, aj.solicitante_id, sol.nombre, aj.aprobador_id, aj.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_descartes_pendientes
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_descartes_pendientes
AS
SELECT
  de.id                     AS descarte_id,
  de.dominio_id,
  de.codigo,
  de.estado,
  de.version,
  de.almacen_id,
  a.codigo                  AS almacen_codigo,
  de.solicitante_id,
  sol.nombre                AS solicitante_nombre,
  de.aprobador_id,
  COUNT(d.id)               AS total_lineas,
  SUM(d.cantidad)           AS cantidad_total,
  SUM(d.cantidad * d.costo) AS valor_total,
  de.created_at
FROM dbo.descarte de
JOIN dbo.almacenes a ON a.id = de.almacen_id
LEFT JOIN dbo.usuarios sol ON sol.id = de.solicitante_id
LEFT JOIN dbo.descarte_detalle d ON d.descarte_id = de.id
WHERE de.estado IN (N'borrador', N'solicitado', N'aprobado')
GROUP BY
  de.id, de.dominio_id, de.codigo, de.estado, de.version,
  de.almacen_id, a.codigo, de.solicitante_id, sol.nombre, de.aprobador_id, de.created_at;
GO

-- -----------------------------------------------------------------------------
-- v_inv_dashboard_kpis
-- -----------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_inv_dashboard_kpis
AS
SELECT
  (SELECT COALESCE(SUM(i.stock * p.costo), 0)
     FROM dbo.inventario i JOIN dbo.productos p ON p.id = i.producto_id) AS valor_total_inventario,
  (SELECT COUNT(*) FROM dbo.inventario WHERE estado_stock = N'bajo')     AS productos_stock_bajo,
  (SELECT COUNT(*) FROM dbo.inventario WHERE estado_stock = N'agotado')  AS productos_agotados,
  (SELECT COUNT(*) FROM dbo.transferencia WHERE estado NOT IN (N'recibida', N'cancelada'))
                                                                         AS transferencias_activas,
  (SELECT COUNT(*) FROM dbo.conteo_fisico WHERE estado NOT IN (N'cerrado', N'cancelado'))
                                                                         AS conteos_abiertos,
  (SELECT COUNT(*) FROM dbo.ajuste WHERE estado IN (N'borrador', N'solicitado', N'aprobado'))
                                                                         AS ajustes_pendientes,
  (SELECT COUNT(*) FROM dbo.descarte WHERE estado IN (N'borrador', N'solicitado', N'aprobado'))
                                                                         AS descartes_pendientes,
  (SELECT COUNT(*) FROM dbo.inventario WHERE bloqueado_por_conteo = 1)  AS existencias_bloqueadas;
GO

-- Alias de compatibilidad
CREATE OR ALTER VIEW dbo.v_inventario_existencias AS SELECT * FROM dbo.v_inv_existencias;
GO
CREATE OR ALTER VIEW dbo.v_kardex_documento AS SELECT * FROM dbo.v_inv_kardex;
GO
CREATE OR ALTER VIEW dbo.v_auditoria_inventario AS SELECT * FROM dbo.v_inv_auditoria;
GO

PRINT N'08_Views.sql :: vistas de Inventario creadas.';
GO

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

USE LibTemp;
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

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 10_Indexes.sql
-- Índices no-únicos / compuestos (UK ya viven en CREATE TABLE o filtrados).
-- Equivalente: índices de 03_administracion, 05_inventario, compras 10_indices,
--              ventas 09_indices, inventario 12_vistas_indices.
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Seguridad / administración
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_roles_estado' AND object_id = OBJECT_ID(N'dbo.roles'))
  CREATE INDEX IX_roles_estado ON dbo.roles (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_permisos_modulo' AND object_id = OBJECT_ID(N'dbo.permisos'))
  CREATE INDEX IX_permisos_modulo ON dbo.permisos (modulo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_usuarios_rol' AND object_id = OBJECT_ID(N'dbo.usuarios'))
  CREATE INDEX IX_usuarios_rol ON dbo.usuarios (rol_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_usuarios_estado' AND object_id = OBJECT_ID(N'dbo.usuarios'))
  CREATE INDEX IX_usuarios_estado ON dbo.usuarios (estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_editoriales_estado' AND object_id = OBJECT_ID(N'dbo.editoriales'))
  CREATE INDEX IX_editoriales_estado ON dbo.editoriales (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_proveedores_tipo' AND object_id = OBJECT_ID(N'dbo.proveedores'))
  CREATE INDEX IX_proveedores_tipo ON dbo.proveedores (tipo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_proveedores_estado' AND object_id = OBJECT_ID(N'dbo.proveedores'))
  CREATE INDEX IX_proveedores_estado ON dbo.proveedores (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_sucursales_estado' AND object_id = OBJECT_ID(N'dbo.sucursales'))
  CREATE INDEX IX_sucursales_estado ON dbo.sucursales (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_almacenes_sucursal' AND object_id = OBJECT_ID(N'dbo.almacenes'))
  CREATE INDEX IX_almacenes_sucursal ON dbo.almacenes (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_almacenes_tipo' AND object_id = OBJECT_ID(N'dbo.almacenes'))
  CREATE INDEX IX_almacenes_tipo ON dbo.almacenes (tipo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_monedas_estado' AND object_id = OBJECT_ID(N'dbo.monedas'))
  CREATE INDEX IX_monedas_estado ON dbo.monedas (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_tasas_monedas' AND object_id = OBJECT_ID(N'dbo.tasas_cambio'))
  CREATE INDEX IX_tasas_monedas ON dbo.tasas_cambio (moneda_origen_id, moneda_destino_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_tasas_vigencia' AND object_id = OBJECT_ID(N'dbo.tasas_cambio'))
  CREATE INDEX IX_tasas_vigencia ON dbo.tasas_cambio (vigente_desde, vigente_hasta);

-- Productos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_categoria' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_categoria ON dbo.productos (categoria_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_editorial' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_editorial ON dbo.productos (editorial_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_titulo' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_titulo ON dbo.productos (titulo);

-- Inventario / movimientos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_almacen' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_almacen ON dbo.inventario (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_estado' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_estado ON dbo.inventario (estado_stock);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_bloqueado' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_bloqueado ON dbo.inventario (bloqueado_por_conteo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_producto' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_producto ON dbo.movimiento_inventario (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_almacen' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_almacen ON dbo.movimiento_inventario (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_fecha' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_fecha ON dbo.movimiento_inventario (fecha_movimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_referencia' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_referencia ON dbo.movimiento_inventario (referencia_tipo, referencia);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_documento' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_documento ON dbo.movimiento_inventario (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_motivo' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_motivo ON dbo.movimiento_inventario (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_producto_almacen' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_producto_almacen ON dbo.movimiento_inventario (producto_id, almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_fecha_tipo' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_fecha_tipo ON dbo.movimiento_inventario (fecha_movimiento, tipo_movimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_usuario_fecha' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_usuario_fecha ON dbo.movimiento_inventario (usuario_id, fecha_movimiento);

-- Transferencias
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_estado ON dbo.transferencia (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_origen' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_origen ON dbo.transferencia (almacen_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_destino' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_destino ON dbo.transferencia (almacen_destino_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_origen_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_origen_estado ON dbo.transferencia (almacen_origen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_destino_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_destino_estado ON dbo.transferencia (almacen_destino_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_transferencia_producto' AND object_id = OBJECT_ID(N'dbo.detalle_transferencia'))
  CREATE INDEX IX_detalle_transferencia_producto ON dbo.detalle_transferencia (producto_id);

-- Ajustes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_almacen_estado' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_almacen_estado ON dbo.ajuste (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_solicitante' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_solicitante ON dbo.ajuste (solicitante_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_aprobador' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_aprobador ON dbo.ajuste (aprobador_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_documento_origen' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_documento_origen ON dbo.ajuste (documento_origen_tipo, documento_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_ajuste' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_ajuste ON dbo.ajuste_detalle (ajuste_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_producto' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_producto ON dbo.ajuste_detalle (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_motivo' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_motivo ON dbo.ajuste_detalle (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_linea_conteo' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_linea_conteo ON dbo.ajuste_detalle (linea_conteo_id);

-- Conteos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_almacen_estado' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_almacen_estado ON dbo.conteo_fisico (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_sucursal' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_sucursal ON dbo.conteo_fisico (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_responsable' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_responsable ON dbo.conteo_fisico (responsable_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_alcance_producto' AND object_id = OBJECT_ID(N'dbo.conteo_alcance_producto'))
  CREATE INDEX IX_conteo_alcance_producto ON dbo.conteo_alcance_producto (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_snapshot_conteo_producto' AND object_id = OBJECT_ID(N'dbo.snapshot_conteo'))
  CREATE INDEX IX_snapshot_conteo_producto ON dbo.snapshot_conteo (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_conteo' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_conteo ON dbo.linea_conteo (conteo_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_estado' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_estado ON dbo.linea_conteo (estado_linea);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_producto' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_producto ON dbo.linea_conteo (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_regularizacion' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_regularizacion ON dbo.linea_conteo (regularizacion_tipo, regularizacion_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_conteo_conteo' AND object_id = OBJECT_ID(N'dbo.auditoria_conteo_fisico'))
  CREATE INDEX IX_auditoria_conteo_conteo ON dbo.auditoria_conteo_fisico (conteo_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_conteo_accion' AND object_id = OBJECT_ID(N'dbo.auditoria_conteo_fisico'))
  CREATE INDEX IX_auditoria_conteo_accion ON dbo.auditoria_conteo_fisico (accion);

-- Descartes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_almacen_estado' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_almacen_estado ON dbo.descarte (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_sucursal' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_sucursal ON dbo.descarte (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_solicitante' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_solicitante ON dbo.descarte (solicitante_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_aprobador' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_aprobador ON dbo.descarte (aprobador_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_documento_origen' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_documento_origen ON dbo.descarte (documento_origen_tipo, documento_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_descarte' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_descarte ON dbo.descarte_detalle (descarte_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_producto' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_producto ON dbo.descarte_detalle (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_motivo' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_motivo ON dbo.descarte_detalle (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_evidencia_descarte' AND object_id = OBJECT_ID(N'dbo.descarte_evidencia'))
  CREATE INDEX IX_descarte_evidencia_descarte ON dbo.descarte_evidencia (descarte_id);

-- Auditoría inventario / idempotencia
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_movimiento' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_movimiento ON dbo.auditoria_inventario (movimiento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_documento' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_documento ON dbo.auditoria_inventario (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_producto_almacen' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_producto_almacen ON dbo.auditoria_inventario (producto_id, almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_usuario_fecha' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_usuario_fecha ON dbo.auditoria_inventario (usuario_id, fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_idempotency' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_idempotency ON dbo.auditoria_inventario (idempotency_key);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_idempotencia_documento' AND object_id = OBJECT_ID(N'dbo.inventario_idempotencia'))
  CREATE INDEX IX_inventario_idempotencia_documento ON dbo.inventario_idempotencia (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_idempotencia_tipo' AND object_id = OBJECT_ID(N'dbo.inventario_idempotencia'))
  CREATE INDEX IX_inventario_idempotencia_tipo ON dbo.inventario_idempotencia (tipo_operacion);

-- Compras
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_condiciones_pago_estado' AND object_id = OBJECT_ID(N'dbo.condiciones_pago'))
  CREATE INDEX IX_condiciones_pago_estado ON dbo.condiciones_pago (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_condiciones_pago_activo' AND object_id = OBJECT_ID(N'dbo.condiciones_pago'))
  CREATE INDEX IX_condiciones_pago_activo ON dbo.condiciones_pago (activo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_proveedor' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_proveedor ON dbo.orden_compra (proveedor_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_sucursal' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_sucursal ON dbo.orden_compra (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_moneda' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_moneda ON dbo.orden_compra (moneda_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_condicion_pago' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_condicion_pago ON dbo.orden_compra (condicion_pago_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_estado ON dbo.orden_compra (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_tipo' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_tipo ON dbo.orden_compra (tipo_compra);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_fecha' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_fecha ON dbo.orden_compra (fecha_orden);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_activo' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_activo ON dbo.orden_compra (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_proveedor_estado_fecha' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_proveedor_estado_fecha ON dbo.orden_compra (proveedor_id, estado, fecha_orden);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_sucursal_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_sucursal_estado ON dbo.orden_compra (sucursal_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_tipo_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_tipo_estado ON dbo.orden_compra (tipo_compra, estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_producto' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_producto ON dbo.detalle_orden_compra (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_activo' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_activo ON dbo.detalle_orden_compra (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_compra_subtotal' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_compra_subtotal ON dbo.detalle_orden_compra (orden_compra_id, subtotal);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_orden' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_orden ON dbo.recepcion (orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_almacen' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_almacen ON dbo.recepcion (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_estado' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_estado ON dbo.recepcion (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_fecha' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_fecha ON dbo.recepcion (fecha_recepcion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_factura_int' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_factura_int ON dbo.recepcion (factura_internacional_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_embarque' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_embarque ON dbo.recepcion (embarque_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_activo' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_activo ON dbo.recepcion (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_almacen_estado_fecha' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_almacen_estado_fecha ON dbo.recepcion (almacen_id, estado, fecha_recepcion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_orden_estado' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_orden_estado ON dbo.recepcion (orden_compra_id, estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_producto' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_producto ON dbo.detalle_recepcion (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_doc_oc' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_doc_oc ON dbo.detalle_recepcion (detalle_orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_activo' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_activo ON dbo.detalle_recepcion (activo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_proveedor' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_proveedor ON dbo.factura_proveedor (proveedor_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_moneda' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_moneda ON dbo.factura_proveedor (moneda_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_condicion' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_condicion ON dbo.factura_proveedor (condicion_pago_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado ON dbo.factura_proveedor (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado_pago' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado_pago ON dbo.factura_proveedor (estado_pago);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_fecha_emision' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_fecha_emision ON dbo.factura_proveedor (fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_activo' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_activo ON dbo.factura_proveedor (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_proveedor_estado_pago' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_proveedor_estado_pago ON dbo.factura_proveedor (proveedor_id, estado_pago, fecha_vencimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado_fecha' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado_fecha ON dbo.factura_proveedor (estado, fecha_emision);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_producto' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_producto ON dbo.detalle_factura_proveedor (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_doc_oc' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_doc_oc ON dbo.detalle_factura_proveedor (detalle_orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_activo' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_activo ON dbo.detalle_factura_proveedor (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_linea_oc' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_linea_oc ON dbo.detalle_factura_proveedor (detalle_orden_compra_id, factura_proveedor_id);

-- Ventas
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_clientes_nombre' AND object_id = OBJECT_ID(N'dbo.venta_clientes'))
  CREATE INDEX IX_venta_clientes_nombre ON dbo.venta_clientes (nombre);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_clientes_activo' AND object_id = OBJECT_ID(N'dbo.venta_clientes'))
  CREATE INDEX IX_venta_clientes_activo ON dbo.venta_clientes (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_ref_erp' AND object_id = OBJECT_ID(N'dbo.ventas_ref_catalogo'))
  CREATE INDEX IX_ventas_ref_erp ON dbo.ventas_ref_catalogo (tipo, erp_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_sucursal_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_sucursal_fecha ON dbo.ventas (sucursal_id, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_estado_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_estado_fecha ON dbo.ventas (estado, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_cliente' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_cliente ON dbo.ventas (cliente_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_cliente_dominio' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_cliente_dominio ON dbo.ventas (cliente_dominio_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_usuario' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_usuario ON dbo.ventas (usuario_emision_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_sucursal_estado_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_sucursal_estado_fecha ON dbo.ventas (sucursal_id, estado, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_numero_prefix' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_numero_prefix ON dbo.ventas (numero_factura);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_flags_postventa' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_flags_postventa ON dbo.ventas (tiene_cambios, tiene_devoluciones, tiene_notas_credito);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_lineas_venta' AND object_id = OBJECT_ID(N'dbo.venta_lineas'))
  CREATE INDEX IX_venta_lineas_venta ON dbo.venta_lineas (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_lineas_producto' AND object_id = OBJECT_ID(N'dbo.venta_lineas'))
  CREATE INDEX IX_venta_lineas_producto ON dbo.venta_lineas (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_venta' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_venta ON dbo.pagos (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_forma' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_forma ON dbo.pagos (forma_pago);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_nc' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_nc ON dbo.pagos (nota_credito_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_venta_forma' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_venta_forma ON dbo.pagos (venta_id, forma_pago);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambios_venta' AND object_id = OBJECT_ID(N'dbo.cambios'))
  CREATE INDEX IX_cambios_venta ON dbo.cambios (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambios_fecha' AND object_id = OBJECT_ID(N'dbo.cambios'))
  CREATE INDEX IX_cambios_fecha ON dbo.cambios (fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambio_lineas_cambio' AND object_id = OBJECT_ID(N'dbo.cambio_lineas'))
  CREATE INDEX IX_cambio_lineas_cambio ON dbo.cambio_lineas (cambio_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambio_lineas_producto' AND object_id = OBJECT_ID(N'dbo.cambio_lineas'))
  CREATE INDEX IX_cambio_lineas_producto ON dbo.cambio_lineas (producto_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devoluciones_venta' AND object_id = OBJECT_ID(N'dbo.devoluciones'))
  CREATE INDEX IX_devoluciones_venta ON dbo.devoluciones (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devoluciones_fecha' AND object_id = OBJECT_ID(N'dbo.devoluciones'))
  CREATE INDEX IX_devoluciones_fecha ON dbo.devoluciones (fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devolucion_lineas_dev' AND object_id = OBJECT_ID(N'dbo.devolucion_lineas'))
  CREATE INDEX IX_devolucion_lineas_dev ON dbo.devolucion_lineas (devolucion_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devolucion_lineas_producto' AND object_id = OBJECT_ID(N'dbo.devolucion_lineas'))
  CREATE INDEX IX_devolucion_lineas_producto ON dbo.devolucion_lineas (producto_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_venta' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_venta ON dbo.notas_credito (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_cliente' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_cliente ON dbo.notas_credito (cliente_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_estado' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_estado ON dbo.notas_credito (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_nc_aplicaciones_nc' AND object_id = OBJECT_ID(N'dbo.nota_credito_aplicaciones'))
  CREATE INDEX IX_nc_aplicaciones_nc ON dbo.nota_credito_aplicaciones (nota_credito_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_nc_aplicaciones_venta' AND object_id = OBJECT_ID(N'dbo.nota_credito_aplicaciones'))
  CREATE INDEX IX_nc_aplicaciones_venta ON dbo.nota_credito_aplicaciones (venta_destino_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_historial_ventas_venta_fecha' AND object_id = OBJECT_ID(N'dbo.historial_ventas'))
  CREATE INDEX IX_historial_ventas_venta_fecha ON dbo.historial_ventas (venta_id, fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_historial_ventas_tipo' AND object_id = OBJECT_ID(N'dbo.historial_ventas'))
  CREATE INDEX IX_historial_ventas_tipo ON dbo.historial_ventas (tipo_evento);

PRINT N'10_Indexes.sql :: índices creados.';
GO

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 11_SeedData.sql
-- Datos iniciales equivalentes a:
--   mysql/12_seed.sql (seguridad, administración, productos, inventario)
--   inventario_definitivo/02_catalogos.sql (motivos)
--   ventas_definitivo/10_seed_joselito.sql (puente/clientes/secuencia)
--   condiciones_pago mínimas para Compras
-- No incluye módulos fuera de Inventario/Compras/Ventas (eventos, etc.).
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET IDENTITY_INSERT dbo.roles ON;
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE id = 1)
  INSERT INTO dbo.roles (id, codigo, nombre, descripcion, estado) VALUES
  (1, N'ADMIN',   N'Administrador', N'Acceso total al sistema',          N'activo'),
  (2, N'COMPRAS', N'Compras',       N'Gestión de órdenes y recepciones', N'activo'),
  (3, N'IMPORT',  N'Importaciones', N'Gestión de importaciones',         N'activo');
SET IDENTITY_INSERT dbo.roles OFF;
GO

SET IDENTITY_INSERT dbo.permisos ON;
IF NOT EXISTS (SELECT 1 FROM dbo.permisos WHERE id = 1)
  INSERT INTO dbo.permisos (id, codigo, nombre, modulo, descripcion) VALUES
  (1, N'compras.ver',            N'Ver compras',              N'compras',       N'Consultar órdenes de compra'),
  (2, N'compras.crear',          N'Crear compras',            N'compras',       N'Registrar órdenes de compra'),
  (3, N'inventario.ver',         N'Ver inventario',           N'inventario',    N'Consultar stock'),
  (4, N'inventario.ajustar',     N'Ajustar inventario',       N'inventario',    N'Registrar ajustes'),
  (5, N'importaciones.ver',      N'Ver importaciones',        N'importaciones', N'Consultar embarques'),
  (6, N'importaciones.gestionar',N'Gestionar importaciones',  N'importaciones', N'Registrar embarques y costos'),
  (7, N'ventas.crear',           N'Registrar ventas',         N'ventas',        N'Crear ventas'),
  (8, N'eventos.gestionar',      N'Gestionar eventos',        N'eventos',       N'Administrar eventos'),
  (9, N'auditoria.ver',          N'Ver auditoría',            N'auditoria',     N'Consultar registros de auditoría');
SET IDENTITY_INSERT dbo.permisos OFF;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.rol_permiso)
  INSERT INTO dbo.rol_permiso (rol_id, permiso_id) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),
  (2,1),(2,2),(2,3),
  (3,5),(3,6),(3,3);
GO

SET IDENTITY_INSERT dbo.usuarios ON;
IF NOT EXISTS (SELECT 1 FROM dbo.usuarios WHERE id = 1)
  INSERT INTO dbo.usuarios (id, rol_id, codigo, nombre, apellido, email, password_hash, telefono, estado) VALUES
  (1, 1, N'USR-001', N'Ana',   N'García',    N'ana.garcia@librosys.com',    N'$2y$10$LibroSysSeedHashAdmin000000000000000001', N'809-555-0101', N'activo'),
  (2, 2, N'USR-002', N'Luis',  N'Martínez',  N'luis.martinez@librosys.com', N'$2y$10$LibroSysSeedHashCompras00000000000000002', N'809-555-0102', N'activo'),
  (3, 3, N'USR-003', N'María', N'Rodríguez', N'maria.rodriguez@librosys.com',N'$2y$10$LibroSysSeedHashImport00000000000000003', N'809-555-0103', N'activo');
SET IDENTITY_INSERT dbo.usuarios OFF;
GO

SET IDENTITY_INSERT dbo.categorias ON;
IF NOT EXISTS (SELECT 1 FROM dbo.categorias WHERE id = 1)
  INSERT INTO dbo.categorias (id, codigo, nombre, descripcion, estado) VALUES
  (1, N'CAT-FIC', N'Ficción',   N'Novelas y narrativa',           N'activo'),
  (2, N'CAT-INF', N'Infantil',  N'Literatura infantil y juvenil', N'activo'),
  (3, N'CAT-ACA', N'Académico', N'Textos académicos y técnicos',  N'activo'),
  (4, N'CAT-COM', N'Comics',    N'Cómics y novelas gráficas',     N'activo');
SET IDENTITY_INSERT dbo.categorias OFF;
GO

SET IDENTITY_INSERT dbo.editoriales ON;
IF NOT EXISTS (SELECT 1 FROM dbo.editoriales WHERE id = 1)
  INSERT INTO dbo.editoriales (id, codigo, nombre, pais, contacto, email, tipo_contrato, estado) VALUES
  (1, N'ED-PLAN', N'Planeta',              N'España', N'Carlos Ruiz',  N'contacto@planeta.com',  N'Distribución', N'activo'),
  (2, N'ED-SANT', N'Santillana',           N'España', N'Laura Pérez',  N'ventas@santillana.com', N'Distribución', N'activo'),
  (3, N'ED-PRH',  N'Penguin Random House', N'USA',    N'John Smith',   N'sales@prh.com',         N'Importación',  N'activo'),
  (4, N'ED-ALF',  N'Alfaguara',            N'España', N'Elena Torres', N'export@alfaguara.com',  N'Importación',  N'activo');
SET IDENTITY_INSERT dbo.editoriales OFF;
GO

SET IDENTITY_INSERT dbo.proveedores ON;
IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE id = 1)
  INSERT INTO dbo.proveedores (id, codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES
  (1, N'PROV-CORR', N'Distribuidora Corripio',               N'Pedro Díaz',     N'compras@corripio.com.do',      N'809-565-3111',   N'República Dominicana', N'nacional',      N'activo'),
  (2, N'PROV-PLAN', N'Editorial Planeta',                    N'Carlos Ruiz',    N'export@planeta.es',            N'+34-93-492-8000',N'España',               N'internacional', N'activo'),
  (3, N'PROV-SANT', N'Santillana Dominicana',                N'Laura Méndez',   N'pedidos@santillana.com.do',    N'809-565-2200',   N'República Dominicana', N'nacional',      N'activo'),
  (4, N'PROV-PRH',  N'Penguin Random House Grupo Editorial', N'John Smith',     N'latam@penguinrandomhouse.com', N'+1-212-782-9000',N'USA',                  N'internacional', N'activo'),
  (5, N'PROV-NOR',  N'Editorial Norma',                      N'Patricia Gómez', N'rd@norma.com',                 N'809-547-8800',   N'Colombia',             N'mixto',         N'activo');
SET IDENTITY_INSERT dbo.proveedores OFF;
GO

SET IDENTITY_INSERT dbo.sucursales ON;
IF NOT EXISTS (SELECT 1 FROM dbo.sucursales WHERE id = 1)
  INSERT INTO dbo.sucursales (id, codigo, nombre, ciudad, direccion, telefono, estado) VALUES
  (1, N'SUC-CTR', N'Sucursal Central',   N'Santo Domingo', N'Av. Winston Churchill 123', N'809-555-3001', N'activa'),
  (2, N'SUC-STI', N'Sucursal Santiago',  N'Santiago',      N'Calle del Sol 45',          N'809-555-3002', N'activa'),
  (3, N'SUC-LRM', N'Sucursal La Romana', N'La Romana',     N'Calle Principal 8',         N'809-555-3003', N'activa');
SET IDENTITY_INSERT dbo.sucursales OFF;
GO

SET IDENTITY_INSERT dbo.almacenes ON;
IF NOT EXISTS (SELECT 1 FROM dbo.almacenes WHERE id = 1)
  INSERT INTO dbo.almacenes (id, sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES
  (1, 1,    N'ALM-CTR', N'Almacén Central',      N'central',  50000, N'activo'),
  (2, 2,    N'ALM-STI', N'Almacén Santiago',     N'sucursal', 15000, N'activo'),
  (3, 3,    N'ALM-LRM', N'Almacén La Romana',    N'sucursal', 10000, N'activo'),
  (4, NULL, N'ALM-TRN', N'Almacén en Tránsito',  N'transito',  8000, N'activo');
SET IDENTITY_INSERT dbo.almacenes OFF;
GO

SET IDENTITY_INSERT dbo.monedas ON;
IF NOT EXISTS (SELECT 1 FROM dbo.monedas WHERE id = 1)
  INSERT INTO dbo.monedas (id, codigo, nombre, simbolo, es_principal, estado) VALUES
  (1, N'DOP', N'Peso Dominicano',      N'RD$',  1, N'activa'),
  (2, N'USD', N'Dólar Estadounidense', N'$',    0, N'activa'),
  (3, N'EUR', N'Euro',                 N'€',    0, N'activa'),
  (4, N'COP', N'Peso Colombiano',      N'COL$', 0, N'activa');
SET IDENTITY_INSERT dbo.monedas OFF;
GO

SET IDENTITY_INSERT dbo.tasas_cambio ON;
IF NOT EXISTS (SELECT 1 FROM dbo.tasas_cambio WHERE id = 1)
  INSERT INTO dbo.tasas_cambio (id, moneda_origen_id, moneda_destino_id, tasa, vigente_desde, actualizado_por_id) VALUES
  (1, 2, 1, 58.500000, '2026-01-01T00:00:00', 1),
  (2, 3, 1, 63.200000, '2026-01-01T00:00:00', 1),
  (3, 3, 2, 1.080000,  '2026-01-01T00:00:00', 1);
SET IDENTITY_INSERT dbo.tasas_cambio OFF;
GO

-- Catálogos Inventario
MERGE dbo.cat_motivo_descarte AS t
USING (VALUES
  (N'DANO_FISICO', N'Daño físico', N'Producto dañado por manipulación, caída o transporte'),
  (N'VENCIDO', N'Vencido / obsoleto', N'Edición descontinuada o material perecedero vencido'),
  (N'HUMEDAD', N'Humedad / agua', N'Daño por humedad, agua o condiciones de almacenamiento'),
  (N'DEFECTO_FABRICA', N'Defecto de fábrica', N'Defecto de impresión, encuadernación u origen'),
  (N'ROBO_MERMA', N'Robo o merma', N'Faltante no explicado detectado en conteo físico'),
  (N'DEVOLUCION_NO_APTA', N'Devolución no apta reventa', N'Devolución de cliente que no puede reingresar a venta'),
  (N'OTRO', N'Otro', N'Motivo no tipificado; ver observación de la línea')
) AS s(codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
  INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

MERGE dbo.cat_motivo_ajuste AS t
USING (VALUES
  (N'CONTEO_FISICO', N'Regularización de conteo físico', N'Diferencia detectada y regularizada desde un conteo'),
  (N'ERROR_DIGITACION', N'Error de digitación', N'Corrección de cantidad mal capturada en el sistema'),
  (N'MERMA_OPERATIVA', N'Merma operativa', N'Pérdida menor no atribuible a descarte formal'),
  (N'ERROR_DOCUMENTAL', N'Error documental', N'Corrección por documento de origen mal referenciado'),
  (N'CORRECCION_SISTEMA', N'Corrección de sistema', N'Ajuste técnico por migración o incidente de datos'),
  (N'REVERSION_AJUSTE', N'Reversión de ajuste aplicado', N'Movimiento generado al revertir un ajuste aplicado'),
  (N'REVERSION_DESCARTE', N'Reversión de descarte aplicado', N'Movimiento generado al revertir un descarte aplicado')
) AS s(codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
  INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

MERGE dbo.cat_clasificacion_conteo AS t
USING (VALUES
  (N'cuadra', N'Cuadra', N'La cantidad contada coincide con la existencia teórica'),
  (N'sobrante', N'Sobrante', N'La cantidad contada es mayor que la existencia teórica'),
  (N'faltante', N'Faltante', N'La cantidad contada es menor que la existencia teórica'),
  (N'dano', N'Daño', N'La diferencia corresponde a producto dañado detectado en conteo'),
  (N'investigacion', N'En investigación', N'Diferencia pendiente de determinar causa antes de regularizar')
) AS s(codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
  INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

SET IDENTITY_INSERT dbo.productos ON;
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE id = 1)
  INSERT INTO dbo.productos (id, codigo, isbn, titulo, autor, categoria_id, editorial_id, moneda_compra_id, costo, costo_promedio, precio, estado) VALUES
  (1,  N'PRD-001', N'978-0307474728', N'Cien años de soledad',              N'Gabriel García Márquez', 1, 1, 1,  8.50,  8.50, 18.99, N'activo'),
  (2,  N'PRD-002', N'978-8497592432', N'La sombra del viento',              N'Carlos Ruiz Zafón',      1, 1, 1,  6.80,  6.80, 15.50, N'activo'),
  (3,  N'PRD-003', N'978-8498384453', N'Harry Potter y la piedra filosofal',N'J.K. Rowling',           2, 4, 1,  9.20,  9.20, 19.99, N'activo'),
  (4,  N'PRD-004', N'978-0451524935', N'1984',                              N'George Orwell',          1, 3, 1,  4.50,  4.50, 12.00, N'activo'),
  (5,  N'PRD-005', N'978-9584202952', N'El amor en los tiempos del cólera', N'Gabriel García Márquez', 1, 1, 1,  7.90,  7.90, 16.50, N'activo'),
  (6,  N'PRD-006', N'978-6073137125', N'Rayuela',                           N'Julio Cortázar',         1, 2, 1,  8.10,  8.10, 17.25, N'activo'),
  (7,  N'PRD-007', N'978-8466331917', N'El código Da Vinci',                N'Dan Brown',              1, 1, 1,  6.50,  6.50, 14.99, N'activo'),
  (8,  N'PRD-008', N'978-8491050675', N'Don Quijote de la Mancha',          N'Miguel de Cervantes',    3, 2, 1, 10.00, 10.00, 22.00, N'activo'),
  (9,  N'PRD-009', N'978-8497598208', N'El principito',                     N'Antoine de Saint-Exupéry',2,1, 1,  5.20,  5.20, 11.50, N'activo'),
  (10, N'PRD-010', N'978-6075273777', N'Sapiens',                           N'Yuval Noah Harari',      3, 3, 1, 12.00, 12.00, 24.99, N'activo');
SET IDENTITY_INSERT dbo.productos OFF;
GO

SET IDENTITY_INSERT dbo.inventario ON;
IF NOT EXISTS (SELECT 1 FROM dbo.inventario WHERE id = 1)
  INSERT INTO dbo.inventario (id, producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock) VALUES
  (1,  1, 1, 120, 20, N'Pasillo A - Estante 1', N'normal'),
  (2,  2, 1,  85, 15, N'Pasillo A - Estante 2', N'normal'),
  (3,  3, 1,  45, 10, N'Pasillo B - Estante 1', N'normal'),
  (4,  4, 1, 200, 25, N'Pasillo A - Estante 3', N'normal'),
  (5,  5, 1,  30, 10, N'Pasillo C - Estante 1', N'normal'),
  (6,  6, 2,  60, 10, N'Zona A - Rack 1',       N'normal'),
  (7,  7, 2,  15, 10, N'Zona A - Rack 2',       N'bajo'),
  (8,  8, 1,  40,  8, N'Pasillo D - Estante 1', N'normal'),
  (9,  9, 3,  25,  5, N'Estante Infantil 1',    N'normal'),
  (10, 10,1,  55, 10, N'Pasillo E - Estante 1', N'normal');
SET IDENTITY_INSERT dbo.inventario OFF;
GO

-- Condiciones de pago (Compras)
SET IDENTITY_INSERT dbo.condiciones_pago ON;
IF NOT EXISTS (SELECT 1 FROM dbo.condiciones_pago WHERE id = 1)
  INSERT INTO dbo.condiciones_pago (id, codigo, nombre, dias_credito, estado, activo) VALUES
  (1, N'CONTADO', N'Contado', 0, N'activo', 1),
  (2, N'CRED-15', N'Crédito 15 días', 15, N'activo', 1),
  (3, N'CRED-30', N'Crédito 30 días', 30, N'activo', 1),
  (4, N'CRED-60', N'Crédito 60 días', 60, N'activo', 1);
SET IDENTITY_INSERT dbo.condiciones_pago OFF;
GO

-- Numeración documentos año actual
IF NOT EXISTS (SELECT 1 FROM dbo.numeracion_documentos WHERE tipo_documento = N'OC' AND anio = 2026)
  INSERT INTO dbo.numeracion_documentos (tipo_documento, anio, ultimo_numero) VALUES
  (N'OC', 2026, 0), (N'REC', 2026, 0), (N'FP', 2026, 0);
GO

-- Ventas: clientes, puente dominio, secuencia
IF NOT EXISTS (SELECT 1 FROM dbo.venta_clientes WHERE dominio_id = N'cli-lasalle')
  INSERT INTO dbo.venta_clientes (dominio_id, codigo, nombre, documento, activo) VALUES
  (N'cli-lasalle',    N'CLI-LAS', N'Colegio La Salle',          N'RNC-101000001', 1),
  (N'cli-iberia',     N'CLI-IBE', N'Instituto Iberia',          N'RNC-101000010', 1),
  (N'cli-pucmm',      N'CLI-PUC', N'PUCMM',                     N'RNC-101000002', 1),
  (N'cli-utesa',      N'CLI-UTE', N'UTESA',                     N'RNC-101000003', 1),
  (N'cli-sagrado',    N'CLI-SAG', N'Colegio Sagrado Corazón',   N'RNC-101000011', 1),
  (N'cli-libuni',     N'CLI-LUN', N'Librería Universitaria',    N'RNC-101000012', 1),
  (N'cli-fundacion', N'CLI-FMM', N'Fundación Madre y Maestra', N'RNC-101000013', 1),
  (N'cli-mostrador',  N'CLI-MOS', N'Cliente de Mostrador',      NULL, 1);
GO

MERGE dbo.ventas_ref_catalogo AS t
USING (VALUES
  (N'sucursal', N'suc-central', 1, N'SUC-CTR', N'Sucursal Santo Domingo'),
  (N'sucursal', N'suc-santiago', 2, N'SUC-STI', N'Sucursal Santiago'),
  (N'almacen',  N'alm-central', 1, N'ALM-CTR', N'Almacén Central'),
  (N'almacen',  N'alm-polanco', 1, N'ALM-CTR', N'Alias → Central'),
  (N'almacen',  N'alm-santiago', 2, N'ALM-STI', N'Almacén Santiago'),
  (N'usuario',  N'usr-admin', 1, N'USR-001', N'Administrador'),
  (N'usuario',  N'usr-cajero', 1, N'USR-001', N'Cajero'),
  (N'usuario',  N'usr-supervisor', 2, N'USR-002', N'Supervisor Compras/Ventas'),
  (N'producto', N'prod-cien', 1, N'PRD-001', N'Cien años de soledad'),
  (N'producto', N'prod-sombra', 2, N'PRD-002', N'La sombra del viento'),
  (N'producto', N'prod-quijote', 8, N'PRD-008', N'Don Quijote de la Mancha'),
  (N'producto', N'prod-principito', 9, N'PRD-009', N'El Principito'),
  (N'producto', N'prod-1984', 4, N'PRD-004', N'1984')
) AS s(tipo, dominio_id, erp_id, codigo_erp, notas)
ON t.tipo = s.tipo AND t.dominio_id = s.dominio_id
WHEN MATCHED THEN UPDATE SET erp_id = s.erp_id, codigo_erp = s.codigo_erp, notas = s.notas
WHEN NOT MATCHED THEN INSERT (tipo, dominio_id, erp_id, codigo_erp, notas)
  VALUES (s.tipo, s.dominio_id, s.erp_id, s.codigo_erp, s.notas);
GO

MERGE dbo.ventas_ref_catalogo AS t
USING (
  SELECT N'cliente' AS tipo, c.dominio_id, c.id AS erp_id, c.codigo AS codigo_erp
  FROM dbo.venta_clientes c
) AS s
ON t.tipo = s.tipo AND t.dominio_id = s.dominio_id
WHEN MATCHED THEN UPDATE SET erp_id = s.erp_id, codigo_erp = s.codigo_erp
WHEN NOT MATCHED THEN INSERT (tipo, dominio_id, erp_id, codigo_erp)
  VALUES (s.tipo, s.dominio_id, s.erp_id, s.codigo_erp);
GO

MERGE dbo.ventas_secuencia_factura AS t
USING (VALUES
  (N'suc-central', 1006),
  (N'suc-santiago', 1001)
) AS s(sucursal_dominio_id, ultimo_numero)
ON t.sucursal_dominio_id = s.sucursal_dominio_id
WHEN MATCHED THEN UPDATE SET ultimo_numero = CASE WHEN t.ultimo_numero > s.ultimo_numero THEN t.ultimo_numero ELSE s.ultimo_numero END
WHEN NOT MATCHED THEN INSERT (sucursal_dominio_id, ultimo_numero) VALUES (s.sucursal_dominio_id, s.ultimo_numero);
GO

PRINT N'11_SeedData.sql :: datos iniciales cargados.';
GO

-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 12_Editoriales.sql
-- Constraints adicionales + procedimientos del módulo Editoriales (catálogo).
-- Ejecutar DESPUÉS de 03_Administracion, 04_Catalogo, 05_Inventario, 09, 10, 11.
-- =============================================================================

USE LibTemp;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- Constraints / índices adicionales (idempotente)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
  SELECT 1 FROM sys.key_constraints
  WHERE name = N'UK_editoriales_nombre' AND parent_object_id = OBJECT_ID(N'dbo.editoriales')
)
BEGIN
  ALTER TABLE dbo.editoriales
    ADD CONSTRAINT UK_editoriales_nombre UNIQUE (nombre);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = N'CK_editoriales_email' AND parent_object_id = OBJECT_ID(N'dbo.editoriales')
)
BEGIN
  ALTER TABLE dbo.editoriales
    ADD CONSTRAINT CK_editoriales_email CHECK (
      email IS NULL
      OR (
        LEN(email) >= 5
        AND CHARINDEX(N'@', email) > 1
        AND CHARINDEX(N'.', email, CHARINDEX(N'@', email)) > CHARINDEX(N'@', email) + 1
      )
    );
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_editoriales_fecha_vencimiento' AND object_id = OBJECT_ID(N'dbo.editoriales')
)
  CREATE INDEX IX_editoriales_fecha_vencimiento ON dbo.editoriales (fecha_vencimiento);
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Listar
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Listar', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Listar;
GO
CREATE PROCEDURE dbo.sp_Editorial_Listar
  @q        NVARCHAR(100) = NULL,
  @estado   NVARCHAR(20)  = NULL,
  @page     INT           = 1,
  @pageSize INT           = 50
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  IF @page IS NULL OR @page < 1 SET @page = 1;
  IF @pageSize IS NULL OR @pageSize < 1 SET @pageSize = 50;
  IF @pageSize > 100 SET @pageSize = 100;

  DECLARE @offset INT = (@page - 1) * @pageSize;
  DECLARE @qLike NVARCHAR(110) = NULL;
  IF @q IS NOT NULL AND LTRIM(RTRIM(@q)) <> N''
    SET @qLike = N'%' + LTRIM(RTRIM(@q)) + N'%';

  SELECT COUNT(*) AS total
  FROM dbo.editoriales e
  WHERE (@qLike IS NULL
         OR e.codigo LIKE @qLike
         OR e.nombre LIKE @qLike
         OR e.pais LIKE @qLike
         OR e.contacto LIKE @qLike
         OR e.email LIKE @qLike)
    AND (@estado IS NULL OR @estado = N'' OR e.estado = @estado);

  SELECT
    e.id,
    e.codigo,
    e.nombre,
    e.pais,
    e.contacto,
    e.email,
    e.telefono,
    e.tipo_contrato,
    e.fecha_vencimiento,
    e.estado,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) AS productCount
  FROM dbo.editoriales e
  WHERE (@qLike IS NULL
         OR e.codigo LIKE @qLike
         OR e.nombre LIKE @qLike
         OR e.pais LIKE @qLike
         OR e.contacto LIKE @qLike
         OR e.email LIKE @qLike)
    AND (@estado IS NULL OR @estado = N'' OR e.estado = @estado)
  ORDER BY e.nombre
  OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Buscar  (búsqueda rápida / autocomplete)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Buscar', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Buscar;
GO
CREATE PROCEDURE dbo.sp_Editorial_Buscar
  @q        NVARCHAR(100),
  @soloActivos BIT = 1,
  @top      INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  IF @q IS NULL OR LTRIM(RTRIM(@q)) = N''
  BEGIN
    THROW 50001, N'Debe indicar un criterio de búsqueda.', 1;
  END

  IF @top IS NULL OR @top < 1 SET @top = 20;
  IF @top > 50 SET @top = 50;

  DECLARE @qLike NVARCHAR(110) = N'%' + LTRIM(RTRIM(@q)) + N'%';

  SELECT TOP (@top)
    e.id,
    e.codigo,
    e.nombre,
    e.pais,
    e.contacto,
    e.email,
    e.telefono,
    e.tipo_contrato,
    e.fecha_vencimiento,
    e.estado,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) AS productCount
  FROM dbo.editoriales e
  WHERE (e.codigo LIKE @qLike OR e.nombre LIKE @qLike OR e.pais LIKE @qLike OR e.email LIKE @qLike)
    AND (@soloActivos = 0 OR e.estado = N'activo')
  ORDER BY e.nombre;
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Obtener
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Obtener', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Obtener;
GO
CREATE PROCEDURE dbo.sp_Editorial_Obtener
  @id INT
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  IF @id IS NULL OR @id < 1
  BEGIN
    THROW 50002, N'Identificador de editorial inválido.', 1;
  END

  SELECT
    e.id,
    e.codigo,
    e.nombre,
    e.pais,
    e.contacto,
    e.email,
    e.telefono,
    e.tipo_contrato,
    e.fecha_vencimiento,
    e.estado,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) AS productCount
  FROM dbo.editoriales e
  WHERE e.id = @id;
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Crear
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Crear', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Crear;
GO
CREATE PROCEDURE dbo.sp_Editorial_Crear
  @codigo            NVARCHAR(20),
  @nombre            NVARCHAR(200),
  @pais              NVARCHAR(100) = NULL,
  @contacto          NVARCHAR(150) = NULL,
  @email             NVARCHAR(150) = NULL,
  @telefono          NVARCHAR(30)  = NULL,
  @tipo_contrato     NVARCHAR(100) = NULL,
  @fecha_vencimiento DATE          = NULL,
  @estado            NVARCHAR(20)  = N'activo',
  @nuevo_id          INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;
  SET XACT_ABORT ON;

  SET @codigo = UPPER(LTRIM(RTRIM(ISNULL(@codigo, N''))));
  SET @nombre = LTRIM(RTRIM(ISNULL(@nombre, N'')));
  SET @estado = LOWER(LTRIM(RTRIM(ISNULL(@estado, N'activo'))));

  IF @codigo = N''
  BEGIN
    THROW 50010, N'El código es obligatorio.', 1;
  END
  IF @nombre = N''
  BEGIN
    THROW 50011, N'El nombre es obligatorio.', 1;
  END
  IF @estado NOT IN (N'activo', N'inactivo')
  BEGIN
    THROW 50012, N'Estado inválido. Use activo o inactivo.', 1;
  END
  IF EXISTS (SELECT 1 FROM dbo.editoriales WHERE codigo = @codigo)
  BEGIN
    THROW 50013, N'Código duplicado.', 1;
  END
  IF EXISTS (SELECT 1 FROM dbo.editoriales WHERE nombre = @nombre)
  BEGIN
    THROW 50014, N'Nombre duplicado.', 1;
  END

  BEGIN TRY
    BEGIN TRAN;

    INSERT INTO dbo.editoriales (
      codigo, nombre, pais, contacto, email, telefono,
      tipo_contrato, fecha_vencimiento, estado
    )
    VALUES (
      @codigo, @nombre, @pais, @contacto, @email, @telefono,
      @tipo_contrato, @fecha_vencimiento, @estado
    );

    SET @nuevo_id = CAST(SCOPE_IDENTITY() AS INT);

    COMMIT TRAN;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
  END CATCH
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Actualizar
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Actualizar', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Actualizar;
GO
CREATE PROCEDURE dbo.sp_Editorial_Actualizar
  @id                INT,
  @codigo            NVARCHAR(20),
  @nombre            NVARCHAR(200),
  @pais              NVARCHAR(100) = NULL,
  @contacto          NVARCHAR(150) = NULL,
  @email             NVARCHAR(150) = NULL,
  @telefono          NVARCHAR(30)  = NULL,
  @tipo_contrato     NVARCHAR(100) = NULL,
  @fecha_vencimiento DATE          = NULL,
  @estado            NVARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;
  SET XACT_ABORT ON;

  SET @codigo = UPPER(LTRIM(RTRIM(ISNULL(@codigo, N''))));
  SET @nombre = LTRIM(RTRIM(ISNULL(@nombre, N'')));
  SET @estado = LOWER(LTRIM(RTRIM(ISNULL(@estado, N''))));

  IF @id IS NULL OR @id < 1
  BEGIN
    THROW 50020, N'Identificador de editorial inválido.', 1;
  END
  IF NOT EXISTS (SELECT 1 FROM dbo.editoriales WHERE id = @id)
  BEGIN
    THROW 50021, N'Editorial no encontrada.', 1;
  END
  IF @codigo = N''
  BEGIN
    THROW 50022, N'El código es obligatorio.', 1;
  END
  IF @nombre = N''
  BEGIN
    THROW 50023, N'El nombre es obligatorio.', 1;
  END
  IF @estado NOT IN (N'activo', N'inactivo')
  BEGIN
    THROW 50024, N'Estado inválido. Use activo o inactivo.', 1;
  END
  IF EXISTS (SELECT 1 FROM dbo.editoriales WHERE codigo = @codigo AND id <> @id)
  BEGIN
    THROW 50025, N'Código duplicado.', 1;
  END
  IF EXISTS (SELECT 1 FROM dbo.editoriales WHERE nombre = @nombre AND id <> @id)
  BEGIN
    THROW 50026, N'Nombre duplicado.', 1;
  END

  BEGIN TRY
    BEGIN TRAN;

    UPDATE dbo.editoriales
    SET
      codigo = @codigo,
      nombre = @nombre,
      pais = @pais,
      contacto = @contacto,
      email = @email,
      telefono = @telefono,
      tipo_contrato = @tipo_contrato,
      fecha_vencimiento = @fecha_vencimiento,
      estado = @estado
    WHERE id = @id;

    COMMIT TRAN;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
  END CATCH
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_CambiarEstado
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_CambiarEstado', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_CambiarEstado;
GO
CREATE PROCEDURE dbo.sp_Editorial_CambiarEstado
  @id     INT,
  @estado NVARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  SET @estado = LOWER(LTRIM(RTRIM(ISNULL(@estado, N''))));

  IF @id IS NULL OR @id < 1
  BEGIN
    THROW 50030, N'Identificador de editorial inválido.', 1;
  END
  IF @estado NOT IN (N'activo', N'inactivo')
  BEGIN
    THROW 50031, N'Estado inválido. Use activo o inactivo.', 1;
  END
  IF NOT EXISTS (SELECT 1 FROM dbo.editoriales WHERE id = @id)
  BEGIN
    THROW 50032, N'Editorial no encontrada.', 1;
  END

  UPDATE dbo.editoriales
  SET estado = @estado
  WHERE id = @id;
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Dashboard (estadísticas reales)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Dashboard', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Dashboard;
GO
CREATE PROCEDURE dbo.sp_Editorial_Dashboard
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  -- Resumen
  SELECT
    (SELECT COUNT(*) FROM dbo.editoriales) AS total,
    (SELECT COUNT(*) FROM dbo.editoriales WHERE estado = N'activo') AS activas,
    (SELECT COUNT(*) FROM dbo.editoriales WHERE estado = N'inactivo') AS inactivas,
    (SELECT COUNT(*) FROM dbo.editoriales e
      WHERE NOT EXISTS (SELECT 1 FROM dbo.productos p WHERE p.editorial_id = e.id)) AS sinProductos,
    (SELECT COUNT(*) FROM dbo.editoriales
      WHERE fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento < CAST(SYSUTCDATETIME() AS DATE)) AS contratosVencidos,
    (SELECT COUNT(*) FROM dbo.editoriales
      WHERE fecha_vencimiento IS NOT NULL
        AND fecha_vencimiento >= CAST(SYSUTCDATETIME() AS DATE)
        AND fecha_vencimiento <= DATEADD(DAY, 30, CAST(SYSUTCDATETIME() AS DATE))) AS contratosPorVencer,
    (SELECT COUNT(*) FROM dbo.editoriales
      WHERE fecha_vencimiento IS NULL
         OR fecha_vencimiento > DATEADD(DAY, 30, CAST(SYSUTCDATETIME() AS DATE))) AS contratosVigentes;

  -- Editorial con más productos (TOP 1; empate por nombre)
  SELECT TOP (1)
    e.id,
    e.codigo,
    e.nombre,
    (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) AS productCount
  FROM dbo.editoriales e
  ORDER BY (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) DESC, e.nombre ASC;

  -- Productos por editorial
  SELECT
    e.id,
    e.codigo,
    e.nombre,
    e.estado,
    (SELECT COUNT(*) FROM dbo.productos p WHERE p.editorial_id = e.id) AS productCount
  FROM dbo.editoriales e
  ORDER BY productCount DESC, e.nombre ASC;

  -- Contratos por vencer (30 días)
  SELECT
    e.id,
    e.codigo,
    e.nombre,
    e.tipo_contrato,
    e.fecha_vencimiento,
    e.estado,
    DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), e.fecha_vencimiento) AS diasRestantes
  FROM dbo.editoriales e
  WHERE e.fecha_vencimiento IS NOT NULL
    AND e.fecha_vencimiento >= CAST(SYSUTCDATETIME() AS DATE)
    AND e.fecha_vencimiento <= DATEADD(DAY, 30, CAST(SYSUTCDATETIME() AS DATE))
  ORDER BY e.fecha_vencimiento ASC;
END
GO

-- -----------------------------------------------------------------------------
-- sp_Editorial_Productos (JOIN real productos + stock)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.sp_Editorial_Productos', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_Editorial_Productos;
GO
CREATE PROCEDURE dbo.sp_Editorial_Productos
  @editorial_id INT = NULL,
  @q            NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;

  DECLARE @qLike NVARCHAR(110) = NULL;
  IF @q IS NOT NULL AND LTRIM(RTRIM(@q)) <> N''
    SET @qLike = N'%' + LTRIM(RTRIM(@q)) + N'%';

  SELECT
    p.id,
    p.codigo,
    p.isbn,
    p.titulo,
    p.autor,
    p.estado,
    p.precio,
    c.nombre AS categoria,
    e.id AS editorial_id,
    e.nombre AS editorial,
    ISNULL((
      SELECT SUM(i.stock)
      FROM dbo.inventario i
      WHERE i.producto_id = p.id
    ), 0) AS stock
  FROM dbo.productos p
  INNER JOIN dbo.editoriales e ON e.id = p.editorial_id
  INNER JOIN dbo.categorias c ON c.id = p.categoria_id
  WHERE (@editorial_id IS NULL OR p.editorial_id = @editorial_id)
    AND (@qLike IS NULL
         OR p.codigo LIKE @qLike
         OR p.isbn LIKE @qLike
         OR p.titulo LIKE @qLike
         OR e.nombre LIKE @qLike)
  ORDER BY e.nombre, p.titulo;
END
GO

PRINT N'12_Editoriales.sql — SPs y constraints de Editoriales aplicados.';
GO
