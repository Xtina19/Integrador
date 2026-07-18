-- =============================================================================
-- ** DEPRECATED (INV-DB-1.0.0, 2026-07-18) **
-- Superado por database/mysql/inventario_definitivo/13_seed_joselito.sql
-- (prefijo `JSL-`, catálogo ampliado y documentos de ejemplo generados vía
-- los procedimientos de 10_procedimientos.sql). Este archivo sigue siendo
-- SEGURO de ejecutar en paralelo (usa el prefijo `PRD-JSL-` y su propio rango
-- de ISBN, sin colisión), pero ya no se referencia desde install_all.sql. Se
-- conserva como referencia histórica; copia intacta en
-- database/mysql/archive/.
-- =============================================================================

-- =============================================================================
-- LibroSys — Semilla "Joselito" para el catálogo relacional de Inventario
-- Archivo: 25_inventario_seed_joselito.sql
-- Ejecutar DESPUÉS de 12_seed.sql (requiere categorias/editoriales/almacenes
-- con los ids 1-4 sembrados ahí) y de 24_descarte_documento.sql.
--
-- CONTEXTO IMPORTANTE:
-- El backend Node del módulo Inventario (backend/src/modules/inventario) es
-- 100% in-memory/DDD: no lee ni escribe en este esquema MySQL. Su catálogo
-- rico de demo (~50 productos, editoriales dominicanas/latinoamericanas,
-- documentos de ejemplo) se genera en tiempo de ejecución mediante
-- `seedInventarioJoselitoCompleto()` / `seedInventarioJoselito()`
-- (infrastructure/composition/seedJoselito.ts) cada vez que se monta el
-- módulo (`mountInventarioModule`), y se persiste de forma durable en
-- backend/data/inventario/inventario_snapshot.json.
--
-- Este archivo es el equivalente para el esquema RELACIONAL (`productos`,
-- `inventario`, `categorias`, `editoriales` de 03/05_*.sql), que usa ids
-- INT AUTO_INCREMENT y FKs estrictas — por eso NO se reutilizan los ids de
-- texto (`prod-jsl-001`, `central`, `suc-1`, …) del seeder runtime. Se
-- amplía el catálogo relacional de forma segura (sin pisar ids existentes,
-- resolviendo FKs por `codigo` en vez de hardcodear ids) para que las
-- vistas de 26_inventario_views_procs.sql tengan datos representativos.
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Categorías adicionales (las 4 de 12_seed.sql cubren Ficción/Infantil/
-- Académico/Comics; se añaden las usadas por el catálogo Joselito).
-- -----------------------------------------------------------------------------
INSERT INTO categorias (codigo, nombre, descripcion, estado)
SELECT * FROM (
  SELECT 'CAT-TXT' AS codigo, 'Texto escolar' AS nombre, 'Libros de texto para primaria y secundaria' AS descripcion, 'activo' AS estado
  UNION ALL SELECT 'CAT-REF', 'Referencia', 'Diccionarios, atlas y enciclopedias', 'activo'
  UNION ALL SELECT 'CAT-PAP', 'Papelería', 'Útiles y materiales escolares', 'activo'
) AS nuevas
WHERE NOT EXISTS (
  SELECT 1 FROM categorias c WHERE c.codigo = nuevas.codigo
);

-- -----------------------------------------------------------------------------
-- Editoriales adicionales (dominicanas y de la región, más allá de las 4
-- internacionales ya sembradas en 12_seed.sql).
-- -----------------------------------------------------------------------------
INSERT INTO editoriales (codigo, nombre, pais, contacto, email, tipo_contrato, estado)
SELECT * FROM (
  SELECT 'ED-SM'   AS codigo, 'SM'                       AS nombre, 'España'                 AS pais, 'Marta León'      AS contacto, 'ventas@sm.com'          AS email, 'Distribución' AS tipo_contrato, 'activo' AS estado
  UNION ALL SELECT 'ED-NOR', 'Norma',                     'Colombia',               'Julián Vega',      'contacto@norma.com',     'Distribución', 'activo'
  UNION ALL SELECT 'ED-UASD','Ediciones de la UASD',      'República Dominicana',  'Rosa Méndez',      'ediciones@uasd.edu.do',  'Nacional',     'activo'
  UNION ALL SELECT 'ED-SEIX','Seix Barral',                'España',                 'Ignacio Ferrer',   'contacto@seixbarral.com','Importación',  'activo'
  UNION ALL SELECT 'ED-SAL', 'Salamandra',                 'España',                 'Nuria Vidal',      'ventas@salamandra.com',  'Importación',  'activo'
  UNION ALL SELECT 'ED-LAR', 'Larousse',                   'México',                 'Diego Paredes',    'contacto@larousse.com',  'Importación',  'activo'
  UNION ALL SELECT 'ED-ESP', 'Espasa',                     'España',                 'Beatriz Soler',    'ventas@espasa.com',      'Importación',  'activo'
  UNION ALL SELECT 'ED-ALI', 'Alianza Editorial',          'España',                 'Álvaro Nieto',     'contacto@alianza.com',   'Importación',  'activo'
) AS nuevas
WHERE NOT EXISTS (
  SELECT 1 FROM editoriales e WHERE e.codigo = nuevas.codigo
);

-- -----------------------------------------------------------------------------
-- Catálogo de productos (subset representativo del seeder runtime, adaptado
-- a este esquema: FKs resueltas por código, ids asignados por AUTO_INCREMENT).
-- -----------------------------------------------------------------------------
INSERT INTO productos (codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado)
SELECT nuevos.codigo, nuevos.isbn, nuevos.titulo, nuevos.autor,
       (SELECT id FROM categorias WHERE codigo = nuevos.categoria_codigo),
       (SELECT id FROM editoriales WHERE codigo = nuevos.editorial_codigo),
       nuevos.costo, nuevos.precio, 'activo'
FROM (
  SELECT 'PRD-JSL-001' AS codigo, '978-9945-100-0' AS isbn, 'Enriquillo' AS titulo, 'Manuel de Jesús Galván' AS autor, 'CAT-FIC' AS categoria_codigo, 'ED-UASD' AS editorial_codigo, 11.50 AS costo, 22.00 AS precio
  UNION ALL SELECT 'PRD-JSL-002', '978-9945-101-7', 'Over',                                      'Ramón Marrero Aristy',      'CAT-FIC', 'ED-UASD', 10.00, 19.50
  UNION ALL SELECT 'PRD-JSL-003', '978-9945-102-4', 'In the Time of the Butterflies',            'Julia Álvarez',             'CAT-FIC', 'ED-UASD', 14.00, 26.00
  UNION ALL SELECT 'PRD-JSL-004', '978-9945-103-1', 'La maravillosa vida breve de Óscar Wao',    'Junot Díaz',                'CAT-FIC', 'ED-NOR',  15.90, 27.50
  UNION ALL SELECT 'PRD-JSL-005', '978-9945-104-8', 'La mujer habitada',                         'Gioconda Belli',            'CAT-FIC', 'ED-NOR',  12.20, 21.00
  UNION ALL SELECT 'PRD-JSL-006', '978-9945-105-5', 'Ficciones',                                  'Jorge Luis Borges',         'CAT-FIC', 'ED-ALI',  10.80, 19.90
  UNION ALL SELECT 'PRD-JSL-007', '978-9945-106-2', 'El túnel',                                   'Ernesto Sabato',            'CAT-FIC', 'ED-SEIX', 9.60,  18.00
  UNION ALL SELECT 'PRD-JSL-008', '978-9945-107-9', 'Charlie y la fábrica de chocolate',          'Roald Dahl',                'CAT-INF', 'ED-SAL',  10.00, 19.00
  UNION ALL SELECT 'PRD-JSL-009', '978-9945-108-6', 'Matilda',                                    'Roald Dahl',                'CAT-INF', 'ED-SAL',  10.00, 19.00
  UNION ALL SELECT 'PRD-JSL-010', '978-9945-109-3', 'Platero y yo',                               'Juan Ramón Jiménez',        'CAT-INF', 'ED-SM',   8.40,  16.50
  UNION ALL SELECT 'PRD-JSL-011', '978-9945-110-9', 'Las aventuras de Pinocho',                   'Carlo Collodi',             'CAT-INF', 'ED-SM',   8.40,  16.50
  UNION ALL SELECT 'PRD-JSL-012', '978-9945-111-6', 'Cuentos de Buen Provecho',                   'Fabio Fiallo',              'CAT-INF', 'ED-UASD', 7.60,  15.00
  UNION ALL SELECT 'PRD-JSL-013', '978-9945-112-3', 'Manual de Matemática 5to Primaria',          'Equipo Editorial Santillana','CAT-TXT','ED-SANT', 6.50,  13.50
  UNION ALL SELECT 'PRD-JSL-014', '978-9945-113-0', 'Lengua Española 6to Primaria',                'Equipo Editorial SM',       'CAT-TXT', 'ED-SM',   6.50,  13.50
  UNION ALL SELECT 'PRD-JSL-015', '978-9945-114-7', 'Ciencias Naturales 4to Primaria',             'Equipo Editorial Norma',    'CAT-TXT', 'ED-NOR',  6.50,  13.50
  UNION ALL SELECT 'PRD-JSL-016', '978-9945-115-4', 'Historia Dominicana 8vo',                     'Frank Moya Pons',           'CAT-TXT', 'ED-UASD', 8.90,  16.90
  UNION ALL SELECT 'PRD-JSL-017', '978-9945-116-1', 'Geografía Universal 7mo',                     'Equipo Editorial Santillana','CAT-TXT','ED-SANT', 6.50,  13.50
  UNION ALL SELECT 'PRD-JSL-018', '978-9945-117-8', 'Matemática 1ro Secundaria',                   'Equipo Editorial Santillana','CAT-TXT','ED-SANT', 6.50,  13.50
  UNION ALL SELECT 'PRD-JSL-019', '978-9945-118-5', 'Diccionario de la Lengua Española',           'Real Academia Española',    'CAT-REF', 'ED-ESP',  22.00, 39.00
  UNION ALL SELECT 'PRD-JSL-020', '978-9945-119-2', 'Atlas Geográfico Mundial',                    'Equipo Editorial Norma',    'CAT-REF', 'ED-NOR',  18.50, 33.00
  UNION ALL SELECT 'PRD-JSL-021', '978-9945-120-8', 'Enciclopedia de la República Dominicana',     'Frank Moya Pons',           'CAT-REF', 'ED-UASD', 25.00, 42.00
  UNION ALL SELECT 'PRD-JSL-022', '978-9945-121-5', 'Diccionario Inglés-Español',                  'Equipo Editorial Larousse', 'CAT-REF', 'ED-LAR',  15.00, 27.00
  UNION ALL SELECT 'PRD-JSL-023', '978-9945-122-2', 'Cuaderno cuadriculado 100 hojas',              'N/A',                       'CAT-PAP', 'ED-NOR',  1.20,  3.00
  UNION ALL SELECT 'PRD-JSL-024', '978-9945-123-9', 'Set de lápices de colores (24u)',              'N/A',                       'CAT-PAP', 'ED-NOR',  3.50,  7.50
  UNION ALL SELECT 'PRD-JSL-025', '978-9945-124-6', 'Calculadora científica básica',                'N/A',                       'CAT-PAP', 'ED-SM',   9.00,  16.00
) AS nuevos
WHERE NOT EXISTS (
  SELECT 1 FROM productos p WHERE p.codigo = nuevos.codigo
);

-- -----------------------------------------------------------------------------
-- Existencias por almacén (Central=1, Santiago=2, La Romana=3; Tránsito=4
-- se deja sin stock, como en 12_seed.sql).
-- -----------------------------------------------------------------------------
INSERT INTO inventario (producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock)
SELECT p.id, a.almacen_id, a.stock, a.stock_minimo, a.ubicacion,
       CASE WHEN a.stock = 0 THEN 'agotado' WHEN a.stock <= a.stock_minimo THEN 'bajo' ELSE 'normal' END
FROM productos p
JOIN (
  SELECT 'PRD-JSL-001' AS codigo, 1 AS almacen_id, 40 AS stock, 10 AS stock_minimo, 'Pasillo Literatura Dominicana' AS ubicacion
  UNION ALL SELECT 'PRD-JSL-001', 2, 12, 5,  'Estante Literatura'
  UNION ALL SELECT 'PRD-JSL-002', 1, 25, 8,  'Pasillo Literatura Dominicana'
  UNION ALL SELECT 'PRD-JSL-003', 1, 30, 8,  'Pasillo Literatura Dominicana'
  UNION ALL SELECT 'PRD-JSL-004', 1, 35, 10, 'Pasillo Literatura Dominicana'
  UNION ALL SELECT 'PRD-JSL-004', 3, 10, 5,  'Estante Literatura'
  UNION ALL SELECT 'PRD-JSL-005', 1, 22, 8,  'Pasillo Literatura Dominicana'
  UNION ALL SELECT 'PRD-JSL-006', 1, 18, 6,  'Pasillo Literatura Universal'
  UNION ALL SELECT 'PRD-JSL-007', 2, 14, 5,  'Estante Literatura'
  UNION ALL SELECT 'PRD-JSL-008', 1, 28, 8,  'Estante Infantil'
  UNION ALL SELECT 'PRD-JSL-009', 1, 26, 8,  'Estante Infantil'
  UNION ALL SELECT 'PRD-JSL-010', 3, 16, 5,  'Estante Infantil'
  UNION ALL SELECT 'PRD-JSL-011', 1, 20, 6,  'Estante Infantil'
  UNION ALL SELECT 'PRD-JSL-012', 1, 15, 5,  'Estante Infantil'
  UNION ALL SELECT 'PRD-JSL-013', 1, 55, 15, 'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-014', 1, 50, 15, 'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-015', 2, 24, 10, 'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-016', 1, 33, 10, 'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-017', 1, 29, 10, 'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-018', 3, 18, 8,  'Zona Texto Escolar'
  UNION ALL SELECT 'PRD-JSL-019', 1, 12, 5,  'Zona Referencia'
  UNION ALL SELECT 'PRD-JSL-020', 1, 9,  4,  'Zona Referencia'
  UNION ALL SELECT 'PRD-JSL-021', 1, 7,  3,  'Zona Referencia'
  UNION ALL SELECT 'PRD-JSL-022', 2, 11, 5,  'Zona Referencia'
  UNION ALL SELECT 'PRD-JSL-023', 1, 120, 30, 'Zona Papelería'
  UNION ALL SELECT 'PRD-JSL-024', 1, 80, 20,  'Zona Papelería'
  UNION ALL SELECT 'PRD-JSL-025', 1, 15, 5,   'Zona Papelería'
) AS a ON a.codigo = p.codigo
WHERE NOT EXISTS (
  SELECT 1 FROM inventario i WHERE i.producto_id = p.id AND i.almacen_id = a.almacen_id
);

SET FOREIGN_KEY_CHECKS = 1;
