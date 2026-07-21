-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 06_Compras.sql
-- Equivalente: database/mysql/compras_definitivo/*.sql (COM-DB-1.0.0)
-- =============================================================================

USE LibroSys;
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
