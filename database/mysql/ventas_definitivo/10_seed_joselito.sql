-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 10_seed_joselito.sql
-- Datos coherentes Librería Joselito (VEN-DATA). Requiere seed base ERP
-- (usuarios, sucursales, almacenes, productos) ya instalado.
-- Montos DOP enteros (sin centavos). IDs de dominio alineados al seed TS.
-- =============================================================================

USE librosys;

-- ---------------------------------------------------------------------------
-- Puente dominio ↔ ERP (INT)
-- ---------------------------------------------------------------------------
INSERT INTO ventas_ref_catalogo (tipo, dominio_id, erp_id, codigo_erp, notas) VALUES
('sucursal', 'suc-central', 1, 'SUC-CTR', 'Sucursal Central'),
('sucursal', 'suc-santiago', 2, 'SUC-STI', 'Sucursal Santiago'),
('almacen',  'alm-central', 1, 'ALM-CTR', 'Almacén Central'),
('almacen',  'alm-polanco', 1, 'ALM-CTR', 'Alias Joselito → Central (mismo ERP)'),
('almacen',  'alm-santiago', 2, 'ALM-STI', 'Almacén Santiago'),
('usuario',  'usr-admin', 1, 'USR-001', 'Ana García / administrador'),
('usuario',  'usr-cajero', 1, 'USR-001', 'Operación cajero (seed demo)'),
('usuario',  'usr-supervisor', 2, 'USR-002', 'Luis Martínez / supervisor'),
('producto', 'prod-cien', 1, 'PRD-001', 'Cien años de soledad'),
('producto', 'prod-1984', 4, 'PRD-004', '1984'),
('producto', 'prod-principito', 9, 'PRD-009', 'El principito'),
('producto', 'prod-dune', 10, 'PRD-010', 'Sapiens como proxy de catálogo seed'),
('producto', 'prod-mate5', 8, 'PRD-008', 'Don Quijote como proxy académico'),
('producto', 'prod-cuaderno', 7, 'PRD-007', 'Proxy papelería')
ON DUPLICATE KEY UPDATE erp_id = VALUES(erp_id), codigo_erp = VALUES(codigo_erp), notas = VALUES(notas);

INSERT INTO ventas_secuencia_factura (sucursal_dominio_id, ultimo_numero) VALUES
('suc-central', 1002),
('suc-santiago', 1000)
ON DUPLICATE KEY UPDATE ultimo_numero = GREATEST(ultimo_numero, VALUES(ultimo_numero));

-- Clientes registrados
INSERT INTO venta_clientes (dominio_id, codigo, nombre, documento, activo) VALUES
('cli-lasalle', 'CLI-LAS', 'Colegio La Salle', 'RNC-101000001', 1),
('cli-pucmm',   'CLI-PUC', 'PUCMM',            'RNC-101000002', 1),
('cli-utesa',   'CLI-UTE', 'UTESA',            'RNC-101000003', 1),
('cli-maria',   'CLI-MAR', 'María González',   '001-1234567-8', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo);

INSERT INTO ventas_ref_catalogo (tipo, dominio_id, erp_id, codigo_erp)
SELECT 'cliente', c.dominio_id, c.id, c.codigo
FROM venta_clientes c
WHERE c.dominio_id IN ('cli-lasalle','cli-pucmm','cli-utesa','cli-maria')
ON DUPLICATE KEY UPDATE erp_id = VALUES(erp_id), codigo_erp = VALUES(codigo_erp);

-- Factura 1: Consumidor Final (mostrador)
INSERT INTO ventas (
  dominio_id, numero_factura, estado, tipo_venta,
  cliente_id, cliente_dominio_id,
  sucursal_id, sucursal_dominio_id,
  almacen_id, almacen_dominio_id,
  usuario_emision_id, usuario_emision_dominio_id,
  moneda_codigo, fecha_emision,
  subtotal, total_descuentos, total, version,
  tiene_cambios, tiene_devoluciones, tiene_notas_credito
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  'F-SUC-CTR-1001',
  'emitida',
  'consumidor_final',
  NULL, NULL,
  1, 'suc-central',
  1, 'alm-central',
  1, 'usr-cajero',
  'DOP', '2026-07-17 10:15:00',
  2095, 0, 2095, 1,
  0, 0, 0
);

SET @venta_cf_id = LAST_INSERT_ID();

INSERT INTO venta_lineas (
  dominio_id, venta_id, producto_id, producto_dominio_id,
  descripcion_snapshot, cantidad, precio_unitario, importe_neto
) VALUES
('llllllll-bbbb-cccc-dddd-000000000001', @venta_cf_id, 1, 'prod-cien',
 'Cien años de soledad', 1, 1200, 1200),
('llllllll-bbbb-cccc-dddd-000000000002', @venta_cf_id, 4, 'prod-1984',
 '1984', 1, 895, 895);

INSERT INTO pagos (
  dominio_id, venta_id, forma_pago, monto, moneda_codigo, vuelto
) VALUES
('pppppppp-bbbb-cccc-dddd-000000000001', @venta_cf_id, 'efectivo', 2095, 'DOP', 0);

INSERT INTO historial_ventas (
  dominio_id, venta_id, tipo_evento, usuario_id, usuario_dominio_id, fecha, resultado, detalle
) VALUES
('hhhhhhhh-bbbb-cccc-dddd-000000000001', @venta_cf_id, 'emision', 1, 'usr-cajero',
 '2026-07-17 10:15:00', 'OK', 'Factura F-SUC-CTR-1001 emitida');

-- Factura 2: Cliente Registrado (PUCMM)
-- Líneas: 3×1200=3600 −10%=3240; 2×650=1300 −10%=1170; total 4410
INSERT INTO ventas (
  dominio_id, numero_factura, estado, tipo_venta,
  cliente_id, cliente_dominio_id,
  sucursal_id, sucursal_dominio_id,
  almacen_id, almacen_dominio_id,
  usuario_emision_id, usuario_emision_dominio_id,
  moneda_codigo, fecha_emision,
  subtotal, total_descuentos, total, version,
  tiene_cambios, tiene_devoluciones, tiene_notas_credito
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-000000000002',
  'F-SUC-CTR-1002',
  'emitida',
  'cliente_registrado',
  (SELECT id FROM venta_clientes WHERE dominio_id = 'cli-pucmm' LIMIT 1),
  'cli-pucmm',
  1, 'suc-central',
  1, 'alm-central',
  1, 'usr-cajero',
  'DOP', '2026-07-17 11:40:00',
  4900, 490, 4410, 1,
  0, 0, 0
);

SET @venta_cr_id = LAST_INSERT_ID();

INSERT INTO venta_lineas (
  dominio_id, venta_id, producto_id, producto_dominio_id,
  descripcion_snapshot, cantidad, precio_unitario,
  descuento_tipo, descuento_valor, importe_neto
) VALUES
('llllllll-bbbb-cccc-dddd-000000000003', @venta_cr_id, 1, 'prod-cien',
 'Cien años de soledad', 3, 1200, 'porcentaje', 10.0000, 3240),
('llllllll-bbbb-cccc-dddd-000000000004', @venta_cr_id, 9, 'prod-principito',
 'El principito', 2, 650, 'porcentaje', 10.0000, 1170);

INSERT INTO pagos (
  dominio_id, venta_id, forma_pago, monto, moneda_codigo
) VALUES
('pppppppp-bbbb-cccc-dddd-000000000002', @venta_cr_id, 'transferencia', 2500, 'DOP'),
('pppppppp-bbbb-cccc-dddd-000000000003', @venta_cr_id, 'tarjeta', 1910, 'DOP');

INSERT INTO historial_ventas (
  dominio_id, venta_id, tipo_evento, usuario_id, usuario_dominio_id, fecha, resultado, detalle
) VALUES
('hhhhhhhh-bbbb-cccc-dddd-000000000002', @venta_cr_id, 'emision', 1, 'usr-cajero',
 '2026-07-17 11:40:00', 'OK', 'Factura F-SUC-CTR-1002 emitida — PUCMM'),
('hhhhhhhh-bbbb-cccc-dddd-000000000003', @venta_cr_id, 'pago', 1, 'usr-cajero',
 '2026-07-17 11:40:00', 'OK', 'Pago mixto transferencia+tarjeta');

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '10_seed_joselito.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 10_seed_joselito.sql aplicado.' AS resultado;
