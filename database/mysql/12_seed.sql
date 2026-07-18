-- =============================================================================
-- LibroSys — Datos de prueba (seed)
-- Archivo: 12_seed.sql
-- Descripción: Datos mínimos relacionados para pruebas funcionales
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- SEGURIDAD
-- =============================================================================

INSERT INTO roles (id, codigo, nombre, descripcion, estado) VALUES
(1, 'ADMIN',      'Administrador',     'Acceso total al sistema',           'activo'),
(2, 'COMPRAS',    'Compras',           'Gestión de órdenes y recepciones',  'activo'),
(3, 'IMPORT',     'Importaciones',     'Gestión de importaciones',          'activo');

INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(1,  'compras.ver',           'Ver compras',              'compras',        'Consultar órdenes de compra'),
(2,  'compras.crear',         'Crear compras',            'compras',        'Registrar órdenes de compra'),
(3,  'inventario.ver',        'Ver inventario',           'inventario',     'Consultar stock'),
(4,  'inventario.ajustar',    'Ajustar inventario',       'inventario',     'Registrar ajustes'),
(5,  'importaciones.ver',     'Ver importaciones',        'importaciones',  'Consultar embarques'),
(6,  'importaciones.gestionar','Gestionar importaciones', 'importaciones',  'Registrar embarques y costos'),
(7,  'ventas.crear',          'Registrar ventas',         'ventas',         'Crear ventas'),
(8,  'eventos.gestionar',     'Gestionar eventos',        'eventos',        'Administrar eventos'),
(9,  'auditoria.ver',         'Ver auditoría',            'auditoria',      'Consultar registros de auditoría');

INSERT INTO rol_permiso (rol_id, permiso_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),
(2,1),(2,2),(2,3),
(3,5),(3,6),(3,3);

-- password: LibroSys2026! (hash bcrypt de ejemplo)
INSERT INTO usuarios (id, rol_id, codigo, nombre, apellido, email, password_hash, telefono, estado) VALUES
(1, 1, 'USR-001', 'Ana',   'García',    'ana.garcia@librosys.com',    '$2y$10$LibroSysSeedHashAdmin000000000000000001', '809-555-0101', 'activo'),
(2, 2, 'USR-002', 'Luis',  'Martínez',  'luis.martinez@librosys.com', '$2y$10$LibroSysSeedHashCompras00000000000000002', '809-555-0102', 'activo'),
(3, 3, 'USR-003', 'María', 'Rodríguez', 'maria.rodriguez@librosys.com','$2y$10$LibroSysSeedHashImport00000000000000003', '809-555-0103', 'activo');

-- =============================================================================
-- ADMINISTRACIÓN
-- =============================================================================

INSERT INTO categorias (id, codigo, nombre, descripcion, estado) VALUES
(1, 'CAT-FIC',  'Ficción',        'Novelas y narrativa',              'activo'),
(2, 'CAT-INF',  'Infantil',       'Literatura infantil y juvenil',    'activo'),
(3, 'CAT-ACA',  'Académico',      'Textos académicos y técnicos',     'activo'),
(4, 'CAT-COM',  'Comics',         'Cómics y novelas gráficas',        'activo');

INSERT INTO editoriales (id, codigo, nombre, pais, contacto, email, tipo_contrato, estado) VALUES
(1, 'ED-PLAN',  'Planeta',              'España',    'Carlos Ruiz',    'contacto@planeta.com',    'Distribución', 'activo'),
(2, 'ED-SANT',  'Santillana',           'España',    'Laura Pérez',    'ventas@santillana.com',   'Distribución', 'activo'),
(3, 'ED-PRH',   'Penguin Random House', 'USA',       'John Smith',     'sales@prh.com',           'Importación',  'activo'),
(4, 'ED-ALF',   'Alfaguara',            'España',    'Elena Torres',   'export@alfaguara.com',    'Importación',  'activo');

INSERT INTO proveedores (id, codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES
(1, 'PROV-001', 'Distribuidora Nacional RD',  'Pedro Díaz',    'pedro@distnacional.com',   '809-555-1001', 'República Dominicana', 'nacional',       'activo'),
(2, 'PROV-002', 'Planeta Internacional',      'Carlos Ruiz',   'intl@planeta.com',         '+34-555-2001', 'España',               'internacional',  'activo'),
(3, 'PROV-003', 'Alfaguara Export',           'Elena Torres',  'export@alfaguara.com',     '+34-555-2002', 'España',               'internacional',  'activo'),
(4, 'PROV-004', 'Penguin Random House',       'John Smith',    'intl@prh.com',             '+1-555-2003',  'USA',                  'internacional',  'activo'),
(5, 'PROV-005', 'Editorial Caribe',           'Rosa Méndez',   'compras@caribe.com',       '809-555-1005', 'República Dominicana', 'nacional',       'activo');

INSERT INTO sucursales (id, codigo, nombre, ciudad, direccion, telefono, estado) VALUES
(1, 'SUC-CTR', 'Sucursal Central',    'Santo Domingo', 'Av. Winston Churchill 123', '809-555-3001', 'activa'),
(2, 'SUC-STI', 'Sucursal Santiago',     'Santiago',      'Calle del Sol 45',          '809-555-3002', 'activa'),
(3, 'SUC-LRM', 'Sucursal La Romana',    'La Romana',     'Calle Principal 8',         '809-555-3003', 'activa');

INSERT INTO almacenes (id, sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES
(1, 1, 'ALM-CTR', 'Almacén Central',         'central',  50000, 'activo'),
(2, 2, 'ALM-STI', 'Almacén Santiago',        'sucursal', 15000, 'activo'),
(3, 3, 'ALM-LRM', 'Almacén La Romana',       'sucursal', 10000, 'activo'),
(4, NULL, 'ALM-TRN', 'Almacén en Tránsito',  'transito',  8000, 'activo');

INSERT INTO monedas (id, codigo, nombre, simbolo, es_principal, estado) VALUES
(1, 'DOP', 'Peso Dominicano', 'RD$', 1, 'activa'),
(2, 'USD', 'Dólar Estadounidense', '$', 0, 'activa'),
(3, 'EUR', 'Euro', '€', 0, 'activa');

INSERT INTO tasas_cambio (id, moneda_origen_id, moneda_destino_id, tasa, vigente_desde, actualizado_por_id) VALUES
(1, 2, 1, 58.500000, '2026-01-01 00:00:00', 1),
(2, 3, 1, 63.200000, '2026-01-01 00:00:00', 1),
(3, 3, 2, 1.080000,  '2026-01-01 00:00:00', 1);

-- =============================================================================
-- PRODUCTOS E INVENTARIO
-- =============================================================================

INSERT INTO productos (id, codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado) VALUES
(1,  'PRD-001', '978-0307474728', 'Cien años de soledad',           'Gabriel García Márquez', 1, 1,  8.50,  18.99, 'activo'),
(2,  'PRD-002', '978-8497592432', 'La sombra del viento',           'Carlos Ruiz Zafón',      1, 1,  6.80,  15.50, 'activo'),
(3,  'PRD-003', '978-8498384453', 'Harry Potter y la piedra filosofal','J.K. Rowling',        2, 4,  9.20,  19.99, 'activo'),
(4,  'PRD-004', '978-0451524935', '1984',                           'George Orwell',          1, 3,  4.50,  12.00, 'activo'),
(5,  'PRD-005', '978-9584202952', 'El amor en los tiempos del cólera','Gabriel García Márquez',1, 1,  7.90,  16.50, 'activo'),
(6,  'PRD-006', '978-6073137125', 'Rayuela',                        'Julio Cortázar',         1, 2,  8.10,  17.25, 'activo'),
(7,  'PRD-007', '978-8466331917', 'El código Da Vinci',             'Dan Brown',              1, 1,  6.50,  14.99, 'activo'),
(8,  'PRD-008', '978-8491050675', 'Don Quijote de la Mancha',       'Miguel de Cervantes',    3, 2, 10.00,  22.00, 'activo'),
(9,  'PRD-009', '978-8497598208', 'El principito',                  'Antoine de Saint-Exupéry',2,1, 5.20,  11.50, 'activo'),
(10, 'PRD-010', '978-6075273777', 'Sapiens',                        'Yuval Noah Harari',      3, 3, 12.00,  24.99, 'activo');

INSERT INTO inventario (id, producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock) VALUES
(1,  1, 1, 120, 20, 'Pasillo A - Estante 1', 'normal'),
(2,  2, 1,  85, 15, 'Pasillo A - Estante 2', 'normal'),
(3,  3, 1,  45, 10, 'Pasillo B - Estante 1', 'normal'),
(4,  4, 1, 200, 25, 'Pasillo A - Estante 3', 'normal'),
(5,  5, 1,  30, 10, 'Pasillo C - Estante 1', 'normal'),
(6,  6, 2,  60, 10, 'Zona A - Rack 1',       'normal'),
(7,  7, 2,  15, 10, 'Zona A - Rack 2',       'bajo'),
(8,  8, 1,  40,  8, 'Pasillo D - Estante 1', 'normal'),
(9,  9, 3,  25,  5, 'Estante Infantil 1',    'normal'),
(10, 10, 1,  55, 10, 'Pasillo E - Estante 1','normal');

-- =============================================================================
-- COMPRAS
-- =============================================================================

-- OC Nacional
INSERT INTO orden_compra (id, codigo, proveedor_id, moneda_id, usuario_id, tipo_compra, fecha_orden, subtotal, impuestos, total, cantidad_items, estado) VALUES
(1, 'OC-2026-001', 1, 1, 2, 'nacional',       '2026-05-10', 1850.00, 333.00, 2183.00, 150, 'recibida'),
(2, 'OC-INT-2026-091', 2, 3, 2, 'internacional','2026-05-20', 45200.00, 0.00, 45200.00, 840, 'aprobada'),
(3, 'OC-INT-2026-090', 3, 3, 2, 'internacional','2026-06-05', 12800.00, 0.00, 12800.00, 240, 'aprobada');

INSERT INTO detalle_orden_compra (id, orden_compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES
(1, 1, 4, 100, 4.50, 450.00),
(2, 1, 9,  50, 5.20, 260.00),
(3, 2, 1, 200, 8.50, 1700.00),
(4, 2, 2, 300, 6.80, 2040.00),
(5, 2, 4, 340, 4.50, 1530.00),
(6, 3, 3, 240, 53.33, 12800.00);

INSERT INTO factura_proveedor (id, codigo, orden_compra_id, proveedor_id, moneda_id, numero_factura, fecha_factura, monto, estado_pago) VALUES
(1, 'FP-2026-001', 1, 1, 1, 'FAC-DN-4587', '2026-05-12', 2183.00, 'pagada');

INSERT INTO recepcion (id, codigo, orden_compra_id, proveedor_id, usuario_id, tipo_compra, fecha_recepcion, estado, total_items_esperados, total_items_recibidos) VALUES
(1, 'REC-2026-001', 1, 1, 2, 'nacional', '2026-05-15', 'completa', 150, 150);

INSERT INTO detalle_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, costo_unitario) VALUES
(1, 1, 4, 100, 100, 4.50),
(2, 1, 9,  50,  50,  5.20);

-- =============================================================================
-- IMPORTACIONES
-- =============================================================================

INSERT INTO factura_internacional (id, codigo, orden_compra_id, proveedor_id, moneda_id, fecha_factura, monto, estado_pago, etapa_importacion) VALUES
(1, 'FI-2026-045', 2, 2, 3, '2026-05-25', 45200.00, 'pendiente', 'costos_flete'),
(2, 'FI-2026-044', 3, 3, 3, '2026-06-08', 12800.00, 'pagada',    'costeo_libro');

INSERT INTO consolidacion (id, codigo, nombre, estado, total_cajas, observaciones, fecha_creacion) VALUES
(1, 'CON-2026-008', 'Consolidación España Q2 2026', 'activa', 84, 'Consolidación marítima desde España', '2026-05-28'),
(2, 'CON-2026-007', 'Consolidación Alfaguara Junio', 'cerrada', 12, 'Embarque aéreo cerrado',            '2026-06-10');

INSERT INTO embarque (id, codigo, factura_internacional_id, orden_compra_id, proveedor_id, consolidacion_id, tipo_transporte, origen, destino, fecha_salida, fecha_llegada_estimada, cantidad_cajas, estado, observaciones) VALUES
(1, 'EMB-012', 1, 2, 2, 1, 'maritimo', 'Barcelona, ES', 'Santo Domingo, RD', '2026-05-28', '2026-06-25', 84, 'costeado', 'Contenedor refrigerado — prioridad alta'),
(2, 'EMB-011', 2, 3, 3, 2, 'aereo',    'Madrid, ES',    'Santo Domingo, RD', '2026-06-10', '2026-06-12', 12, 'recibido', 'Envío urgente de novedades editoriales');

INSERT INTO consolidacion_embarque (consolidacion_id, embarque_id) VALUES
(1, 1),
(2, 2);

INSERT INTO costos_embarque (id, embarque_id, moneda_id, flete_internacional, seguro, aduana, transporte_local, gastos_portuarios, manipulacion, otros) VALUES
(1, 1, 1, 12400.00, 2100.00, 8900.00, 800.00, 450.00, 250.00, 0.00),
(2, 2, 1,  3200.00,  450.00, 1800.00, 120.00,  50.00,  30.00, 0.00);

INSERT INTO costeo_libro (id, embarque_id, producto_id, orden_compra_id, detalle_orden_id, costo_producto, flete_asignado) VALUES
(1, 1, 1, 2, 3, 8.5000, 1.2000),
(2, 1, 2, 2, 4, 6.8000, 0.9500),
(3, 1, 4, 2, 5, 4.5000, 0.6500),
(4, 2, 3, 3, 6, 9.2000, 1.3500);

INSERT INTO pallet (id, codigo, embarque_id, cantidad_cajas, peso_kg, ubicacion) VALUES
(1, 'PAL-012-A', 1, 42, 680.00, 'Puerto SD — Muelle 3'),
(2, 'PAL-012-B', 1, 42, 695.00, 'Puerto SD — Muelle 3'),
(3, 'PAL-011-A', 2, 12, 216.00, 'Almacén Central — Zona A');

INSERT INTO caja (id, codigo, pallet_id, embarque_id, peso_kg, ubicacion) VALUES
(1, 'CAJ-012-01', 1, 1, 16.20, 'Puerto SD — Muelle 3'),
(2, 'CAJ-012-02', 1, 1, 16.50, 'Puerto SD — Muelle 3'),
(3, 'CAJ-011-01', 3, 2, 18.00, 'Almacén Central — Zona A');

-- Recepción internacional pendiente (embarque finalizado)
INSERT INTO recepcion (id, codigo, orden_compra_id, factura_internacional_id, embarque_id, proveedor_id, usuario_id, tipo_compra, fecha_recepcion, estado, total_items_esperados, total_items_recibidos) VALUES
(2, 'REC-INT-2026-001', 3, 2, 2, 3, 3, 'internacional', '2026-06-13', 'pendiente', 240, 0);

INSERT INTO detalle_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, costo_unitario) VALUES
(3, 2, 3, 240, 0, 53.33);

-- =============================================================================
-- VENTAS
-- =============================================================================

INSERT INTO venta (id, codigo, sucursal_id, almacen_id, usuario_id, moneda_id, cliente_nombre, fecha_venta, subtotal, descuento, impuestos, total, estado) VALUES
(1, 'VTA-2026-001', 1, 1, 1, 1, 'Cliente General',     '2026-06-01 10:30:00',  37.98, 0.00,  6.84,  44.82, 'confirmada'),
(2, 'VTA-2026-002', 1, 1, 1, 1, 'Juan Pérez',          '2026-06-02 14:15:00',  31.00, 0.00,  5.58,  36.58, 'confirmada'),
(3, 'VTA-2026-003', 2, 2, 1, 1, 'María López',         '2026-06-03 11:00:00',  14.99, 0.00,  2.70,  17.69, 'confirmada'),
(4, 'VTA-2026-004', 1, 1, 1, 1, 'Colegio San José',    '2026-06-04 09:45:00',  59.97, 5.00,  9.89,  64.86, 'confirmada'),
(5, 'VTA-2026-005', 3, 3, 1, 1, 'Cliente General',     '2026-06-05 16:20:00',  11.50, 0.00,  2.07,  13.57, 'confirmada');

INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, descuento_linea, subtotal) VALUES
(1, 1, 1, 1, 18.99, 0.00, 18.99),
(2, 1, 4, 1, 12.00, 0.00, 12.00),
(3, 1, 9, 1,  6.99, 0.00,  6.99),
(4, 2, 2, 2, 15.50, 0.00, 31.00),
(5, 3, 7, 1, 14.99, 0.00, 14.99),
(6, 4, 3, 3, 19.99, 5.00, 59.97),
(7, 5, 9, 1, 11.50, 0.00, 11.50);

-- =============================================================================
-- TRANSFERENCIAS
-- =============================================================================

INSERT INTO transferencia (id, codigo, almacen_origen_id, almacen_destino_id, usuario_solicita_id, usuario_aprueba_id, fecha_solicitud, fecha_envio, estado, transporte) VALUES
(1, 'TRF-2026-001', 1, 2, 2, 1, '2026-06-08 08:00:00', '2026-06-08 14:00:00', 'en_transito', 'Camión refrigerado');

INSERT INTO detalle_transferencia (id, transferencia_id, producto_id, cantidad_solicitada, cantidad_enviada, cantidad_recibida) VALUES
(1, 1, 6, 20, 20, 0),
(2, 1, 7, 10, 10, 0);

-- =============================================================================
-- EVENTOS
-- =============================================================================

INSERT INTO eventos (id, codigo, nombre, tipo, fecha_inicio, fecha_fin, ubicacion, editorial_id, responsable_id, estado, participantes_estimados, reservas) VALUES
(1, 'EVT-2026-001', 'Feria del Libro SD 2026',     'Feria',        '2026-07-15', '2026-07-20', 'Plaza de la Cultura, Santo Domingo', 1, 1, 'programado',          5000, 1200),
(2, 'EVT-2026-002', 'Presentación Harry Potter',   'Presentación', '2026-06-25', '2026-06-25', 'Sucursal Central',                   4, 3, 'personal_asignado',    150,   85);

INSERT INTO asignacion_evento (id, evento_id, usuario_id, rol_evento, horas_asignadas, estado) VALUES
(1, 2, 1, 'Coordinador', 8.00, 'confirmado'),
(2, 2, 3, 'Logística',   6.00, 'asignado');

INSERT INTO presupuestos_evento (id, evento_id, moneda_id, concepto, monto_presupuestado, monto_utilizado) VALUES
(1, 1, 1, 'Stand y decoración',  150000.00, 45000.00),
(2, 1, 1, 'Material promocional', 35000.00, 12000.00),
(3, 2, 1, 'Merchandising',        15000.00,  8500.00);

-- =============================================================================
-- CONFIGURACIÓN
-- =============================================================================

INSERT INTO configuracion (id, clave, valor, tipo_dato, modulo, descripcion) VALUES
(1, 'empresa.nombre',           'LibroSys',              'texto',    'general',       'Nombre de la empresa'),
(2, 'inventario.stock_minimo',  '10',                    'numero',   'inventario',    'Stock mínimo por defecto'),
(3, 'ventas.itbis',             '0.18',                  'numero',   'ventas',        'Tasa ITBIS aplicable'),
(4, 'importaciones.moneda_costos','DOP',                  'texto',    'importaciones', 'Moneda para costos de flete'),
(5, 'notificaciones.email_activo','true',                 'booleano', 'configuracion', 'Habilitar correos de notificación');

INSERT INTO notificaciones (id, usuario_id, tipo, titulo, mensaje, modulo, leida) VALUES
(1, 3, 'info',    'Nuevo Embarque',        'EMB-012 registrado con costos asociados', 'importaciones', 0),
(2, 2, 'success', 'Orden Aprobada',        'OC-INT-2026-091 lista para embarque',     'compras',       1),
(3, 1, 'warning', 'Stock Bajo',            'El código Da Vinci bajo mínimo en Santiago','inventario',   0);

INSERT INTO correo_notificacion (id, notificacion_id, destinatario_email, asunto, cuerpo, estado_envio, fecha_envio) VALUES
(1, 1, 'maria.rodriguez@librosys.com', 'Nuevo Embarque EMB-012', 'Se registró el embarque EMB-012 con factura FI-2026-045.', 'enviado', '2026-05-28 09:15:00');

-- =============================================================================
-- AUDITORÍA (muestras iniciales)
-- =============================================================================

INSERT INTO auditoria (id, modulo, entidad, entidad_id, accion, usuario_id, ip_address, descripcion, fecha_evento) VALUES
(1, 'compras',       'orden_compra',        '2',         'crear',      2, '192.168.1.10', 'Orden internacional OC-INT-2026-091 creada',       '2026-05-20 09:00:00'),
(2, 'importaciones', 'embarque',            '1',         'crear',      3, '192.168.1.12', 'Embarque EMB-012 registrado',                    '2026-05-28 09:10:00'),
(3, 'ventas',        'venta',               '1',         'crear',      1, '192.168.1.5',  'Venta VTA-2026-001 confirmada',                  '2026-06-01 10:30:00');

INSERT INTO auditoria_cambio (id, auditoria_id, campo, valor_anterior, valor_nuevo) VALUES
(1, 2, 'estado', 'registrado', 'en_transito');

INSERT INTO auditoria_acceso (id, auditoria_id, usuario_id, tipo_acceso, ip_address, fecha_acceso) VALUES
(1, 1, 2, 'login', '192.168.1.10', '2026-05-20 08:55:00');

SET FOREIGN_KEY_CHECKS = 1;
