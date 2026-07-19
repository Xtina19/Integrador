-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 11_seed_joselito.sql
-- Versión: COM-DB-1.0.0  |  FASE 10 — Datos realistas Librería Joselito
-- Fecha: 2026-07-19
--
-- Semilla coherente con la operación comercial (Santo Domingo / Santiago).
-- Prerrequisitos: tablas base (usuarios, monedas, sucursales, almacenes,
-- categorias, editoriales, proveedores, productos) y paquete 02..10.
-- created_by = 2 (usuario Compras).
-- =============================================================================

USE librosys;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Categorías adicionales
-- ---------------------------------------------------------------------------
INSERT INTO categorias (id, codigo, nombre, descripcion, estado) VALUES
(4, 'CAT-COM', 'Cómics y manga', 'Manga, cómics y novelas gráficas', 'activo'),
(5, 'CAT-NEG', 'Negocios y autoayuda', 'Desarrollo personal y finanzas', 'activo'),
(6, 'CAT-TEC', 'Tecnología', 'Informática y ingeniería de software', 'activo')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Editoriales (reales) — actualiza ids 1–2 existentes e inserta el resto
-- ---------------------------------------------------------------------------
UPDATE editoriales SET
  codigo = 'ED-ALF', nombre = 'Alfaguara', pais = 'España',
  contacto = 'Elena Torres', email = 'export@alfaguara.com',
  tipo_contrato = 'Importación', estado = 'activo'
WHERE id = 1;

UPDATE editoriales SET
  codigo = 'ED-PLAN', nombre = 'Planeta', pais = 'España',
  contacto = 'Carlos Ruiz', email = 'contacto@planeta.com',
  tipo_contrato = 'Distribución', estado = 'activo'
WHERE id = 2;

INSERT INTO editoriales (id, codigo, nombre, pais, contacto, email, tipo_contrato, estado) VALUES
(3,  'ED-PRH',  'Penguin Random House', 'USA',              'John Smith',       'sales@prh.com',              'Importación',  'activo'),
(4,  'ED-PAN',  'Panini',               'Italia',           'Marco Rossi',      'latam@panini.com',           'Distribución', 'activo'),
(5,  'ED-IVR',  'Ivrea',                'Argentina',        'Ana Belén Ruiz',   'export@ivrea.com.ar',        'Importación',  'activo'),
(6,  'ED-NOR',  'Norma',                'Colombia',         'Patricia Gómez',   'comercial@norma.com',        'Distribución', 'activo'),
(7,  'ED-SANT', 'Santillana',           'España',           'Laura Pérez',      'ventas@santillana.com',      'Distribución', 'activo'),
(8,  'ED-ANY',  'Anaya',                'España',           'Jorge Medina',     'ventas@anaya.es',            'Distribución', 'activo'),
(9,  'ED-OCE',  'Océano',               'México',           'Lucía Fernández',  'export@oceano.com.mx',       'Importación',  'activo'),
(10, 'ED-HC',   'HarperCollins',        'USA',              'Sarah Johnson',    'intl@harpercollins.com',     'Importación',  'activo'),
(11, 'ED-SM',   'SM',                   'España',           'Marta Gil',        'export@grupo-sm.com',        'Distribución', 'activo'),
(12, 'ED-SUS',  'Susaeta',              'España',           'Pablo Ortega',     'ventas@susaeta.com',         'Distribución', 'activo'),
(13, 'ED-HID',  'Hidra',                'España',           'Irene Salas',      'contacto@editorialhidra.com','Importación',  'activo'),
(14, 'ED-PLU',  'Plutón',               'España',           'Diego Vargas',     'info@plutonediciones.com',   'Importación',  'activo'),
(15, 'ED-URA',  'Urano',                'España',           'Carmen Vidal',     'export@urano.es',            'Importación',  'activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), pais = VALUES(pais), contacto = VALUES(contacto),
  email = VALUES(email), tipo_contrato = VALUES(tipo_contrato), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Proveedores RD e internacionales (reales)
-- ---------------------------------------------------------------------------
UPDATE proveedores SET
  codigo = 'PROV-CORR', nombre = 'Distribuidora Corripio',
  contacto = 'Pedro Díaz', email = 'compras@corripio.com.do', telefono = '809-565-3111',
  pais = 'República Dominicana', tipo = 'nacional', estado = 'activo'
WHERE id = 1;

UPDATE proveedores SET
  codigo = 'PROV-PLAN', nombre = 'Editorial Planeta',
  contacto = 'Carlos Ruiz', email = 'export@planeta.es', telefono = '+34-93-492-8000',
  pais = 'España', tipo = 'internacional', estado = 'activo'
WHERE id = 2;

INSERT INTO proveedores (id, codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES
(3,  'PROV-SANT', 'Santillana Dominicana',              'Laura Méndez',     'pedidos@santillana.com.do',     '809-565-2200', 'República Dominicana', 'nacional',      'activo'),
(4,  'PROV-PANA', 'Panamericana Editorial',             'Andrés Quintero',  'ventas@panamericana.com.co',    '+57-1-410-0909','Colombia',              'internacional', 'activo'),
(5,  'PROV-PRH',  'Penguin Random House Grupo Editorial','John Smith',      'latam@penguinrandomhouse.com',  '+1-212-782-9000','USA',                 'internacional', 'activo'),
(6,  'PROV-NOR',  'Editorial Norma',                    'Patricia Gómez',   'rd@norma.com',                  '809-547-8800', 'Colombia',              'mixto',         'activo'),
(7,  'PROV-IVR',  'Ivrea Argentina',                    'Ana Belén Ruiz',   'export@ivrea.com.ar',           '+54-11-4555-2200','Argentina',           'internacional', 'activo'),
(8,  'PROV-PAN',  'Panini México',                      'Marco Rossi',      'mayoristas@panini.com.mx',      '+52-55-5284-0500','México',              'internacional', 'activo'),
(9,  'PROV-OCE',  'Océano Dominicana',                  'Rosa Fernández',   'ventas@oceano.com.do',          '809-338-4411', 'República Dominicana', 'nacional',      'activo'),
(10, 'PROV-SM',   'SM Dominicana',                      'Marta Gil',        'comercial@sm.com.do',           '809-412-7700', 'República Dominicana', 'nacional',      'activo'),
(11, 'PROV-HC',   'HarperCollins Latam',                'Sarah Johnson',    'ventas.latam@harpercollins.com','+1-212-207-7000','USA',                 'internacional', 'activo'),
(12, 'PROV-URA',  'Urano Ediciones',                    'Carmen Vidal',     'export@urano.es',               '+34-93-241-7500','España',              'internacional', 'activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), contacto = VALUES(contacto), email = VALUES(email),
  telefono = VALUES(telefono), pais = VALUES(pais), tipo = VALUES(tipo), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Productos: libros y mangas reales (ISBN reales cuando aplica)
-- costo/precio en DOP salvo notas en órdenes internacionales (EUR/USD)
-- ---------------------------------------------------------------------------
UPDATE productos SET
  isbn = '9780307474728', titulo = 'Cien años de soledad', autor = 'Gabriel García Márquez',
  categoria_id = 1, editorial_id = 2, costo = 485.00, precio = 895.00, estado = 'activo'
WHERE id = 1;

UPDATE productos SET
  isbn = '9788408163589', titulo = 'La sombra del viento', autor = 'Carlos Ruiz Zafón',
  categoria_id = 1, editorial_id = 2, costo = 420.00, precio = 780.00, estado = 'activo'
WHERE id = 2;

INSERT INTO productos (id, codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado) VALUES
(3,  'PRD-003', '9788491050675', 'Don Quijote de la Mancha',              'Miguel de Cervantes',           1, 7,  520.00,  950.00, 'activo'),
(4,  'PRD-004', '9788497598208', 'El Principito',                         'Antoine de Saint-Exupéry',      2, 2,  280.00,  550.00, 'activo'),
(5,  'PRD-005', '9788417672409', 'Hábitos Atómicos',                      'James Clear',                   5, 15, 610.00, 1150.00, 'activo'),
(6,  'PRD-006', '9786071102621', 'Padre Rico Padre Pobre',                'Robert T. Kiyosaki',            5, 9,  540.00,  990.00, 'activo'),
(7,  'PRD-007', '9780132350884', 'Clean Code',                            'Robert C. Martin',              6, 10, 980.00, 1850.00, 'activo'),
(8,  'PRD-008', '9788498384453', 'Harry Potter y la piedra filosofal',    'J.K. Rowling',                  2, 3,  450.00,  850.00, 'activo'),
(9,  'PRD-009', '9788411610230', 'One Piece Vol. 1',                      'Eiichiro Oda',                  4, 4,  220.00,  425.00, 'activo'),
(10, 'PRD-010', '9788416051724', 'Naruto Vol. 1',                         'Masashi Kishimoto',             4, 4,  220.00,  425.00, 'activo'),
(11, 'PRD-011', '9781974710027', 'Jujutsu Kaisen Vol. 1',                 'Gege Akutami',                  4, 4,  240.00,  450.00, 'activo'),
(12, 'PRD-012', '9781974709939', 'Chainsaw Man Vol. 1',                   'Tatsuki Fujimoto',              4, 4,  240.00,  450.00, 'activo'),
(13, 'PRD-013', '9781974715466', 'Spy x Family Vol. 1',                   'Tatsuya Endo',                  4, 4,  230.00,  440.00, 'activo'),
(14, 'PRD-014', '9781974722860', 'Blue Lock Vol. 1',                      'Muneyuki Kaneshiro',            4, 8,  235.00,  445.00, 'activo'),
(15, 'PRD-015', '9781506711980', 'Berserk Vol. 1',                        'Kentaro Miura',                 4, 5,  380.00,  720.00, 'activo'),
(16, 'PRD-016', '9780451524935', '1984',                                  'George Orwell',                 1, 3,  310.00,  595.00, 'activo'),
(17, 'PRD-017', '9788437604572', 'Rayuela',                               'Julio Cortázar',                1, 1,  390.00,  720.00, 'activo'),
(18, 'PRD-018', '9789584202952', 'El amor en los tiempos del cólera',     'Gabriel García Márquez',        1, 6,  410.00,  760.00, 'activo'),
(19, 'PRD-019', '9788466331917', 'El código Da Vinci',                    'Dan Brown',                     1, 2,  360.00,  690.00, 'activo'),
(20, 'PRD-020', '9780062316097', 'Sapiens',                               'Yuval Noah Harari',             3, 10, 680.00, 1290.00, 'activo'),
(21, 'PRD-021', '9788413141053', 'El infinito en un junco',               'Irene Vallejo',                 1, 11, 520.00,  980.00, 'activo'),
(22, 'PRD-022', '9788413142340', 'La ciudad y sus muros inciertos',       'Haruki Murakami',               1, 3,  560.00, 1050.00, 'activo')
ON DUPLICATE KEY UPDATE
  isbn = VALUES(isbn), titulo = VALUES(titulo), autor = VALUES(autor),
  categoria_id = VALUES(categoria_id), editorial_id = VALUES(editorial_id),
  costo = VALUES(costo), precio = VALUES(precio), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Condiciones de pago reales
-- ---------------------------------------------------------------------------
INSERT INTO condiciones_pago (id, codigo, nombre, dias_credito, estado, activo, created_by, updated_by) VALUES
(1, 'CONTADO', 'Contado',            0, 'activo', 1, 2, 2),
(2, 'CRED15',  'Crédito 15 días',   15, 'activo', 1, 2, 2),
(3, 'CRED30',  'Crédito 30 días',   30, 'activo', 1, 2, 2),
(4, 'CRED45',  'Crédito 45 días',   45, 'activo', 1, 2, 2),
(5, 'CRED60',  'Crédito 60 días',   60, 'activo', 1, 2, 2),
(6, 'ANT50',   'Anticipo 50%',       0, 'activo', 1, 2, 2)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), dias_credito = VALUES(dias_credito),
  estado = VALUES(estado), activo = VALUES(activo);

-- ---------------------------------------------------------------------------
-- Numeración documentos 2026
-- ---------------------------------------------------------------------------
INSERT INTO numeracion_documentos (id, tipo_documento, anio, ultimo_numero) VALUES
(1, 'OC',  2026, 8),
(2, 'REC', 2026, 4),
(3, 'FP',  2026, 4)
ON DUPLICATE KEY UPDATE ultimo_numero = GREATEST(ultimo_numero, VALUES(ultimo_numero));

-- =============================================================================
-- ÓRDENES DE COMPRA (múltiples estados)
-- =============================================================================

-- OC-2026-000001 — recibida (Corripio / clásicos mostrador)
-- Subtotal 58,500 | ITBIS 10,530 | Total 69,030 DOP
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  1, 'OC-2026-000001', 1, 1, 1, 1.000000,
  3, 'nacional', '2026-06-10', '2026-06-20',
  58500.00, 0.00, 10530.00, 69030.00, 'recibida', 1,
  'Reposición clásicos de mostrador — Librería Joselito Zona Colonial',
  '2026-06-11 09:30:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(1, 1, 1, 16, 100, 310.0000, 0.00, 5580.00, 31000.00, 1, 2, 2),
(2, 1, 2,  4,  50, 280.0000, 0.00, 2520.00, 14000.00, 1, 2, 2),
(3, 1, 3,  1,  30, 450.0000, 0.00, 2430.00, 13500.00, 1, 2, 2);

-- REC-2026-000001 — recepción completa confirmada
INSERT INTO recepcion (
  id, codigo, orden_compra_id, almacen_id, fecha_recepcion,
  usuario_receptor, usuario_inspector, resultado_inspeccion,
  observaciones, estado, activo, fecha_confirmacion, created_by, updated_by
) VALUES (
  1, 'REC-2026-000001', 1, 1, '2026-06-15',
  2, 1, 'aceptada',
  'Mercancía conforme — bodega central Av. Winston Churchill',
  'confirmada', 1, '2026-06-15 14:00:00', 2, 2
);

INSERT INTO detalle_recepcion (
  id, recepcion_id, detalle_orden_compra_id, producto_id,
  cantidad_recibida, costo_unitario, activo, created_by, updated_by
) VALUES
(1, 1, 1, 16, 100, 310.0000, 1, 2, 2),
(2, 1, 2,  4,  50, 280.0000, 1, 2, 2),
(3, 1, 3,  1,  30, 450.0000, 1, 2, 2);

-- FP-2026-000001 — factura pagada
INSERT INTO factura_proveedor (
  id, codigo, orden_compra_id, proveedor_id, numero_factura, ncf,
  moneda_id, tasa_cambio, condicion_pago_id,
  fecha_emision, fecha_recepcion_documento, fecha_vencimiento,
  subtotal, descuento, impuestos, total,
  estado, estado_pago, activo, observaciones, created_by, updated_by
) VALUES (
  1, 'FP-2026-000001', 1, 1, 'FAC-CORR-4587', 'B0100004587',
  1, 1.000000, 3,
  '2026-06-12', '2026-06-13', '2026-07-12',
  58500.00, 0.00, 10530.00, 69030.00,
  'registrada', 'pagada', 1,
  'Factura crédito 30 días — pagada el 2026-07-05', 2, 2
);

INSERT INTO detalle_factura_proveedor (
  id, factura_proveedor_id, linea, producto_id, detalle_orden_compra_id,
  cantidad, costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(1, 1, 1, 16, 1, 100, 310.0000, 0.00, 5580.00, 31000.00, 1, 2, 2),
(2, 1, 2,  4, 2,  50, 280.0000, 0.00, 2520.00, 14000.00, 1, 2, 2),
(3, 1, 3,  1, 3,  30, 450.0000, 0.00, 2430.00, 13500.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000002 — borrador (SM Dominicana / útiles escolares)
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, created_by, updated_by
) VALUES (
  2, 'OC-2026-000002', 10, 1, 1, 1.000000,
  1, 'nacional', '2026-07-10',
  5200.00, 0.00, 0.00, 5200.00, 'borrador', 1,
  'Borrador — textos escolares temporada regreso a clases (pendiente completar líneas)', 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(4, 2, 1, 3, 10, 520.0000, 0.00, 0.00, 5200.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000003 — pendiente_aprobacion (Santillana / Harry Potter + Rayuela)
-- Subtotal 67,200 | ITBIS 12,096 | Total 79,296 DOP
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, created_by, updated_by
) VALUES (
  3, 'OC-2026-000003', 3, 2, 1, 1.000000,
  4, 'nacional', '2026-07-15', '2026-08-01',
  67200.00, 0.00, 12096.00, 79296.00, 'pendiente_aprobacion', 1,
  'Pedido Santillana Dominicana — ampliación infantil y clásicos latinoamericanos', 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(5, 3, 1, 8, 80, 450.0000, 0.00, 6480.00, 36000.00, 1, 2, 2),
(6, 3, 2, 17, 80, 390.0000, 0.00, 5616.00, 31200.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-INT-2026-000004 — internacional aprobada (Editorial Planeta, EUR)
-- Subtotal 2,720.00 EUR @ tasa 63.20 — sin recepción nacional (Importaciones)
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  4, 'OC-INT-2026-000004', 2, 1, 3, 63.200000,
  5, 'internacional', '2026-07-01', '2026-08-15',
  2720.00, 0.00, 0.00, 2720.00, 'aprobada', 1,
  'Importación Editorial Planeta — novedades Q3 vía Barcelona',
  '2026-07-02 11:00:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(7, 4, 1, 1, 200, 8.5000, 0.00, 0.00, 1700.00, 1, 2, 2),
(8, 4, 2, 2, 150, 6.8000, 0.00, 0.00, 1020.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000005 — parcialmente_recibida (Panini México / manga)
-- Subtotal 46,000 | ITBIS 8,280 | Total 54,280 DOP
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  5, 'OC-2026-000005', 8, 1, 1, 1.000000,
  2, 'nacional', '2026-06-20', '2026-07-05',
  46000.00, 0.00, 8280.00, 54280.00, 'parcialmente_recibida', 1,
  'Pedido manga Panini — One Piece, Naruto, Jujutsu Kaisen, Chainsaw Man',
  '2026-06-21 10:00:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(9,  5, 1,  9, 50, 220.0000, 0.00, 1980.00, 11000.00, 1, 2, 2),
(10, 5, 2, 10, 50, 220.0000, 0.00, 1980.00, 11000.00, 1, 2, 2),
(11, 5, 3, 11, 50, 240.0000, 0.00, 2160.00, 12000.00, 1, 2, 2),
(12, 5, 4, 12, 50, 240.0000, 0.00, 2160.00, 12000.00, 1, 2, 2);

-- REC-2026-000002 — recepción parcial (solo One Piece + Naruto)
INSERT INTO recepcion (
  id, codigo, orden_compra_id, almacen_id, fecha_recepcion,
  usuario_receptor, usuario_inspector, resultado_inspeccion,
  observaciones, estado, activo, fecha_confirmacion, created_by, updated_by
) VALUES (
  2, 'REC-2026-000002', 5, 1, '2026-07-02',
  2, 1, 'parcialmente_aceptada',
  'Llegaron 2 de 4 títulos; pendiente Jujutsu Kaisen y Chainsaw Man',
  'confirmada', 1, '2026-07-02 16:30:00', 2, 2
);

INSERT INTO detalle_recepcion (
  id, recepcion_id, detalle_orden_compra_id, producto_id,
  cantidad_recibida, costo_unitario, activo, created_by, updated_by
) VALUES
(4, 2, 9,  9, 50, 220.0000, 1, 2, 2),
(5, 2, 10, 10, 50, 220.0000, 1, 2, 2);

-- FP-2026-000002 — factura parcialmente pagada (anticipo 50%)
INSERT INTO factura_proveedor (
  id, codigo, orden_compra_id, proveedor_id, numero_factura, ncf,
  moneda_id, tasa_cambio, condicion_pago_id,
  fecha_emision, fecha_recepcion_documento, fecha_vencimiento,
  subtotal, descuento, impuestos, total,
  estado, estado_pago, activo, observaciones, created_by, updated_by
) VALUES (
  2, 'FP-2026-000002', 5, 8, 'FAC-PAN-8891', 'B0100008891',
  1, 1.000000, 6,
  '2026-06-22', '2026-06-23', '2026-07-07',
  46000.00, 0.00, 8280.00, 54280.00,
  'registrada', 'parcial', 1,
  'Anticipo 50% abonado; saldo pendiente contra recepción completa', 2, 2
);

INSERT INTO detalle_factura_proveedor (
  id, factura_proveedor_id, linea, producto_id, detalle_orden_compra_id,
  cantidad, costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(4, 2, 1,  9,  9, 50, 220.0000, 0.00, 1980.00, 11000.00, 1, 2, 2),
(5, 2, 2, 10, 10, 50, 220.0000, 0.00, 1980.00, 11000.00, 1, 2, 2),
(6, 2, 3, 11, 11, 50, 240.0000, 0.00, 2160.00, 12000.00, 1, 2, 2),
(7, 2, 4, 12, 12, 50, 240.0000, 0.00, 2160.00, 12000.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000006 — cancelada (Océano / autoayuda)
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  6, 'OC-2026-000006', 9, 1, 1, 1.000000,
  1, 'nacional', '2026-05-18', '2026-06-01',
  34500.00, 0.00, 6210.00, 40710.00, 'cancelada', 1,
  'Cancelada: proveedor sin stock de Hábitos Atómicos y Padre Rico',
  '2026-05-19 09:00:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(13, 6, 1, 5, 30, 610.0000, 0.00, 3294.00, 18300.00, 1, 2, 2),
(14, 6, 2, 6, 30, 540.0000, 0.00, 2916.00, 16200.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000007 — cerrada (Editorial Norma / García Márquez)
-- Recepción completa + factura pendiente
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  7, 'OC-2026-000007', 6, 1, 1, 1.000000,
  5, 'nacional', '2026-04-05', '2026-04-20',
  41000.00, 0.00, 7380.00, 48380.00, 'cerrada', 1,
  'Pedido Norma — El amor en los tiempos del cólera (cerrada tras recepción)',
  '2026-04-06 11:15:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(15, 7, 1, 18, 100, 410.0000, 0.00, 7380.00, 41000.00, 1, 2, 2);

INSERT INTO recepcion (
  id, codigo, orden_compra_id, almacen_id, fecha_recepcion,
  usuario_receptor, usuario_inspector, resultado_inspeccion,
  observaciones, estado, activo, fecha_confirmacion, created_by, updated_by
) VALUES (
  3, 'REC-2026-000003', 7, 1, '2026-04-18',
  2, 1, 'aceptada',
  'Recepción completa Norma — 100 ejemplares',
  'confirmada', 1, '2026-04-18 11:00:00', 2, 2
);

INSERT INTO detalle_recepcion (
  id, recepcion_id, detalle_orden_compra_id, producto_id,
  cantidad_recibida, costo_unitario, activo, created_by, updated_by
) VALUES
(6, 3, 15, 18, 100, 410.0000, 1, 2, 2);

INSERT INTO factura_proveedor (
  id, codigo, orden_compra_id, proveedor_id, numero_factura, ncf,
  moneda_id, tasa_cambio, condicion_pago_id,
  fecha_emision, fecha_recepcion_documento, fecha_vencimiento,
  subtotal, descuento, impuestos, total,
  estado, estado_pago, activo, observaciones, created_by, updated_by
) VALUES (
  3, 'FP-2026-000003', 7, 6, 'FAC-NOR-2201', 'B0100002201',
  1, 1.000000, 5,
  '2026-04-10', '2026-04-12', '2026-06-09',
  41000.00, 0.00, 7380.00, 48380.00,
  'registrada', 'pendiente', 1,
  'Crédito 60 días — pendiente de pago tesorería', 2, 2
);

INSERT INTO detalle_factura_proveedor (
  id, factura_proveedor_id, linea, producto_id, detalle_orden_compra_id,
  cantidad, costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(8, 3, 1, 18, 15, 100, 410.0000, 0.00, 7380.00, 41000.00, 1, 2, 2);

-- ---------------------------------------------------------------------------
-- OC-2026-000008 — aprobada nacional (Ivrea / Berserk + Spy x Family)
-- Con recepción en borrador (pendiente confirmar)
-- ---------------------------------------------------------------------------
INSERT INTO orden_compra (
  id, codigo, proveedor_id, sucursal_id, moneda_id, tasa_cambio,
  condicion_pago_id, tipo_compra, fecha_orden, fecha_entrega_estimada,
  subtotal, descuento, impuestos, total, estado, activo,
  observaciones, fecha_aprobacion, aprobado_por, created_by, updated_by
) VALUES (
  8, 'OC-2026-000008', 7, 1, 1, 1.000000,
  3, 'nacional', '2026-07-12', '2026-07-28',
  30500.00, 0.00, 5490.00, 35990.00, 'aprobada', 1,
  'Ivrea Argentina — Berserk y Spy x Family para sección manga',
  '2026-07-13 08:45:00', 1, 2, 2
);

INSERT INTO detalle_orden_compra (
  id, orden_compra_id, linea, producto_id, cantidad_solicitada,
  costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(16, 8, 1, 15, 50, 380.0000, 0.00, 3420.00, 19000.00, 1, 2, 2),
(17, 8, 2, 13, 50, 230.0000, 0.00, 2070.00, 11500.00, 1, 2, 2);

INSERT INTO recepcion (
  id, codigo, orden_compra_id, almacen_id, fecha_recepcion,
  usuario_receptor, usuario_inspector, resultado_inspeccion,
  observaciones, estado, activo, created_by, updated_by
) VALUES (
  4, 'REC-2026-000004', 8, 1, '2026-07-18',
  2, NULL, NULL,
  'Borrador de recepción — pendiente conteo físico',
  'borrador', 1, 2, 2
);

INSERT INTO detalle_recepcion (
  id, recepcion_id, detalle_orden_compra_id, producto_id,
  cantidad_recibida, costo_unitario, activo, created_by, updated_by
) VALUES
(7, 4, 16, 15, 50, 380.0000, 1, 2, 2),
(8, 4, 17, 13, 50, 230.0000, 1, 2, 2);

-- FP pendiente sobre OC aprobada (factura adelantada PRH Clean Code / Sapiens)
-- Usamos OC-INT ya aprobada no; creamos factura solo para OC 8
INSERT INTO factura_proveedor (
  id, codigo, orden_compra_id, proveedor_id, numero_factura, ncf,
  moneda_id, tasa_cambio, condicion_pago_id,
  fecha_emision, fecha_recepcion_documento, fecha_vencimiento,
  subtotal, descuento, impuestos, total,
  estado, estado_pago, activo, observaciones, created_by, updated_by
) VALUES (
  4, 'FP-2026-000004', 8, 7, 'FAC-IVR-4410', 'B0100004410',
  1, 1.000000, 3,
  '2026-07-14', '2026-07-15', '2026-08-13',
  30500.00, 0.00, 5490.00, 35990.00,
  'registrada', 'pendiente', 1,
  'Factura Ivrea — crédito 30 días, pendiente de abono', 2, 2
);

INSERT INTO detalle_factura_proveedor (
  id, factura_proveedor_id, linea, producto_id, detalle_orden_compra_id,
  cantidad, costo_unitario, descuento, impuesto, subtotal, activo, created_by, updated_by
) VALUES
(9,  4, 1, 15, 16, 50, 380.0000, 0.00, 3420.00, 19000.00, 1, 2, 2),
(10, 4, 2, 13, 17, 50, 230.0000, 0.00, 2070.00, 11500.00, 1, 2, 2);

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '11_seed_joselito.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 11_seed_joselito.sql (FASE 10) aplicado.' AS resultado;
