-- =============================================================================
-- LibroSys — Datos de prueba v2 (Eventos, Facturación, Editoriales, Seguridad)
-- Archivo: 21_seed_v2.sql
-- Ejecutar DESPUÉS de 17-20 (requiere tablas ampliadas)
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- EVENTOS v2 — Presupuesto resumen, personal, caja y facturación
-- =============================================================================

UPDATE eventos SET
  almacen_operativo_id = 1,
  presupuesto_asignado = 185000.00,
  total_ingresos       = 0.00,
  total_gastos         = 0.00,
  estado_presupuesto   = 'activo',
  estado               = 'en_curso'
WHERE id = 1;

UPDATE eventos SET
  almacen_operativo_id = 1,
  presupuesto_asignado = 15000.00,
  total_ingresos       = 0.00,
  total_gastos         = 0.00,
  estado_presupuesto   = 'activo'
WHERE id = 2;

INSERT INTO empleado (id, codigo, nombre, area, estado, disponible, eventos_participados) VALUES
(1, 'EMP-001', 'Carlos Mendoza',   'ventas',     'activo', 1, 12),
(2, 'EMP-002', 'Laura Fernández',  'caja',       'activo', 1,  8),
(3, 'EMP-003', 'Pedro Ramírez',    'logistica',  'activo', 0, 15),
(4, 'EMP-004', 'Sofía Herrera',    'inventario', 'activo', 1,  6);

INSERT INTO asignacion_personal_evento (id, evento_id, empleado_id, area, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, 1, 'ventas',    '2026-07-15', '2026-07-20', 'confirmado'),
(2, 1, 2, 'caja',      '2026-07-15', '2026-07-20', 'confirmado'),
(3, 1, 3, 'logistica', '2026-07-14', '2026-07-21', 'confirmado'),
(4, 2, 1, 'ventas',    '2026-06-25', '2026-06-25', 'completado'),
(5, 2, 2, 'caja',      '2026-06-25', '2026-06-25', 'completado');

INSERT INTO evento_gasto (id, evento_id, concepto, monto, fecha_gasto, moneda_id) VALUES
(1, 1, 'Alquiler stand principal', 45000.00, '2026-07-01', 1),
(2, 1, 'Transporte logístico',       12000.00, '2026-07-10', 1),
(3, 2, 'Merchandising presentación',  8500.00, '2026-06-20', 1);

INSERT INTO evento_producto_planificado (id, evento_id, producto_id, cantidad_planificada, almacen_origen_id) VALUES
(1, 1, 1, 50, 1),
(2, 1, 3, 30, 1),
(3, 1, 9, 40, 1);

INSERT INTO evento_editorial (id, evento_id, editorial_id, stand, cantidad_productos) VALUES
(1, 1, 1, 'A-12', 120),
(2, 1, 4, 'B-05',  45);

INSERT INTO evento_historial (id, evento_id, usuario_id, fecha_evento, accion, detalle) VALUES
(1, 1, 1, '2026-06-01 09:00:00', 'Evento creado',           'Feria del Libro SD 2026 registrada'),
(2, 1, 1, '2026-06-15 10:30:00', 'Presupuesto asignado',    'RD$ 185,000.00 asignados'),
(3, 1, 1, '2026-07-15 08:00:00', 'Caja abierta',            'Caja CAJ-EVT-001 abierta con RD$ 5,000.00');

INSERT INTO caja_evento (id, codigo, evento_id, almacen_id, usuario_apertura_id, fecha_apertura, monto_inicial, total_ventas, estado) VALUES
(1, 'CAJ-EVT-001', 1, 1, 1, '2026-07-15 08:00:00', 5000.00, 0.00, 'abierta');

INSERT INTO venta (id, codigo, tipo_venta, sucursal_id, almacen_id, usuario_id, moneda_id, evento_id, caja_evento_id, cliente_nombre, metodo_pago, tipo_cliente, fecha_venta, subtotal, descuento, impuestos, total, estado) VALUES
(6, 'VTA-EVT-001', 'feria', 1, 1, 1, 1, 1, 1, 'Visitante Feria',   'efectivo',    'ocasional',     '2026-07-15 10:15:00', 37.98, 0.00, 6.84, 44.82, 'confirmada'),
(7, 'VTA-EVT-002', 'feria', 1, 1, 1, 1, 1, 1, 'Colegio San José',  'transferencia','institucional', '2026-07-15 11:30:00', 59.97, 0.00, 10.79, 70.76, 'confirmada');

INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, descuento_linea, subtotal) VALUES
(8, 6, 1, 1, 18.99, 0.00, 18.99),
(9, 6, 4, 1, 12.00, 0.00, 12.00),
(10, 6, 9, 1,  6.99, 0.00,  6.99),
(11, 7, 3, 3, 19.99, 0.00, 59.97);

INSERT INTO factura_evento (id, codigo, evento_id, caja_evento_id, venta_id, fecha_factura, subtotal, itbis, total, estado, cliente_nombre) VALUES
(1, 'FE-EVT-001', 1, 1, 6, '2026-07-15 10:15:00', 37.98, 6.84, 44.82, 'emitida', 'Visitante Feria'),
(2, 'FE-EVT-002', 1, 1, 7, '2026-07-15 11:30:00', 59.97, 10.79, 70.76, 'emitida', 'Colegio San José');

-- =============================================================================
-- EDITORIALES — Contratos y condiciones comerciales
-- =============================================================================

INSERT INTO contrato_editorial (id, codigo, editorial_id, nombre, tipo_contrato, fecha_inicio, fecha_fin, estado, responsable_id) VALUES
(1, 'CTR-PLAN-2026', 1, 'Contrato Distribución Planeta 2026', 'Distribución exclusiva', '2026-01-01', '2026-12-31', 'activo', 1),
(2, 'CTR-PRH-2026',  3, 'Contrato Importación PRH 2026',      'Importación',            '2026-01-01', '2026-12-31', 'activo', 1);

INSERT INTO renovacion_contrato (id, contrato_id, fecha_vencimiento_anterior, fecha_vencimiento_nueva, fecha_renovacion, usuario_id) VALUES
(1, 1, '2025-12-31', '2026-12-31', '2026-01-05', 1);

INSERT INTO condicion_comercial (id, editorial_id, descuento_pct, plazo_credito_dias, moneda_id, contacto) VALUES
(1, 1, 12.50, 30, 1, 'Carlos Ruiz'),
(2, 3,  8.00, 45, 2, 'John Smith');

INSERT INTO historial_tasa_cambio (id, tasa_cambio_id, tasa, fecha_registro, actualizado_por_id) VALUES
(1, 1, 58.500000, '2026-01-01 00:00:00', 1),
(2, 1, 59.100000, '2026-03-01 00:00:00', 1);

-- =============================================================================
-- VENTAS — Notas de crédito y cambios
-- =============================================================================

INSERT INTO cambio_producto (id, codigo, venta_id, producto_original_id, producto_nuevo_id, cantidad, diferencia_precio, motivo, usuario_id) VALUES
(1, 'CAM-2026-001', 2, 2, 7, 1, -0.51, 'Cliente prefirió otro título', 1);

INSERT INTO nota_credito (id, codigo, venta_id, cambio_producto_id, motivo, monto, estado) VALUES
(1, 'NC-2026-001', 2, 1, 'Diferencia por cambio de producto', 0.51, 'activa');

-- =============================================================================
-- INVENTARIO — Conteo físico de muestra
-- =============================================================================

INSERT INTO conteo_fisico (id, codigo, almacen_id, usuario_id, fecha_conteo, total_productos, total_discrepancias, estado) VALUES
(1, 'CNT-2026-001', 1, 1, '2026-06-20', 3, 1, 'completado');

INSERT INTO detalle_conteo_fisico (id, conteo_id, producto_id, stock_sistema, stock_contado) VALUES
(1, 1, 1, 120, 120),
(2, 1, 4, 200, 198),
(3, 1, 7,  15,  15);

-- =============================================================================
-- SEGURIDAD — Sesiones y MFA
-- =============================================================================

INSERT INTO sesion_usuario (id, usuario_id, token_sesion, dispositivo, ip_address, fecha_inicio, ultima_actividad, estado) VALUES
(1, 1, 'sess_ana_garcia_active_001', 'Chrome / Windows', '192.168.1.5',  '2026-07-14 08:00:00', '2026-07-14 11:00:00', 'activa'),
(2, 2, 'sess_luis_martinez_002',     'Firefox / Windows','192.168.1.10', '2026-07-14 07:30:00', '2026-07-14 10:45:00', 'activa');

INSERT INTO mfa_usuario (id, usuario_id, habilitado, metodo, ultima_verificacion) VALUES
(1, 1, 1, 'app', '2026-07-14 08:01:00');

INSERT INTO intento_acceso_fallido (id, email_intento, ip_address, motivo) VALUES
(1, 'admin@librosys.com', '203.0.113.45', 'Contraseña incorrecta');

SET FOREIGN_KEY_CHECKS = 1;
