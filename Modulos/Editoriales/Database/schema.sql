-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 12_Editoriales.sql
-- Constraints adicionales + procedimientos del módulo Editoriales (catálogo).
-- Ejecutar DESPUÉS de 03_Administracion, 04_Catalogo, 05_Inventario, 09, 10, 11.
-- =============================================================================

USE LibroSys;
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
