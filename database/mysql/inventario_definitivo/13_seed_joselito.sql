-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 13_seed_joselito.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Semilla profesional "Joselito" para el esquema relacional del módulo
-- Inventario. Ejecutar DESPUÉS de 12_seed.sql (usuarios/sucursales/almacenes/
-- categorías/editoriales base) y de 00_VERSION.sql .. 12_vistas_indices.sql
-- de este mismo paquete.
--
-- Diseño:
--   - Catálogo (categorías/editoriales/productos) con prefijo `JSL-` e ISBN
--     bajo el rango 978-9945-9xx, que NO colisiona con el prefijo `PRD-JSL-`
--     usado por 25_inventario_seed_joselito.sql (rango 978-9945-1xx) — ambos
--     seeds pueden coexistir sin duplicar codigo/isbn.
--   - Idempotente en dos niveles:
--       1) Catálogo/existencias: `INSERT ... SELECT ... WHERE NOT EXISTS`.
--       2) Movimientos y documentos: se generan LLAMANDO a los procedimientos
--          de 10_procedimientos.sql, que ya son replay-safe por
--          `idempotency_key`, envueltos en procedimientos temporales que
--          verifican `IF NOT EXISTS (... WHERE codigo = ...)` antes de crear
--          cada documento (reintentar este script no duplica nada).
--   - Los documentos de ejemplo (transferencias, ajuste, descarte, conteo)
--     se crean invocando el mismo stored-procedure API que usaría la
--     aplicación real, para dejar evidencia de que el paquete de
--     procedimientos funciona de punta a punta.
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1) CATÁLOGOS — categorías y editoriales (aseguradas, sin duplicar si ya
--    existen por 12_seed.sql o 25_inventario_seed_joselito.sql)
-- =============================================================================
INSERT INTO categorias (codigo, nombre, descripcion, estado)
SELECT * FROM (
  SELECT 'CAT-LIT' AS codigo, 'Literatura'    AS nombre, 'Novela, cuento y poesía en español'         AS descripcion, 'activo' AS estado
  UNION ALL SELECT 'CAT-INF', 'Infantil',      'Literatura infantil y juvenil',                          'activo'
  UNION ALL SELECT 'CAT-TXT', 'Texto escolar', 'Libros de texto para primaria y secundaria',             'activo'
  UNION ALL SELECT 'CAT-REF', 'Referencia',    'Diccionarios, atlas y enciclopedias',                    'activo'
  UNION ALL SELECT 'CAT-ACC', 'Accesorios de lectura', 'Separadores, fundas, luces, sujetalibros',       'activo'
) AS nuevas
WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.codigo = nuevas.codigo);

INSERT INTO editoriales (codigo, nombre, pais, contacto, email, tipo_contrato, estado)
SELECT * FROM (
  SELECT 'ED-PRH'  AS codigo, 'Penguin Random House'  AS nombre, 'USA',                    'John Smith',    'sales@prh.com',           'Importación',  'activo'
  UNION ALL SELECT 'ED-PLAN', 'Planeta',                'España',                 'Carlos Ruiz',   'contacto@planeta.com',    'Distribución', 'activo'
  UNION ALL SELECT 'ED-ALF',  'Alfaguara',              'España',                 'Elena Torres',  'export@alfaguara.com',    'Importación',  'activo'
  UNION ALL SELECT 'ED-SM',   'SM',                      'España',                 'Marta León',    'ventas@sm.com',           'Distribución', 'activo'
  UNION ALL SELECT 'ED-NOR',  'Norma',                   'Colombia',               'Julián Vega',   'contacto@norma.com',      'Distribución', 'activo'
  UNION ALL SELECT 'ED-SANT', 'Santillana',              'España',                 'Laura Pérez',   'ventas@santillana.com',   'Distribución', 'activo'
  UNION ALL SELECT 'ED-UASD', 'Ediciones de la UASD',    'República Dominicana',   'Rosa Méndez',   'ediciones@uasd.edu.do',   'Nacional',     'activo'
  UNION ALL SELECT 'ED-LAR',  'Larousse',                'México',                 'Diego Paredes', 'contacto@larousse.com',   'Importación',  'activo'
  UNION ALL SELECT 'ED-GEN',  'Suministros Escolares RD','República Dominicana',   'Iván Castillo', 'ventas@suministrosrd.com','Nacional',     'activo'
) AS nuevas
WHERE NOT EXISTS (SELECT 1 FROM editoriales e WHERE e.codigo = nuevas.codigo);

-- =============================================================================
-- 2) PRODUCTOS — catálogo Joselito (47 títulos/artículos, costos DOP enteros
--    tomados exclusivamente de {650, 895, 1200, 1500, 2500, 3500})
-- =============================================================================
INSERT INTO productos (codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado)
SELECT nuevos.codigo, nuevos.isbn, nuevos.titulo, nuevos.autor,
       (SELECT id FROM categorias WHERE codigo = nuevos.categoria_codigo),
       (SELECT id FROM editoriales WHERE codigo = nuevos.editorial_codigo),
       nuevos.costo, nuevos.precio, 'activo'
FROM (
  -- Literatura (CAT-LIT)
  SELECT 'JSL-001' AS codigo, '978-9945-901-3' AS isbn, 'Cien años de soledad'                     AS titulo, 'Gabriel García Márquez' AS autor, 'CAT-LIT' AS categoria_codigo, 'ED-PLAN' AS editorial_codigo, 2500 AS costo, 4200 AS precio
  UNION ALL SELECT 'JSL-002', '978-9945-902-0', 'El olor de la guayaba',                     'Gabriel García Márquez', 'CAT-LIT', 'ED-PLAN', 1500, 2600
  UNION ALL SELECT 'JSL-003', '978-9945-903-7', 'Pedro Páramo',                              'Juan Rulfo',             'CAT-LIT', 'ED-PRH',  1200, 2100
  UNION ALL SELECT 'JSL-004', '978-9945-904-4', 'Rayuela',                                   'Julio Cortázar',         'CAT-LIT', 'ED-ALF',  1500, 2600
  UNION ALL SELECT 'JSL-005', '978-9945-905-1', 'La casa de los espíritus',                  'Isabel Allende',         'CAT-LIT', 'ED-PLAN', 1500, 2600
  UNION ALL SELECT 'JSL-006', '978-9945-906-8', 'Como agua para chocolate',                  'Laura Esquivel',         'CAT-LIT', 'ED-PRH',  1200, 2100
  UNION ALL SELECT 'JSL-007', '978-9945-907-5', 'El general en su laberinto',                'Gabriel García Márquez', 'CAT-LIT', 'ED-PLAN', 1500, 2600
  UNION ALL SELECT 'JSL-008', '978-9945-908-2', 'Los versos del capitán',                    'Pablo Neruda',           'CAT-LIT', 'ED-ALF',  895,  1550
  UNION ALL SELECT 'JSL-009', '978-9945-909-9', 'Los ojos de un perro azul',                 'Gabriel García Márquez', 'CAT-LIT', 'ED-PLAN', 895,  1550
  UNION ALL SELECT 'JSL-010', '978-9945-910-5', 'Yo el Supremo',                             'Augusto Roa Bastos',     'CAT-LIT', 'ED-PRH',  1500, 2600
  UNION ALL SELECT 'JSL-011', '978-9945-911-2', 'Vine solo a hablar por teléfono',           'Gabriel García Márquez', 'CAT-LIT', 'ED-PLAN', 895,  1550
  UNION ALL SELECT 'JSL-012', '978-9945-912-9', 'Conversación en La Catedral',               'Mario Vargas Llosa',     'CAT-LIT', 'ED-ALF',  3500, 5900
  UNION ALL SELECT 'JSL-013', '978-9945-913-6', 'El siglo de las luces',                     'Alejo Carpentier',       'CAT-LIT', 'ED-UASD', 1200, 2100
  UNION ALL SELECT 'JSL-014', '978-9945-914-3', 'Yania Tierra',                              'Aída Cartagena Portalatín', 'CAT-LIT', 'ED-UASD', 895, 1550
  UNION ALL SELECT 'JSL-015', '978-9945-915-0', 'De abril en adelante',                      'Marcio Veloz Maggiolo',  'CAT-LIT', 'ED-UASD', 1200, 2100
  -- Infantil (CAT-INF)
  UNION ALL SELECT 'JSL-016', '978-9945-916-7', 'El Principito',                             'Antoine de Saint-Exupéry','CAT-INF', 'ED-SM',  895,  1550
  UNION ALL SELECT 'JSL-017', '978-9945-917-4', 'Donde viven los monstruos',                 'Maurice Sendak',          'CAT-INF', 'ED-SM',  650,  1150
  UNION ALL SELECT 'JSL-018', '978-9945-918-1', 'El gigante egoísta',                        'Oscar Wilde',             'CAT-INF', 'ED-NOR', 650,  1150
  UNION ALL SELECT 'JSL-019', '978-9945-919-8', 'Alicia en el país de las maravillas',       'Lewis Carroll',           'CAT-INF', 'ED-PLAN',895,  1550
  UNION ALL SELECT 'JSL-020', '978-9945-920-4', 'La historia interminable',                  'Michael Ende',            'CAT-INF', 'ED-SM',  1200, 2100
  UNION ALL SELECT 'JSL-021', '978-9945-921-1', 'El león enorme',                            'Julia Donaldson',         'CAT-INF', 'ED-NOR', 650,  1150
  UNION ALL SELECT 'JSL-022', '978-9945-922-8', 'Cuentos de la selva',                       'Horacio Quiroga',         'CAT-INF', 'ED-PLAN',895,  1550
  UNION ALL SELECT 'JSL-023', '978-9945-923-5', 'Momo',                                      'Michael Ende',            'CAT-INF', 'ED-SM',  1200, 2100
  UNION ALL SELECT 'JSL-024', '978-9945-924-2', 'Winnie the Pooh',                           'A. A. Milne',             'CAT-INF', 'ED-NOR', 895,  1550
  UNION ALL SELECT 'JSL-025', '978-9945-925-9', 'Coraline',                                   'Neil Gaiman',             'CAT-INF', 'ED-SM',  895,  1550
  -- Texto escolar (CAT-TXT)
  UNION ALL SELECT 'JSL-026', '978-9945-926-6', 'Matemática 7mo Grado',                      'Equipo Editorial Santillana', 'CAT-TXT', 'ED-SANT', 650, 1150
  UNION ALL SELECT 'JSL-027', '978-9945-927-3', 'Lengua Española 8vo Grado',                 'Equipo Editorial SM',         'CAT-TXT', 'ED-SM',   650, 1150
  UNION ALL SELECT 'JSL-028', '978-9945-928-0', 'Ciencias Sociales 6to Grado',                'Equipo Editorial Norma',      'CAT-TXT', 'ED-NOR',  650, 1150
  UNION ALL SELECT 'JSL-029', '978-9945-929-7', 'Ciencias de la Naturaleza 5to Grado',        'Equipo Editorial Santillana', 'CAT-TXT', 'ED-SANT', 650, 1150
  UNION ALL SELECT 'JSL-030', '978-9945-930-3', 'Historia Dominicana y del Caribe',           'Frank Moya Pons',             'CAT-TXT', 'ED-UASD', 895, 1550
  UNION ALL SELECT 'JSL-031', '978-9945-931-0', 'Geografía Física y Humana 9no',              'Equipo Editorial Santillana', 'CAT-TXT', 'ED-SANT', 895, 1550
  UNION ALL SELECT 'JSL-032', '978-9945-932-7', 'Educación Cívica y Formación Humana',        'Equipo Editorial SM',         'CAT-TXT', 'ED-SM',   650, 1150
  UNION ALL SELECT 'JSL-033', '978-9945-933-4', 'Matemática 1ro Bachillerato',                'Equipo Editorial Norma',      'CAT-TXT', 'ED-NOR',  895, 1550
  UNION ALL SELECT 'JSL-034', '978-9945-934-1', 'Inglés Comunicativo Nivel Básico',           'Equipo Editorial Santillana', 'CAT-TXT', 'ED-SANT', 895, 1550
  UNION ALL SELECT 'JSL-035', '978-9945-935-8', 'Física General 2do Bachillerato',            'Equipo Editorial SM',         'CAT-TXT', 'ED-SM',   1200, 2100
  -- Referencia (CAT-REF)
  UNION ALL SELECT 'JSL-036', '978-9945-936-5', 'Diccionario Escolar de la Lengua Española',  'Real Academia Española',      'CAT-REF', 'ED-SANT', 1200, 2100
  UNION ALL SELECT 'JSL-037', '978-9945-937-2', 'Atlas Universal Ilustrado',                   'Equipo Editorial Larousse',   'CAT-REF', 'ED-LAR',  1500, 2600
  UNION ALL SELECT 'JSL-038', '978-9945-938-9', 'Diccionario Larousse Ilustrado',              'Equipo Editorial Larousse',   'CAT-REF', 'ED-LAR',  1500, 2600
  UNION ALL SELECT 'JSL-039', '978-9945-939-6', 'Enciclopedia Temática Escolar',               'Equipo Editorial Norma',      'CAT-REF', 'ED-NOR',  3500, 5900
  UNION ALL SELECT 'JSL-040', '978-9945-940-2', 'Gramática de la Lengua Española',             'Real Academia Española',      'CAT-REF', 'ED-SANT', 1500, 2600
  UNION ALL SELECT 'JSL-041', '978-9945-941-9', 'Diccionario de Sinónimos y Antónimos',        'Equipo Editorial Larousse',   'CAT-REF', 'ED-LAR',  895,  1550
  -- Accesorios de lectura (CAT-ACC) — NO papelería de oficina
  UNION ALL SELECT 'JSL-042', NULL, 'Separador magnético Joselito — Set x3', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 85, 175
  UNION ALL SELECT 'JSL-043', NULL, 'Funda transparente para paperback', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 45, 95
  UNION ALL SELECT 'JSL-044', NULL, 'Protector rígido tapa dura', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 120, 250
  UNION ALL SELECT 'JSL-045', NULL, 'Book sleeve — Lino azul', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 180, 350
  UNION ALL SELECT 'JSL-046', NULL, 'Book light LED clip', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 220, 450
  UNION ALL SELECT 'JSL-047', NULL, 'Sujetalibros metálicos — Par', 'LibroSys', 'CAT-ACC', 'ED-PLAN', 350, 690
) AS nuevos
WHERE NOT EXISTS (SELECT 1 FROM productos p WHERE p.codigo = nuevos.codigo);

-- =============================================================================
-- 3) EXISTENCIAS — carga inicial vía sp_inv_registrar_movimiento (idempotente
--    por idempotency_key: reintentar este script no duplica stock).
--    Almacenes base de 12_seed.sql: ALM-CTR=Central, ALM-STI=Santiago,
--    ALM-LRM=La Romana.
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_jsl_seed_carga_inicial$$
CREATE PROCEDURE sp_jsl_seed_carga_inicial()
BEGIN
  DECLARE v_done           INT DEFAULT 0;
  DECLARE v_codigo          VARCHAR(20);
  DECLARE v_almacen_codigo  VARCHAR(20);
  DECLARE v_cantidad        INT UNSIGNED;
  DECLARE v_minimo          INT UNSIGNED;
  DECLARE v_producto_id     INT UNSIGNED;
  DECLARE v_almacen_id      INT UNSIGNED;
  DECLARE v_mov_id          INT UNSIGNED;
  DECLARE v_saldo           INT;
  DECLARE v_replayed        TINYINT(1);

  DECLARE cur_carga CURSOR FOR
    SELECT codigo, almacen_codigo, cantidad, minimo FROM (
      -- Literatura
      SELECT 'JSL-001' AS codigo, 'ALM-CTR' AS almacen_codigo, 30 AS cantidad, 8 AS minimo
      UNION ALL SELECT 'JSL-001','ALM-STI',10,5
      UNION ALL SELECT 'JSL-002','ALM-CTR',25,8
      UNION ALL SELECT 'JSL-003','ALM-CTR',22,6
      UNION ALL SELECT 'JSL-004','ALM-CTR',28,8
      UNION ALL SELECT 'JSL-004','ALM-LRM',9,4
      UNION ALL SELECT 'JSL-005','ALM-CTR',22,8
      UNION ALL SELECT 'JSL-006','ALM-CTR',20,6
      UNION ALL SELECT 'JSL-007','ALM-CTR',24,8
      UNION ALL SELECT 'JSL-008','ALM-CTR',18,6
      UNION ALL SELECT 'JSL-008','ALM-STI',7,3
      UNION ALL SELECT 'JSL-009','ALM-CTR',16,6
      UNION ALL SELECT 'JSL-010','ALM-CTR',19,6
      UNION ALL SELECT 'JSL-011','ALM-CTR',21,6
      UNION ALL SELECT 'JSL-012','ALM-CTR',12,4
      UNION ALL SELECT 'JSL-013','ALM-CTR',15,5
      UNION ALL SELECT 'JSL-014','ALM-CTR',14,5
      UNION ALL SELECT 'JSL-015','ALM-CTR',17,5
      -- Infantil
      UNION ALL SELECT 'JSL-016','ALM-CTR',20,6
      UNION ALL SELECT 'JSL-016','ALM-STI',8,4
      UNION ALL SELECT 'JSL-017','ALM-CTR',24,8
      UNION ALL SELECT 'JSL-017','ALM-STI',15,5
      UNION ALL SELECT 'JSL-018','ALM-CTR',22,7
      UNION ALL SELECT 'JSL-019','ALM-CTR',18,6
      UNION ALL SELECT 'JSL-020','ALM-CTR',16,5
      UNION ALL SELECT 'JSL-021','ALM-CTR',25,8
      UNION ALL SELECT 'JSL-022','ALM-CTR',19,6
      UNION ALL SELECT 'JSL-022','ALM-LRM',8,4
      UNION ALL SELECT 'JSL-023','ALM-CTR',14,5
      UNION ALL SELECT 'JSL-024','ALM-CTR',21,6
      UNION ALL SELECT 'JSL-025','ALM-CTR',15,5
      -- Texto escolar
      UNION ALL SELECT 'JSL-026','ALM-CTR',55,15
      UNION ALL SELECT 'JSL-026','ALM-STI',20,8
      UNION ALL SELECT 'JSL-027','ALM-CTR',50,15
      UNION ALL SELECT 'JSL-028','ALM-CTR',45,12
      UNION ALL SELECT 'JSL-029','ALM-CTR',48,12
      UNION ALL SELECT 'JSL-030','ALM-CTR',35,10
      UNION ALL SELECT 'JSL-030','ALM-LRM',12,5
      UNION ALL SELECT 'JSL-031','ALM-CTR',33,10
      UNION ALL SELECT 'JSL-032','ALM-CTR',40,12
      UNION ALL SELECT 'JSL-033','ALM-CTR',30,10
      UNION ALL SELECT 'JSL-034','ALM-CTR',28,10
      UNION ALL SELECT 'JSL-035','ALM-CTR',24,8
      -- Referencia
      UNION ALL SELECT 'JSL-036','ALM-CTR',12,5
      UNION ALL SELECT 'JSL-037','ALM-CTR',9,4
      UNION ALL SELECT 'JSL-038','ALM-CTR',10,4
      UNION ALL SELECT 'JSL-039','ALM-CTR',6,3
      UNION ALL SELECT 'JSL-040','ALM-CTR',8,4
      UNION ALL SELECT 'JSL-041','ALM-CTR',11,4
      UNION ALL SELECT 'JSL-041','ALM-STI',5,3
      -- Accesorios de lectura
      UNION ALL SELECT 'JSL-042','ALM-CTR',60,15
      UNION ALL SELECT 'JSL-042','ALM-STI',20,5
      UNION ALL SELECT 'JSL-043','ALM-CTR',80,20
      UNION ALL SELECT 'JSL-044','ALM-CTR',35,10
      UNION ALL SELECT 'JSL-045','ALM-CTR',25,8
      UNION ALL SELECT 'JSL-046','ALM-CTR',30,8
      UNION ALL SELECT 'JSL-047','ALM-CTR',18,5
    ) t;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  OPEN cur_carga;
  loop_carga: LOOP
    FETCH cur_carga INTO v_codigo, v_almacen_codigo, v_cantidad, v_minimo;
    IF v_done = 1 THEN
      LEAVE loop_carga;
    END IF;

    SELECT id INTO v_producto_id FROM productos WHERE codigo = v_codigo;
    SELECT id INTO v_almacen_id FROM almacenes WHERE codigo = v_almacen_codigo;

    CALL sp_inv_registrar_movimiento(
      CONCAT('JSL-CARGA:', v_codigo, ':', v_almacen_codigo),
      'recepcion', 'entrada', v_producto_id, v_almacen_id, v_cantidad,
      'seed_carga', 'JSL-CARGA-INICIAL', NULL,
      1, NULL, 'Carga inicial de existencias (seed Joselito)', NULL,
      NULL, 1,
      v_mov_id, v_saldo, v_replayed
    );

    UPDATE inventario
       SET stock_minimo = v_minimo
     WHERE producto_id = v_producto_id AND almacen_id = v_almacen_id;
  END LOOP;
  CLOSE cur_carga;
END$$

DELIMITER ;

CALL sp_jsl_seed_carga_inicial();
DROP PROCEDURE IF EXISTS sp_jsl_seed_carga_inicial;

-- =============================================================================
-- 4) DOCUMENTOS DE EJEMPLO — se generan invocando el mismo API de
--    procedimientos que usaría la aplicación (10_procedimientos.sql), por lo
--    que quedan movimientos de kardex y auditoría reales asociados. Cada
--    documento está protegido por `IF NOT EXISTS (... codigo = ...)` para que
--    reintentar el script no lo vuelva a crear.
--    Usuarios base (12_seed.sql): 1=Ana (admin), 2=Luis (compras),
--    3=María (importaciones).
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_jsl_seed_documentos$$
CREATE PROCEDURE sp_jsl_seed_documentos()
BEGIN
  DECLARE v_alm_ctr INT UNSIGNED;
  DECLARE v_alm_sti INT UNSIGNED;
  DECLARE v_alm_lrm INT UNSIGNED;
  DECLARE v_p001 INT UNSIGNED;
  DECLARE v_p002 INT UNSIGNED;
  DECLARE v_p005 INT UNSIGNED;
  DECLARE v_p016 INT UNSIGNED;
  DECLARE v_p017 INT UNSIGNED;
  DECLARE v_p042 INT UNSIGNED;
  DECLARE v_p044 INT UNSIGNED;

  DECLARE v_trf1_id INT UNSIGNED;
  DECLARE v_trf2_id INT UNSIGNED;
  DECLARE v_cnt1_id INT UNSIGNED;
  DECLARE v_cnt2_id INT UNSIGNED;
  DECLARE v_adj1_id INT UNSIGNED;
  DECLARE v_adj2_id INT UNSIGNED;
  DECLARE v_dsc1_id INT UNSIGNED;
  DECLARE v_dsc2_id INT UNSIGNED;

  DECLARE v_det_p001       INT UNSIGNED;
  DECLARE v_det_p016       INT UNSIGNED;
  DECLARE v_linea_p001     INT UNSIGNED;
  DECLARE v_linea_p002     INT UNSIGNED;
  DECLARE v_teorica_p001   INT;
  DECLARE v_teorica_p002   INT;
  DECLARE v_cnt1_dominio   CHAR(36);
  DECLARE v_adj1_detalle_id INT UNSIGNED;

  DECLARE v_estado  VARCHAR(20);
  DECLARE v_version INT UNSIGNED;
  DECLARE v_lineas  INT UNSIGNED;

  SELECT id INTO v_alm_ctr FROM almacenes WHERE codigo = 'ALM-CTR';
  SELECT id INTO v_alm_sti FROM almacenes WHERE codigo = 'ALM-STI';
  SELECT id INTO v_alm_lrm FROM almacenes WHERE codigo = 'ALM-LRM';
  SELECT id INTO v_p001 FROM productos WHERE codigo = 'JSL-001';
  SELECT id INTO v_p002 FROM productos WHERE codigo = 'JSL-002';
  SELECT id INTO v_p005 FROM productos WHERE codigo = 'JSL-005';
  SELECT id INTO v_p016 FROM productos WHERE codigo = 'JSL-016';
  SELECT id INTO v_p017 FROM productos WHERE codigo = 'JSL-017';
  SELECT id INTO v_p042 FROM productos WHERE codigo = 'JSL-042';
  SELECT id INTO v_p044 FROM productos WHERE codigo = 'JSL-044';

  -- ---------------------------------------------------------------------------
  -- 4.1) Transferencia JSL-TRF-001: Central -> Santiago, ciclo completo
  --      (crear ya como 'solicitada' -> despachar -> recibir completa)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM transferencia WHERE codigo = 'JSL-TRF-001') THEN
    CALL sp_inv_crear_transferencia(
      'JSL-TRF-001', v_alm_ctr, v_alm_sti, 1,
      JSON_ARRAY(
        JSON_OBJECT('producto_id', v_p001, 'cantidad_solicitada', 10),
        JSON_OBJECT('producto_id', v_p016, 'cantidad_solicitada', 5)
      ),
      'Reposición programada de literatura y colección infantil para Santiago',
      1,
      v_trf1_id
    );

    SELECT version INTO v_version FROM transferencia WHERE id = v_trf1_id;
    CALL sp_inv_despachar_transferencia(v_trf1_id, 2, v_version, 'JSL-TRF-001:despacho', v_estado, v_version);

    SELECT id INTO v_det_p001 FROM detalle_transferencia WHERE transferencia_id = v_trf1_id AND producto_id = v_p001;
    SELECT id INTO v_det_p016 FROM detalle_transferencia WHERE transferencia_id = v_trf1_id AND producto_id = v_p016;

    CALL sp_inv_recibir_transferencia(
      v_trf1_id, 3, v_version, 'JSL-TRF-001:recepcion',
      JSON_ARRAY(
        JSON_OBJECT('detalle_id', v_det_p001, 'cantidad_recibida', 10, 'cantidad_faltante', 0, 'cantidad_danada', 0),
        JSON_OBJECT('detalle_id', v_det_p016, 'cantidad_recibida', 5,  'cantidad_faltante', 0, 'cantidad_danada', 0)
      ),
      v_estado, v_version
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.2) Transferencia JSL-TRF-002: Central -> La Romana, queda 'solicitada'
  --      (pendiente de despacho, visible en v_inv_transferencias_activas)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM transferencia WHERE codigo = 'JSL-TRF-002') THEN
    CALL sp_inv_crear_transferencia(
      'JSL-TRF-002', v_alm_ctr, v_alm_lrm, 1,
      JSON_ARRAY(JSON_OBJECT('producto_id', v_p005, 'cantidad_solicitada', 8)),
      'Refuerzo de existencias para feria local en La Romana',
      1,
      v_trf2_id
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.3) + 4.4) Conteo JSL-CNT-001 (ciclo completo, Central, alcance
  --      [JSL-001, JSL-002]) con el sobrante de JSL-002 regularizado mediante
  --      el ajuste JSL-ADJ-001 (tipo 'conteo').
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM conteo_fisico WHERE codigo = 'JSL-CNT-001') THEN
    CALL sp_inv_crear_conteo(
      'JSL-CNT-001', v_alm_ctr, NULL, 'parcial',
      'Conteo cíclico de literatura de alta rotación (Central)', 1,
      JSON_ARRAY(v_p001, v_p002),
      v_cnt1_id
    );

    SELECT version INTO v_version FROM conteo_fisico WHERE id = v_cnt1_id;
    CALL sp_inv_abrir_conteo(v_cnt1_id, v_version, v_estado, v_version, v_lineas);

    SELECT dominio_id INTO v_cnt1_dominio FROM conteo_fisico WHERE id = v_cnt1_id;
    SELECT l.id INTO v_linea_p001 FROM linea_conteo l WHERE l.conteo_id = v_cnt1_id AND l.producto_id = v_p001;
    SELECT l.id INTO v_linea_p002 FROM linea_conteo l WHERE l.conteo_id = v_cnt1_id AND l.producto_id = v_p002;
    SELECT cantidad_teorica INTO v_teorica_p001 FROM snapshot_conteo WHERE conteo_id = v_cnt1_id AND producto_id = v_p001;
    SELECT cantidad_teorica INTO v_teorica_p002 FROM snapshot_conteo WHERE conteo_id = v_cnt1_id AND producto_id = v_p002;

    -- JSL-001 cuadra exacto (contada = teórica); JSL-002 aparece con 3 de más.
    CALL sp_inv_registrar_linea_conteo(v_cnt1_id, v_linea_p001, v_teorica_p001, v_version, v_estado, v_version);
    CALL sp_inv_registrar_linea_conteo(v_cnt1_id, v_linea_p002, v_teorica_p002 + 3, v_version, v_estado, v_version);

    CALL sp_inv_enviar_revision_conteo(v_cnt1_id, v_version, v_estado, v_version);

    CALL sp_inv_clasificar_linea_conteo(v_cnt1_id, v_linea_p001, v_version, 'cuadra', NULL, NULL, v_version);

    CALL sp_inv_crear_ajuste(
      'JSL-ADJ-001', v_alm_ctr, 'conteo', 1,
      JSON_ARRAY(JSON_OBJECT(
        'producto_id', v_p002,
        'cantidad_objetivo', v_teorica_p002 + 3,
        'diferencia', 3,
        'motivo_codigo', 'CONTEO_FISICO',
        'linea_conteo_id', v_linea_p002,
        'observacion', 'Sobrante detectado en conteo JSL-CNT-001'
      )),
      'Regularización de sobrante — conteo cíclico de literatura',
      'conteo_fisico', v_cnt1_id, 1,
      v_adj1_id
    );

    SELECT version INTO v_version FROM ajuste WHERE id = v_adj1_id;
    CALL sp_inv_aprobar_ajuste(v_adj1_id, 2, v_version, v_estado, v_version);
    CALL sp_inv_aplicar_ajuste(v_adj1_id, 2, v_version, 'JSL-ADJ-001:aplicar', v_cnt1_dominio, v_estado, v_version);

    SELECT id INTO v_adj1_detalle_id FROM ajuste_detalle WHERE ajuste_id = v_adj1_id AND producto_id = v_p002;

    SELECT version INTO v_version FROM conteo_fisico WHERE id = v_cnt1_id;
    CALL sp_inv_clasificar_linea_conteo(v_cnt1_id, v_linea_p002, v_version, 'sobrante', 'ajuste', v_adj1_detalle_id, v_version);

    SELECT version INTO v_version FROM conteo_fisico WHERE id = v_cnt1_id;
    CALL sp_inv_cerrar_conteo(v_cnt1_id, v_version, v_estado, v_version);
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.5) Conteo JSL-CNT-002: Santiago, alcance [JSL-016], se deja 'abierto'
  --      (pendiente de captura, visible en v_inv_conteos_abiertos)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM conteo_fisico WHERE codigo = 'JSL-CNT-002') THEN
    CALL sp_inv_crear_conteo(
      'JSL-CNT-002', v_alm_sti, NULL, 'ciclico',
      'Conteo cíclico de literatura infantil (Santiago)', 3,
      JSON_ARRAY(v_p016),
      v_cnt2_id
    );

    SELECT version INTO v_version FROM conteo_fisico WHERE id = v_cnt2_id;
    CALL sp_inv_abrir_conteo(v_cnt2_id, v_version, v_estado, v_version, v_lineas);
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.6) Ajuste JSL-ADJ-002: corrección de digitación, queda 'solicitado'
  --      (pendiente de aprobación, visible en v_inv_ajustes_pendientes)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM ajuste WHERE codigo = 'JSL-ADJ-002') THEN
    CALL sp_inv_crear_ajuste(
      'JSL-ADJ-002', v_alm_ctr, 'digitacion', 2,
      JSON_ARRAY(JSON_OBJECT(
        'producto_id', v_p042,
        'cantidad_objetivo', 115,
        'diferencia', -5,
        'motivo_codigo', 'ERROR_DIGITACION',
        'observacion', 'Se digitó 120 en vez de 115 durante la carga inicial'
      )),
      'Corrección de cantidad mal capturada al recibir mercancía',
      NULL, NULL, 1,
      v_adj2_id
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.7) Descarte JSL-DSC-001: producto dañado en Central, ciclo completo
  --      hasta aplicado (solicitante distinto del aprobador)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM descarte WHERE codigo = 'JSL-DSC-001') THEN
    CALL sp_inv_crear_descarte(
      'JSL-DSC-001', v_alm_ctr, 1,
      JSON_ARRAY(JSON_OBJECT(
        'producto_id', v_p044,
        'cantidad', 3,
        'motivo_codigo', 'DANO_FISICO',
        'observacion', 'Cuadernos con encuadernación dañada por manipulación en bodega'
      )),
      'Descarte de accesorios de lectura dañados',
      NULL, NULL, NULL, 1,
      v_dsc1_id
    );

    SELECT version INTO v_version FROM descarte WHERE id = v_dsc1_id;
    CALL sp_inv_aprobar_descarte(v_dsc1_id, 2, v_version, v_estado, v_version);
    CALL sp_inv_aplicar_descarte(v_dsc1_id, 2, v_version, 'JSL-DSC-001:aplicar', NULL, v_estado, v_version);
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4.8) Descarte JSL-DSC-002: producto con humedad en Santiago, queda
  --      'solicitado' (pendiente de aprobación, visible en
  --      v_inv_descartes_pendientes)
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM descarte WHERE codigo = 'JSL-DSC-002') THEN
    CALL sp_inv_crear_descarte(
      'JSL-DSC-002', v_alm_sti, 3,
      JSON_ARRAY(JSON_OBJECT(
        'producto_id', v_p017,
        'cantidad', 2,
        'motivo_codigo', 'HUMEDAD',
        'observacion', 'Ejemplares con manchas de humedad detectados en revisión de anaquel'
      )),
      'Descarte de literatura infantil con daño por humedad',
      NULL, NULL, NULL, 1,
      v_dsc2_id
    );
  END IF;
END$$

DELIMITER ;

CALL sp_jsl_seed_documentos();
DROP PROCEDURE IF EXISTS sp_jsl_seed_documentos;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '13_seed_joselito.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 13_seed_joselito.sql aplicado.' AS resultado;
