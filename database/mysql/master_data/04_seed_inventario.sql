-- =============================================================================
-- LibroSys — MASTER DATA
-- Archivo: 04_seed_inventario.sql
-- Stock inicial coherente por sucursal/almacén + movimientos de apertura.
-- =============================================================================

USE librosys;
SET NAMES utf8mb4;

-- Asegurar almacén tránsito / tercero si hace falta (opcional)
INSERT INTO almacenes (id, sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES
(1, 1, 'ALM-CTR', 'Almacén Central', 'central', 50000, 'activo'),
(2, 2, 'ALM-STI', 'Almacén Santiago', 'sucursal', 15000, 'activo')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), estado = VALUES(estado);

INSERT INTO sucursales (id, codigo, nombre, ciudad, direccion, telefono, estado) VALUES
(1, 'SUC-SD', 'Sucursal Santo Domingo', 'Santo Domingo', 'Av. Winston Churchill', '809-555-3001', 'activa'),
(2, 'SUC-STG', 'Sucursal Santiago', 'Santiago', 'Calle del Sol', '809-555-3002', 'activa')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), ciudad = VALUES(ciudad), estado = VALUES(estado);

-- Stock: todos los productos activos en Central; subset en Santiago
INSERT INTO inventario (producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock)
SELECT p.id, 1,
  CASE
    WHEN p.categoria_id = 4 THEN 40
    WHEN p.categoria_id = 8 THEN 60
    WHEN p.categoria_id = 6 THEN 15
    ELSE 25
  END,
  CASE WHEN p.categoria_id IN (4, 8) THEN 10 ELSE 5 END,
  CONCAT('Pasillo ', CHAR(64 + ((p.id - 1) % 6) + 1), ' · Estante ', ((p.id - 1) DIV 6) + 1),
  'normal'
FROM productos p
WHERE p.estado = 'activo'
ON DUPLICATE KEY UPDATE
  stock = VALUES(stock),
  stock_minimo = VALUES(stock_minimo),
  ubicacion = VALUES(ubicacion),
  estado_stock = VALUES(estado_stock);

INSERT INTO inventario (producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock)
SELECT p.id, 2,
  CASE WHEN p.categoria_id IN (1, 2, 4) THEN 12 ELSE 6 END,
  3,
  CONCAT('Zona B · Rack ', ((p.id - 1) % 4) + 1),
  'normal'
FROM productos p
WHERE p.estado = 'activo' AND p.id <= 40
ON DUPLICATE KEY UPDATE
  stock = VALUES(stock),
  stock_minimo = VALUES(stock_minimo),
  ubicacion = VALUES(ubicacion);

-- Movimientos iniciales de apertura (una vez por producto en Central)
INSERT INTO movimiento_inventario (
  producto_id, almacen_id, usuario_id, tipo_movimiento, cantidad, saldo_posterior,
  referencia, referencia_tipo, observaciones
)
SELECT i.producto_id, i.almacen_id, 1, 'entrada', i.stock, i.stock,
  'APERTURA-MD', 'master_data', 'Carga inicial Master Data Librería Joselito'
FROM inventario i
WHERE i.almacen_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM movimiento_inventario m
    WHERE m.producto_id = i.producto_id
      AND m.almacen_id = i.almacen_id
      AND m.referencia = 'APERTURA-MD'
  );

SELECT 'MASTER-DATA :: 04_seed_inventario.sql aplicado.' AS resultado;
