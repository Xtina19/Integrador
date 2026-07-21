-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 04_Catalogo.sql
-- Equivalente MySQL: 05_inventario.sql (productos) + master_data/01_alter_productos_master.sql
-- Forma final del catálogo de productos (incluye extensiones master data).
-- =============================================================================

USE LibroSys;
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
