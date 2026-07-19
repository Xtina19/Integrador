-- =============================================================================
-- LibroSys — MASTER DATA
-- Archivo: 02_seed_catalogos.sql
-- Categorías, editoriales, proveedores, clientes, monedas (ampliados).
-- =============================================================================

USE librosys;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Categorías (giro librería — sin papelería)
-- ---------------------------------------------------------------------------
INSERT INTO categorias (id, codigo, nombre, descripcion, estado) VALUES
(1, 'CAT-LIT', 'Literatura',              'Novelas y narrativa',                    'activo'),
(2, 'CAT-INF', 'Infantil y juvenil',      'Literatura infantil y juvenil',          'activo'),
(3, 'CAT-ACA', 'Universitario',           'Textos universitarios y académicos',     'activo'),
(4, 'CAT-COM', 'Cómics y manga',          'Manga, cómics Marvel/DC y novelas gráficas','activo'),
(5, 'CAT-NEG', 'Negocios',                'Finanzas y management',                  'activo'),
(6, 'CAT-TEC', 'Programación',            'Informática e ingeniería de software',   'activo'),
(7, 'CAT-DEV', 'Desarrollo personal',     'Autoayuda y hábitos',                    'activo'),
(8, 'CAT-ACC', 'Accesorios de lectura',   'Separadores, fundas, luces, sujetalibros','activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), descripcion = VALUES(descripcion), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Editoriales amplias (no tocar en módulos futuros salvo negocio nuevo)
-- ---------------------------------------------------------------------------
UPDATE editoriales SET codigo='ED-ALF', nombre='Alfaguara', pais='España', tipo_contrato='Importación', estado='activo' WHERE id=1;
UPDATE editoriales SET codigo='ED-PLAN', nombre='Planeta', pais='España', tipo_contrato='Distribución', estado='activo' WHERE id=2;

INSERT INTO editoriales (id, codigo, nombre, pais, contacto, email, tipo_contrato, estado) VALUES
(3,  'ED-PRH',  'Penguin Random House', 'USA',       'John Smith',     'sales@prh.com',              'Importación',  'activo'),
(4,  'ED-PAN',  'Panini',               'Italia',    'Marco Rossi',    'latam@panini.com',           'Distribución', 'activo'),
(5,  'ED-IVR',  'Ivrea',                'Argentina', 'Ana Belén Ruiz', 'export@ivrea.com.ar',        'Importación',  'activo'),
(6,  'ED-NOR',  'Norma',                'Colombia',  'Patricia Gómez', 'comercial@norma.com',        'Distribución', 'activo'),
(7,  'ED-SANT', 'Santillana',           'España',    'Laura Pérez',    'ventas@santillana.com',      'Distribución', 'activo'),
(8,  'ED-ANY',  'Anaya',                'España',    'Jorge Medina',   'ventas@anaya.es',            'Distribución', 'activo'),
(9,  'ED-OCE',  'Océano',               'México',    'Lucía Fernández','export@oceano.com.mx',       'Importación',  'activo'),
(10, 'ED-HC',   'HarperCollins',        'USA',       'Sarah Johnson',  'intl@harpercollins.com',     'Importación',  'activo'),
(11, 'ED-SM',   'SM',                   'España',    'Marta Gil',      'export@grupo-sm.com',        'Distribución', 'activo'),
(12, 'ED-SUS',  'Susaeta',              'España',    'Pablo Ortega',   'ventas@susaeta.com',         'Distribución', 'activo'),
(13, 'ED-HID',  'Hidra',                'España',    'Irene Salas',    'contacto@editorialhidra.com','Importación',  'activo'),
(14, 'ED-PLU',  'Plutón',               'España',    'Diego Vargas',   'info@plutonediciones.com',   'Importación',  'activo'),
(15, 'ED-URA',  'Urano',                'España',    'Carmen Vidal',   'export@urano.es',            'Importación',  'activo'),
(16, 'ED-MOL',  'Molino',               'España',    'Eva Ruiz',       'ventas@molino.es',           'Distribución', 'activo'),
(17, 'ED-SAL',  'Salamandra',           'España',    'Nuria Solé',     'export@salamandra.info',     'Importación',  'activo'),
(18, 'ED-RBA',  'RBA',                  'España',    'Toni Vidal',     'comercial@rba.es',           'Distribución', 'activo'),
(19, 'ED-DK',   'DK',                   'UK',        'Helen Clark',    'intl@dk.com',                'Importación',  'activo'),
(20, 'ED-TAS',  'Taschen',              'Alemania',  'Benedikt T.',    'sales@taschen.com',          'Importación',  'activo'),
(21, 'ED-MAR',  'Marvel Comics',        'USA',       'Licensing Latam','latam@marvel.com',           'Licencia',     'activo'),
(22, 'ED-DC',   'DC Comics',            'USA',       'Licensing Latam','latam@dccomics.com',         'Licencia',     'activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), pais = VALUES(pais), contacto = VALUES(contacto),
  email = VALUES(email), tipo_contrato = VALUES(tipo_contrato), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Proveedores nacionales / internacionales
-- ---------------------------------------------------------------------------
UPDATE proveedores SET
  codigo='PROV-CORR', nombre='Distribuidora Corripio',
  contacto='Pedro Díaz', email='compras@corripio.com.do', telefono='809-565-3111',
  pais='República Dominicana', tipo='nacional', estado='activo' WHERE id=1;
UPDATE proveedores SET
  codigo='PROV-PLAN', nombre='Editorial Planeta',
  contacto='Carlos Ruiz', email='export@planeta.es', telefono='+34-93-492-8000',
  pais='España', tipo='internacional', estado='activo' WHERE id=2;

INSERT INTO proveedores (id, codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES
(3,  'PROV-SANT', 'Santillana Dominicana',               'Laura Méndez',     'pedidos@santillana.com.do',     '809-565-2200', 'República Dominicana', 'nacional',      'activo'),
(4,  'PROV-PANA', 'Panamericana Editorial',              'Andrés Quintero',  'ventas@panamericana.com.co',    '+57-1-410-0909','Colombia',              'internacional', 'activo'),
(5,  'PROV-PRH',  'Penguin Random House Grupo Editorial','John Smith',       'latam@penguinrandomhouse.com',  '+1-212-782-9000','USA',                 'internacional', 'activo'),
(6,  'PROV-NOR',  'Editorial Norma',                     'Patricia Gómez',   'rd@norma.com',                  '809-547-8800', 'Colombia',              'mixto',         'activo'),
(7,  'PROV-IVR',  'Ivrea Argentina',                     'Ana Belén Ruiz',   'export@ivrea.com.ar',           '+54-11-4555-2200','Argentina',           'internacional', 'activo'),
(8,  'PROV-PAN',  'Panini México',                       'Marco Rossi',      'mayoristas@panini.com.mx',      '+52-55-5284-0500','México',              'internacional', 'activo'),
(9,  'PROV-OCE',  'Océano Dominicana',                   'Rosa Fernández',   'ventas@oceano.com.do',          '809-338-4411', 'República Dominicana', 'nacional',      'activo'),
(10, 'PROV-SM',   'SM Dominicana',                       'Marta Gil',        'comercial@sm.com.do',           '809-412-7700', 'República Dominicana', 'nacional',      'activo'),
(11, 'PROV-HC',   'HarperCollins Latam',                 'Sarah Johnson',    'ventas.latam@harpercollins.com','+1-212-207-7000','USA',                 'internacional', 'activo'),
(12, 'PROV-URA',  'Urano Ediciones',                     'Carmen Vidal',     'export@urano.es',               '+34-93-241-7500','España',              'internacional', 'activo'),
(13, 'PROV-DIL',  'Distribuidora Librera del Caribe',    'Julio Peña',       'pedidos@dilicaribe.do',         '809-221-4400', 'República Dominicana', 'nacional',      'activo'),
(14, 'PROV-TAS',  'Taschen International',               'Export Desk',      'export@taschen.com',            '+49-221-20180', 'Alemania',             'internacional', 'activo'),
(15, 'PROV-DK',   'DK Worldwide',                        'Helen Clark',      'orders@dk.com',                 '+44-20-7139-2000','UK',                 'internacional', 'activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), contacto = VALUES(contacto), email = VALUES(email),
  telefono = VALUES(telefono), pais = VALUES(pais), tipo = VALUES(tipo), estado = VALUES(estado);

-- ---------------------------------------------------------------------------
-- Clientes comerciales (venta_clientes)
-- ---------------------------------------------------------------------------
DELETE FROM venta_clientes WHERE codigo IN ('CLI-001','CLI-002') OR dominio_id IN ('CLI-001','CLI-002');

INSERT INTO venta_clientes (dominio_id, codigo, nombre, documento, email, telefono, activo) VALUES
('cli-mostrador',  'CLI-MOS', 'Cliente de Mostrador',          NULL,            NULL,                         NULL,          1),
('cli-lasalle',    'CLI-LAS', 'Colegio La Salle',              'RNC-101000001', 'compras@lasalle.edu.do',     '809-555-2001', 1),
('cli-iberia',     'CLI-IBE', 'Instituto Iberia',              'RNC-101000010', 'biblioteca@iberia.edu.do',   '809-555-2002', 1),
('cli-pucmm',      'CLI-PUC', 'PUCMM',                         'RNC-101000002', 'compras@pucmm.edu.do',       '809-555-2003', 1),
('cli-utesa',      'CLI-UTE', 'UTESA',                         'RNC-101000003', 'adquisiciones@utesa.edu.do','809-555-2004', 1),
('cli-sagrado',    'CLI-SAG', 'Colegio Sagrado Corazón',       'RNC-101000011', 'compras@sagrado.edu.do',    '809-555-2005', 1),
('cli-libuni',     'CLI-LUN', 'Librería Universitaria',        'RNC-101000012', 'pedidos@libuni.do',         '809-555-2006', 1),
('cli-fundacion', 'CLI-FMM', 'Fundación Madre y Maestra',     'RNC-101000013', 'compras@fmm.org.do',        '809-555-2007', 1),
('cli-uasd',       'CLI-UAS', 'UASD — Biblioteca Central',     'RNC-401000001', 'biblioteca@uasd.edu.do',    '809-555-2008', 1),
('cli-intec',      'CLI-INT', 'INTEC',                         'RNC-401000002', 'compras@intec.edu.do',      '809-555-2009', 1),
('cli-banco',      'CLI-BPD', 'Banco Popular — Capacitaciones','RNC-101007890', 'capacitacion@bpd.com.do',   '809-555-2010', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), documento = VALUES(documento), email = VALUES(email),
  telefono = VALUES(telefono), activo = VALUES(activo);

-- Monedas: símbolo EUR correcto
UPDATE monedas SET simbolo = '€', nombre = 'Euro' WHERE codigo = 'EUR';
UPDATE monedas SET simbolo = 'US$', nombre = 'Dólar Estadounidense' WHERE codigo = 'USD';
UPDATE monedas SET simbolo = 'RD$', nombre = 'Peso Dominicano', es_principal = 1 WHERE codigo = 'DOP';

SELECT 'MASTER-DATA :: 02_seed_catalogos.sql aplicado.' AS resultado;
