-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 07_Ventas.sql
-- Equivalente: database/mysql/ventas_definitivo/*.sql (VEN-DB-1.2.0)
-- Forma final de pagos (sin columna referencia).
-- =============================================================================

USE LibroSys;
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
