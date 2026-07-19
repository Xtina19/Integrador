-- =============================================================================
-- LibroSys — MASTER DATA — instalador
-- =============================================================================

USE librosys;

SOURCE 01_alter_productos_master.sql;
SOURCE 02_seed_catalogos.sql;
SOURCE 03_seed_productos.sql;
SOURCE 04_seed_inventario.sql;

SELECT 'MASTER-DATA :: Catálogo oficial LibroSys instalado.' AS resultado;
