-- =============================================================================
-- LibroSys — MASTER DATA
-- Archivo: 03_seed_productos.sql
-- Catálogo único de productos (libros, mangas, cómics, accesorios de lectura).
-- SIN papelería. IDs 1–22 se actualizan (compatibles con Compras/Ventas).
-- =============================================================================

USE librosys;
SET NAMES utf8mb4;

-- Actualizar productos existentes (maestro Compras) con attrs master
UPDATE productos SET
  codigo_barras = CONCAT('750', LPAD(id, 10, '0')),
  idioma = 'es', pais_origen = 'España', moneda_compra_id = 1,
  costo_promedio = costo, subcategoria = 'Novela',
  peso_kg = 0.450, dimensiones = '13x20x3 cm'
WHERE id BETWEEN 1 AND 22;

UPDATE productos SET subcategoria = 'Infantil', categoria_id = 2, editorial_id = 2, peso_kg = 0.220 WHERE id = 4;
UPDATE productos SET subcategoria = 'Desarrollo personal', categoria_id = 7, editorial_id = 15 WHERE id = 5;
UPDATE productos SET subcategoria = 'Negocios', categoria_id = 5, editorial_id = 9 WHERE id = 6;
UPDATE productos SET subcategoria = 'Programación', categoria_id = 6, editorial_id = 10, idioma = 'en', pais_origen = 'USA', moneda_compra_id = 2, peso_kg = 0.780 WHERE id = 7;
UPDATE productos SET subcategoria = 'Juvenil', categoria_id = 2, editorial_id = 17 WHERE id = 8;
UPDATE productos SET subcategoria = 'Manga', categoria_id = 4, editorial_id = 4, pais_origen = 'Japón', peso_kg = 0.180, dimensiones = '11x17x2 cm' WHERE id BETWEEN 9 AND 15;
UPDATE productos SET subcategoria = 'Novela', categoria_id = 1, editorial_id = 3, idioma = 'es', pais_origen = 'UK' WHERE id = 16;
UPDATE productos SET subcategoria = 'Novela', categoria_id = 1, editorial_id = 1 WHERE id = 17;
UPDATE productos SET subcategoria = 'Novela', categoria_id = 1, editorial_id = 6 WHERE id = 18;
UPDATE productos SET subcategoria = 'Novela', categoria_id = 1, editorial_id = 2 WHERE id = 19;
UPDATE productos SET subcategoria = 'Ensayo', categoria_id = 3, editorial_id = 10, idioma = 'es', pais_origen = 'Israel' WHERE id = 20;
UPDATE productos SET subcategoria = 'Ensayo', categoria_id = 1, editorial_id = 11 WHERE id = 21;
UPDATE productos SET subcategoria = 'Novela', categoria_id = 1, editorial_id = 3, pais_origen = 'Japón' WHERE id = 22;

-- Nuevos productos (23+)
INSERT INTO productos (
  id, codigo, isbn, codigo_barras, titulo, autor, idioma, pais_origen,
  categoria_id, subcategoria, editorial_id, moneda_compra_id,
  costo, costo_promedio, precio, peso_kg, dimensiones, estado
) VALUES
-- Literatura / novelas
(23, 'PRD-023', '9788466338046', '7500000000023', 'La Casa de los Espíritus', 'Isabel Allende', 'es', 'Chile', 1, 'Novela', 2, 1, 410.0000, 410.0000, 780.00, 0.480, '13x20x3 cm', 'activo'),
(24, 'PRD-024', '9788490627631', '7500000000024', 'Orgullo y prejuicio', 'Jane Austen', 'es', 'UK', 1, 'Novela', 3, 1, 320.0000, 320.0000, 620.00, 0.350, '12x19x2 cm', 'activo'),
(25, 'PRD-025', '9788420471839', '7500000000025', 'La tregua', 'Mario Benedetti', 'es', 'Uruguay', 1, 'Novela', 1, 1, 280.0000, 280.0000, 540.00, 0.280, '12x18x2 cm', 'activo'),
(26, 'PRD-026', '9788466340162', '7500000000026', 'El alquimista', 'Paulo Coelho', 'es', 'Brasil', 1, 'Novela', 2, 1, 300.0000, 300.0000, 580.00, 0.300, '12x19x2 cm', 'activo'),
(27, 'PRD-027', '9788498381498', '7500000000027', 'Harry Potter y la cámara secreta', 'J.K. Rowling', 'es', 'UK', 2, 'Juvenil', 17, 1, 460.0000, 460.0000, 870.00, 0.520, '13x20x3 cm', 'activo'),
-- Infantil
(28, 'PRD-028', '9788413140018', '7500000000028', 'Matilda', 'Roald Dahl', 'es', 'UK', 2, 'Infantil', 16, 1, 340.0000, 340.0000, 650.00, 0.320, '13x20x2 cm', 'activo'),
(29, 'PRD-029', '9788413141121', '7500000000029', 'Charlie y la fábrica de chocolate', 'Roald Dahl', 'es', 'UK', 2, 'Infantil', 16, 1, 340.0000, 340.0000, 650.00, 0.320, '13x20x2 cm', 'activo'),
-- Universitario / técnico
(30, 'PRD-030', '9786071505330', '7500000000030', 'Cálculo de una variable', 'James Stewart', 'es', 'USA', 3, 'Universitario', 8, 1, 1200.0000, 1200.0000, 2250.00, 1.200, '20x25x4 cm', 'activo'),
(31, 'PRD-031', '9786076228654', '7500000000031', 'Fundamentos de marketing', 'Philip Kotler', 'es', 'USA', 3, 'Universitario', 3, 1, 980.0000, 980.0000, 1850.00, 0.900, '18x24x3 cm', 'activo'),
-- Programación
(32, 'PRD-032', '9780134685991', '7500000000032', 'Effective Java', 'Joshua Bloch', 'en', 'USA', 6, 'Programación', 10, 2, 45.0000, 45.0000, 85.00, 0.700, '18x23x3 cm', 'activo'),
(33, 'PRD-033', '9781491950357', '7500000000033', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'en', 'USA', 6, 'Programación', 10, 2, 42.0000, 42.0000, 79.00, 0.850, '18x23x3 cm', 'activo'),
-- Negocios / desarrollo personal
(34, 'PRD-034', '9788417672249', '7500000000034', 'El poder del ahora', 'Eckhart Tolle', 'es', 'Canadá', 7, 'Desarrollo personal', 15, 1, 480.0000, 480.0000, 920.00, 0.360, '13x20x2 cm', 'activo'),
(35, 'PRD-035', '9788499082004', '7500000000035', 'Los 7 hábitos de la gente altamente efectiva', 'Stephen R. Covey', 'es', 'USA', 7, 'Desarrollo personal', 3, 1, 520.0000, 520.0000, 980.00, 0.500, '14x21x3 cm', 'activo'),
(36, 'PRD-036', '9788411001236', '7500000000036', 'Think and Grow Rich', 'Napoleon Hill', 'es', 'USA', 5, 'Negocios', 15, 1, 390.0000, 390.0000, 750.00, 0.400, '13x20x2 cm', 'activo'),
-- Manga adicionales
(37, 'PRD-037', '9788411610247', '7500000000037', 'One Piece Vol. 2', 'Eiichiro Oda', 'es', 'Japón', 4, 'Manga', 4, 1, 220.0000, 220.0000, 425.00, 0.180, '11x17x2 cm', 'activo'),
(38, 'PRD-038', '9781974722877', '7500000000038', 'Demon Slayer Vol. 1', 'Koyoharu Gotouge', 'es', 'Japón', 4, 'Manga', 4, 1, 240.0000, 240.0000, 450.00, 0.180, '11x17x2 cm', 'activo'),
(39, 'PRD-039', '9788416051731', '7500000000039', 'Attack on Titan Vol. 1', 'Hajime Isayama', 'es', 'Japón', 4, 'Manga', 5, 1, 250.0000, 250.0000, 480.00, 0.190, '11x17x2 cm', 'activo'),
-- Cómics Marvel / DC (Panini)
(40, 'PRD-040', '9788413348503', '7500000000040', 'Amazing Spider-Man Vol. 1', 'Stan Lee / Steve Ditko', 'es', 'USA', 4, 'Marvel', 4, 1, 380.0000, 380.0000, 720.00, 0.250, '17x26x1 cm', 'activo'),
(41, 'PRD-041', '9788413348510', '7500000000041', 'Avengers: Infinity Gauntlet', 'Jim Starlin', 'es', 'USA', 4, 'Marvel', 4, 1, 420.0000, 420.0000, 790.00, 0.300, '17x26x2 cm', 'activo'),
(42, 'PRD-042', '9788413348602', '7500000000042', 'Batman: Año Uno', 'Frank Miller', 'es', 'USA', 4, 'DC', 4, 1, 400.0000, 400.0000, 760.00, 0.280, '17x26x1 cm', 'activo'),
(43, 'PRD-043', '9788413348619', '7500000000043', 'Watchmen', 'Alan Moore', 'es', 'USA', 4, 'DC', 4, 1, 520.0000, 520.0000, 980.00, 0.450, '17x26x2 cm', 'activo'),
-- Arte / ilustrados
(44, 'PRD-044', '9783836554749', '7500000000044', 'The Marvel Age of Comics 1961–1978', 'Taschen Editors', 'en', 'Alemania', 4, 'Arte cómic', 20, 3, 28.0000, 28.0000, 55.00, 1.100, '24x32x3 cm', 'activo'),
(45, 'PRD-045', '9780241381984', '7500000000045', 'Knowledge Encyclopedia', 'DK', 'en', 'UK', 2, 'Infantil', 19, 3, 22.0000, 22.0000, 42.00, 1.400, '24x30x3 cm', 'activo'),
-- Accesorios de lectura (NO papelería)
(46, 'PRD-046', NULL, '7500000000046', 'Separador magnético Joselito — Set x3', 'LibroSys', 'es', 'República Dominicana', 8, 'Separadores', 2, 1, 85.0000, 85.0000, 175.00, 0.050, '5x15x1 cm', 'activo'),
(47, 'PRD-047', NULL, '7500000000047', 'Funda transparente para paperback', 'LibroSys', 'es', 'República Dominicana', 8, 'Fundas', 2, 1, 45.0000, 45.0000, 95.00, 0.030, '14x21x0.2 cm', 'activo'),
(48, 'PRD-048', NULL, '7500000000048', 'Protector rígido tapa dura', 'LibroSys', 'es', 'China', 8, 'Protectores', 2, 1, 120.0000, 120.0000, 250.00, 0.120, '16x24x2 cm', 'activo'),
(49, 'PRD-049', NULL, '7500000000049', 'Book sleeve — Lino azul', 'LibroSys', 'es', 'República Dominicana', 8, 'Book sleeves', 2, 1, 180.0000, 180.0000, 350.00, 0.100, '20x28x1 cm', 'activo'),
(50, 'PRD-050', NULL, '7500000000050', 'Book light LED clip', 'LibroSys', 'es', 'China', 8, 'Book lights', 2, 1, 220.0000, 220.0000, 450.00, 0.080, '8x3x2 cm', 'activo'),
(51, 'PRD-051', NULL, '7500000000051', 'Sujetalibros metálicos — Par', 'LibroSys', 'es', 'China', 8, 'Sujetalibros', 2, 1, 350.0000, 350.0000, 690.00, 0.800, '12x15x10 cm', 'activo'),
(52, 'PRD-052', NULL, '7500000000052', 'Separador de cuero Joselito', 'LibroSys', 'es', 'República Dominicana', 8, 'Separadores', 2, 1, 95.0000, 95.0000, 195.00, 0.040, '3x18x0.3 cm', 'activo')
ON DUPLICATE KEY UPDATE
  isbn = VALUES(isbn), codigo_barras = VALUES(codigo_barras), titulo = VALUES(titulo),
  autor = VALUES(autor), idioma = VALUES(idioma), pais_origen = VALUES(pais_origen),
  categoria_id = VALUES(categoria_id), subcategoria = VALUES(subcategoria),
  editorial_id = VALUES(editorial_id), moneda_compra_id = VALUES(moneda_compra_id),
  costo = VALUES(costo), costo_promedio = VALUES(costo_promedio), precio = VALUES(precio),
  peso_kg = VALUES(peso_kg), dimensiones = VALUES(dimensiones), estado = VALUES(estado);

-- Asegurar títulos/costos/precios de 1–22 coherentes (maestro Compras)
UPDATE productos SET titulo='Cien años de soledad', autor='Gabriel García Márquez', costo=485.0000, costo_promedio=485.0000, precio=895.00, categoria_id=1, editorial_id=2 WHERE id=1;
UPDATE productos SET titulo='La sombra del viento', autor='Carlos Ruiz Zafón', costo=420.0000, costo_promedio=420.0000, precio=780.00 WHERE id=2;
UPDATE productos SET titulo='Don Quijote de la Mancha', autor='Miguel de Cervantes', costo=520.0000, costo_promedio=520.0000, precio=950.00, categoria_id=1, editorial_id=7 WHERE id=3;
UPDATE productos SET titulo='El Principito', autor='Antoine de Saint-Exupéry', costo=280.0000, costo_promedio=280.0000, precio=550.00 WHERE id=4;
UPDATE productos SET titulo='Hábitos Atómicos', autor='James Clear', costo=610.0000, costo_promedio=610.0000, precio=1150.00 WHERE id=5;
UPDATE productos SET titulo='Padre Rico Padre Pobre', autor='Robert T. Kiyosaki', costo=540.0000, costo_promedio=540.0000, precio=990.00 WHERE id=6;
UPDATE productos SET titulo='Clean Code', autor='Robert C. Martin', costo=980.0000, costo_promedio=980.0000, precio=1850.00 WHERE id=7;
UPDATE productos SET titulo='Harry Potter y la piedra filosofal', autor='J.K. Rowling', costo=450.0000, costo_promedio=450.0000, precio=850.00 WHERE id=8;
UPDATE productos SET titulo='One Piece Vol. 1', autor='Eiichiro Oda', costo=220.0000, costo_promedio=220.0000, precio=425.00 WHERE id=9;
UPDATE productos SET titulo='Naruto Vol. 1', autor='Masashi Kishimoto', costo=220.0000, costo_promedio=220.0000, precio=425.00 WHERE id=10;
UPDATE productos SET titulo='Jujutsu Kaisen Vol. 1', autor='Gege Akutami', costo=240.0000, costo_promedio=240.0000, precio=450.00 WHERE id=11;
UPDATE productos SET titulo='Chainsaw Man Vol. 1', autor='Tatsuki Fujimoto', costo=240.0000, costo_promedio=240.0000, precio=450.00 WHERE id=12;
UPDATE productos SET titulo='Spy x Family Vol. 1', autor='Tatsuya Endo', costo=230.0000, costo_promedio=230.0000, precio=440.00 WHERE id=13;
UPDATE productos SET titulo='Blue Lock Vol. 1', autor='Muneyuki Kaneshiro', costo=235.0000, costo_promedio=235.0000, precio=445.00 WHERE id=14;
UPDATE productos SET titulo='Berserk Vol. 1', autor='Kentaro Miura', costo=380.0000, costo_promedio=380.0000, precio=720.00 WHERE id=15;
UPDATE productos SET titulo='1984', autor='George Orwell', costo=310.0000, costo_promedio=310.0000, precio=595.00 WHERE id=16;

SELECT 'MASTER-DATA :: 03_seed_productos.sql aplicado.' AS resultado;
