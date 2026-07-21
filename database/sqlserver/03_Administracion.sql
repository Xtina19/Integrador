-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 03_Administracion.sql
-- Equivalente MySQL: database/mysql/03_administracion.sql
-- =============================================================================

USE LibroSys;
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
