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

USE LibroSys;
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
