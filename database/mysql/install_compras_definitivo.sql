-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: install_compras_definitivo.sql
-- Versión: COM-DB-1.0.0  |  Fecha: 2026-07-19
--
-- USO (desde database/mysql):
--   mysql -u root -p librosys < install_compras_definitivo.sql
--
-- Prerrequisito: install_all.sql base (01-12) y 05_inventario.sql.
-- =============================================================================

USE librosys;

SOURCE compras_definitivo/00_VERSION.sql;
SOURCE compras_definitivo/01_cleanup.sql;
SOURCE compras_definitivo/02_condiciones_pago.sql;
SOURCE compras_definitivo/03_numeracion_documentos.sql;
SOURCE compras_definitivo/04_orden_compra.sql;
SOURCE compras_definitivo/05_detalle_orden_compra.sql;
SOURCE compras_definitivo/06_recepcion.sql;
SOURCE compras_definitivo/07_detalle_recepcion.sql;
SOURCE compras_definitivo/08_factura_proveedor.sql;
SOURCE compras_definitivo/09_detalle_factura_proveedor.sql;
SOURCE compras_definitivo/10_indices.sql;
SOURCE compras_definitivo/13_integridad_fase8.sql;
SOURCE compras_definitivo/11_seed_joselito.sql;

SELECT 'COM-DB-1.0.1 :: Paquete Compras DEFINITIVO instalado correctamente.' AS resultado;
