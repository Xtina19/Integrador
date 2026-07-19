-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 10_seed_joselito.sql
-- Semilla realista Librería Joselito — productos = mismo catálogo Compras.
-- Montos DECIMAL(18,2). IDs de dominio alineados al seed TS / POS.
-- =============================================================================

USE librosys;

-- ---------------------------------------------------------------------------
-- Puente dominio ↔ ERP (productos = IDs del maestro Compras)
-- ---------------------------------------------------------------------------
INSERT INTO ventas_ref_catalogo (tipo, dominio_id, erp_id, codigo_erp, notas) VALUES
('sucursal', 'suc-central', 1, 'SUC-SD', 'Sucursal Santo Domingo'),
('sucursal', 'suc-santiago', 2, 'SUC-STG', 'Sucursal Santiago'),
('almacen',  'alm-central', 1, 'ALM-CTR', 'Almacén Central'),
('almacen',  'alm-polanco', 1, 'ALM-CTR', 'Alias → Central'),
('almacen',  'alm-santiago', 2, 'ALM-STI', 'Almacén Santiago'),
('usuario',  'usr-admin', 1, 'USR-001', 'Administrador'),
('usuario',  'usr-cajero', 1, 'USR-001', 'Cajero'),
('usuario',  'usr-supervisor', 2, 'USR-002', 'Supervisor Compras/Ventas'),
('producto', 'prod-cien', 1, 'PRD-001', 'Cien años de soledad'),
('producto', 'prod-sombra', 2, 'PRD-002', 'La sombra del viento'),
('producto', 'prod-quijote', 3, 'PRD-003', 'Don Quijote de la Mancha'),
('producto', 'prod-principito', 4, 'PRD-004', 'El Principito'),
('producto', 'prod-habitos', 5, 'PRD-005', 'Hábitos Atómicos'),
('producto', 'prod-padre', 6, 'PRD-006', 'Padre Rico Padre Pobre'),
('producto', 'prod-cleancode', 7, 'PRD-007', 'Clean Code'),
('producto', 'prod-hp', 8, 'PRD-008', 'Harry Potter'),
('producto', 'prod-onepiece', 9, 'PRD-009', 'One Piece Vol. 1'),
('producto', 'prod-naruto', 10, 'PRD-010', 'Naruto Vol. 1'),
('producto', 'prod-jujutsu', 11, 'PRD-011', 'Jujutsu Kaisen Vol. 1'),
('producto', 'prod-1984', 16, 'PRD-016', '1984')
ON DUPLICATE KEY UPDATE erp_id = VALUES(erp_id), codigo_erp = VALUES(codigo_erp), notas = VALUES(notas);

INSERT INTO ventas_secuencia_factura (sucursal_dominio_id, ultimo_numero) VALUES
('suc-central', 1006),
('suc-santiago', 1001)
ON DUPLICATE KEY UPDATE ultimo_numero = GREATEST(ultimo_numero, VALUES(ultimo_numero));

-- Clientes Joselito
INSERT INTO venta_clientes (dominio_id, codigo, nombre, documento, activo) VALUES
('cli-lasalle',    'CLI-LAS', 'Colegio La Salle',            'RNC-101000001', 1),
('cli-iberia',     'CLI-IBE', 'Instituto Iberia',            'RNC-101000010', 1),
('cli-pucmm',      'CLI-PUC', 'PUCMM',                       'RNC-101000002', 1),
('cli-utesa',      'CLI-UTE', 'UTESA',                       'RNC-101000003', 1),
('cli-sagrado',    'CLI-SAG', 'Colegio Sagrado Corazón',     'RNC-101000011', 1),
('cli-libuni',     'CLI-LUN', 'Librería Universitaria',      'RNC-101000012', 1),
('cli-fundacion', 'CLI-FMM', 'Fundación Madre y Maestra',   'RNC-101000013', 1),
('cli-mostrador',  'CLI-MOS', 'Cliente de Mostrador',        NULL, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo);

INSERT INTO ventas_ref_catalogo (tipo, dominio_id, erp_id, codigo_erp)
SELECT 'cliente', c.dominio_id, c.id, c.codigo FROM venta_clientes c
ON DUPLICATE KEY UPDATE erp_id = VALUES(erp_id), codigo_erp = VALUES(codigo_erp);

-- Nota: documentos de venta de demostración completos viven en el seed
-- in-memory (seedVentasJoselito.ts) usado por el runtime actual del módulo.
-- Este SQL deja catálogo, secuencia y puente producto→Compras listos para MySQL.

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.1', '10_seed_joselito.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB :: 10_seed_joselito.sql (catálogo Joselito + puente Compras) aplicado.' AS resultado;
