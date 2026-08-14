/**
 * Aplica DDL del módulo Ventas (public/scriptdb) en LibroSys si faltan tablas.
 * Idempotente — seguro ejecutar en cada arranque.
 */
async function ensureVentasModuleTables(pool) {
  const batches = [
    `
    IF OBJECT_ID(N'dbo.SecuenciaFacturaVenta', N'U') IS NULL
    BEGIN
      CREATE TABLE SecuenciaFacturaVenta (
        id_secuencia INT PRIMARY KEY IDENTITY,
        id_sucursal INT NOT NULL UNIQUE,
        ultimo_numero INT NOT NULL DEFAULT 1000,
        CONSTRAINT fk_sfv_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.SecuenciaNotaCredito', N'U') IS NULL
    BEGIN
      CREATE TABLE SecuenciaNotaCredito (
        id_secuencia TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
        ultimo_numero INT NOT NULL DEFAULT 0,
        CONSTRAINT chk_snc_singleton CHECK (id_secuencia = 1)
      );
      INSERT INTO SecuenciaNotaCredito (id_secuencia, ultimo_numero) VALUES (1, 0);
    END
    `,
    `
    IF OBJECT_ID(N'dbo.FacturaVenta', N'U') IS NULL
    BEGIN
      CREATE TABLE FacturaVenta (
        id_factura INT PRIMARY KEY IDENTITY,
        codigo_dominio VARCHAR(50) NOT NULL UNIQUE,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        estado VARCHAR(20) NOT NULL DEFAULT 'emitida',
        tipo_venta VARCHAR(30) NOT NULL,
        id_persona INT,
        id_sucursal INT NOT NULL,
        id_almacen INT NOT NULL,
        id_usuario_emision INT NOT NULL,
        id_moneda INT NOT NULL,
        fecha_emision DATETIME NOT NULL DEFAULT GETDATE(),
        subtotal DECIMAL(12, 2) NOT NULL,
        total_descuentos DECIMAL(12, 2) NOT NULL DEFAULT 0,
        total DECIMAL(12, 2) NOT NULL,
        version INT NOT NULL DEFAULT 1,
        tiene_cambios BIT NOT NULL DEFAULT 0,
        tiene_devoluciones BIT NOT NULL DEFAULT 0,
        tiene_notas_credito BIT NOT NULL DEFAULT 0,
        motivo_anulacion VARCHAR(255),
        fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_fv_persona FOREIGN KEY (id_persona) REFERENCES Persona(id_persona),
        CONSTRAINT fk_fv_sucursal FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal),
        CONSTRAINT fk_fv_almacen FOREIGN KEY (id_almacen) REFERENCES Almacen(id_almacen),
        CONSTRAINT fk_fv_usuario FOREIGN KEY (id_usuario_emision) REFERENCES Usuario(id_usuario),
        CONSTRAINT fk_fv_moneda FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda),
        CONSTRAINT chk_fv_cliente_registrado CHECK (
          tipo_venta <> 'cliente_registrado' OR id_persona IS NOT NULL
        )
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.DetalleFacturaVenta', N'U') IS NULL
    BEGIN
      CREATE TABLE DetalleFacturaVenta (
        id_detalle INT PRIMARY KEY IDENTITY,
        id_factura INT NOT NULL,
        codigo_dominio VARCHAR(50) NOT NULL,
        id_producto INT NOT NULL,
        id_inventario INT NULL,
        descripcion_snapshot VARCHAR(255) NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(12, 2) NOT NULL,
        descuento_tipo VARCHAR(20),
        descuento_valor DECIMAL(12, 2),
        importe_neto DECIMAL(12, 2) NOT NULL,
        CONSTRAINT fk_dfv_factura FOREIGN KEY (id_factura) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_dfv_producto FOREIGN KEY (id_producto) REFERENCES Producto(id_producto),
        CONSTRAINT fk_dfv_inventario FOREIGN KEY (id_inventario) REFERENCES Inventario(id_inventario)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.PagoFactura', N'U') IS NULL
    BEGIN
      CREATE TABLE PagoFactura (
        id_pago INT PRIMARY KEY IDENTITY,
        id_factura INT NOT NULL,
        codigo_dominio VARCHAR(50) NOT NULL,
        forma_pago VARCHAR(30) NOT NULL,
        monto DECIMAL(12, 2) NOT NULL,
        id_moneda INT NOT NULL,
        id_nota_credito INT NULL,
        vuelto DECIMAL(12, 2),
        CONSTRAINT fk_pf_factura FOREIGN KEY (id_factura) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_pf_moneda FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.HistorialFacturaVenta', N'U') IS NULL
    BEGIN
      CREATE TABLE HistorialFacturaVenta (
        id_historial INT PRIMARY KEY IDENTITY,
        id_factura INT NOT NULL,
        codigo_dominio VARCHAR(50) NOT NULL,
        tipo_evento VARCHAR(50) NOT NULL,
        id_usuario INT NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        resultado VARCHAR(20) NOT NULL,
        detalle VARCHAR(500),
        CONSTRAINT fk_hfv_factura FOREIGN KEY (id_factura) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_hfv_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.CambioFactura', N'U') IS NULL
    BEGIN
      CREATE TABLE CambioFactura (
        id_cambio INT PRIMARY KEY IDENTITY,
        id_factura INT NOT NULL,
        codigo_dominio VARCHAR(50) NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        id_usuario INT NOT NULL,
        diferencia_monto DECIMAL(12, 2) NOT NULL DEFAULT 0,
        id_moneda INT NOT NULL,
        resolucion VARCHAR(50) NOT NULL,
        CONSTRAINT fk_cf_factura FOREIGN KEY (id_factura) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_cf_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
        CONSTRAINT fk_cf_moneda FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.DetalleCambioFactura', N'U') IS NULL
    BEGIN
      CREATE TABLE DetalleCambioFactura (
        id_detalle_cambio INT PRIMARY KEY IDENTITY,
        id_cambio INT NOT NULL,
        tipo_linea VARCHAR(20) NOT NULL,
        id_producto INT NOT NULL,
        id_inventario INT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(12, 2),
        descripcion_snapshot VARCHAR(255),
        CONSTRAINT fk_dcf_cambio FOREIGN KEY (id_cambio) REFERENCES CambioFactura(id_cambio),
        CONSTRAINT fk_dcf_producto FOREIGN KEY (id_producto) REFERENCES Producto(id_producto),
        CONSTRAINT fk_dcf_inventario FOREIGN KEY (id_inventario) REFERENCES Inventario(id_inventario)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.DevolucionFactura', N'U') IS NULL
    BEGIN
      CREATE TABLE DevolucionFactura (
        id_devolucion INT PRIMARY KEY IDENTITY,
        id_factura INT NOT NULL,
        codigo_dominio VARCHAR(50) NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        id_usuario INT NOT NULL,
        aptitud_reingreso VARCHAR(50) NOT NULL,
        compensacion VARCHAR(50) NOT NULL,
        monto_compensacion DECIMAL(12, 2) NOT NULL DEFAULT 0,
        id_moneda INT NOT NULL,
        CONSTRAINT fk_devf_factura FOREIGN KEY (id_factura) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_devf_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
        CONSTRAINT fk_devf_moneda FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.DetalleDevolucionFactura', N'U') IS NULL
    BEGIN
      CREATE TABLE DetalleDevolucionFactura (
        id_detalle_devolucion INT PRIMARY KEY IDENTITY,
        id_devolucion INT NOT NULL,
        id_producto INT NOT NULL,
        id_inventario INT NULL,
        cantidad INT NOT NULL,
        CONSTRAINT fk_ddf_devolucion FOREIGN KEY (id_devolucion) REFERENCES DevolucionFactura(id_devolucion),
        CONSTRAINT fk_ddf_producto FOREIGN KEY (id_producto) REFERENCES Producto(id_producto),
        CONSTRAINT fk_ddf_inventario FOREIGN KEY (id_inventario) REFERENCES Inventario(id_inventario)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.NotaCredito', N'U') IS NULL
    BEGIN
      CREATE TABLE NotaCredito (
        id_nota_credito INT PRIMARY KEY IDENTITY,
        codigo_dominio VARCHAR(50) NOT NULL UNIQUE,
        id_factura_origen INT NOT NULL,
        id_persona INT NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        id_usuario INT NOT NULL,
        monto DECIMAL(12, 2) NOT NULL,
        id_moneda INT NOT NULL,
        motivo VARCHAR(255) NOT NULL,
        estado VARCHAR(30) NOT NULL DEFAULT 'activa',
        monto_aplicado DECIMAL(12, 2) NOT NULL DEFAULT 0,
        CONSTRAINT fk_nc_factura FOREIGN KEY (id_factura_origen) REFERENCES FacturaVenta(id_factura),
        CONSTRAINT fk_nc_persona FOREIGN KEY (id_persona) REFERENCES Persona(id_persona),
        CONSTRAINT fk_nc_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
        CONSTRAINT fk_nc_moneda FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda)
      );
    END
    `,
    `
    IF OBJECT_ID(N'dbo.AplicacionNotaCredito', N'U') IS NULL
    BEGIN
      CREATE TABLE AplicacionNotaCredito (
        id_aplicacion INT PRIMARY KEY IDENTITY,
        id_nota_credito INT NOT NULL,
        id_factura_destino INT NOT NULL,
        monto_aplicado DECIMAL(12, 2) NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_anc_nc FOREIGN KEY (id_nota_credito) REFERENCES NotaCredito(id_nota_credito),
        CONSTRAINT fk_anc_factura FOREIGN KEY (id_factura_destino) REFERENCES FacturaVenta(id_factura)
      );
    END
    `,
    `
    IF NOT EXISTS (SELECT 1 FROM SecuenciaNotaCredito WHERE id_secuencia = 1)
    BEGIN
      INSERT INTO SecuenciaNotaCredito (id_secuencia, ultimo_numero) VALUES (1, 0);
    END
    `,
    `
    IF NOT EXISTS (
      SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_pf_nota_credito'
    )
    BEGIN
      ALTER TABLE PagoFactura ADD CONSTRAINT fk_pf_nota_credito
        FOREIGN KEY (id_nota_credito) REFERENCES NotaCredito(id_nota_credito);
    END
    `,
  ]

  for (const sql of batches) {
    await pool.request().query(sql)
  }

  console.log('[Ventas] tablas SQL Server verificadas (FacturaVenta, NotaCredito, …)')
}

module.exports = { ensureVentasModuleTables }
