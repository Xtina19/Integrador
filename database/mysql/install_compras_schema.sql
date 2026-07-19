-- =============================================================================
-- LibroSys — Compras DEFINITIVO (solo esquema, sin seed)
-- Archivo: install_compras_schema.sql
-- Usar en install_all.sql antes de 06_importaciones.sql.
-- Seed: compras_definitivo/11_seed_joselito.sql (después de 12_seed.sql).
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

SELECT 'COM-DB-1.0.1 :: Esquema Compras instalado (sin seed).' AS resultado;
