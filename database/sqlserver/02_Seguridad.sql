-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 02_Seguridad.sql
-- Equivalente MySQL: database/mysql/02_seguridad.sql
-- =============================================================================

USE LibroSys;
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
