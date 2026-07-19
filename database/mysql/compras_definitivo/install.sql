-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: install.sql
-- Versión: COM-DB-1.0.0  |  Fecha: 2026-07-19
--
-- Instalador del paquete definitivo del módulo Compras.
--
-- USO — ejecutar DESDE esta carpeta (database/mysql/compras_definitivo):
--   cd database/mysql/compras_definitivo
--   mysql -u root -p librosys < install.sql
--
-- Prerrequisitos:
--   - Esquema base LibroSys (01_database.sql .. 12_seed.sql)
--   - 05_inventario.sql (tabla productos) aplicado
--   - Opcional: 06_importaciones.sql (añade FKs recepcion → FI/embarque)
--
-- Si prefiere ejecutar desde database/mysql, use
-- install_compras_definitivo.sql en su lugar.
-- =============================================================================

USE librosys;

SOURCE 00_VERSION.sql;
SOURCE 01_cleanup.sql;
SOURCE 02_condiciones_pago.sql;
SOURCE 03_numeracion_documentos.sql;
SOURCE 04_orden_compra.sql;
SOURCE 05_detalle_orden_compra.sql;
SOURCE 06_recepcion.sql;
SOURCE 07_detalle_recepcion.sql;
SOURCE 08_factura_proveedor.sql;
SOURCE 09_detalle_factura_proveedor.sql;
SOURCE 10_indices.sql;
SOURCE 11_seed_joselito.sql;

SELECT 'COM-DB-1.0.0 :: Paquete Compras DEFINITIVO instalado correctamente.' AS resultado;
