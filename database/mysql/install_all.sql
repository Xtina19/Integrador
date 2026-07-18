-- =============================================================================
-- LibroSys — Instalación completa
-- Ejecutar desde la carpeta database/mysql:
--   mysql -u root -p < install_all.sql
-- =============================================================================

SOURCE 01_database.sql;
SOURCE 02_seguridad.sql;
SOURCE 03_administracion.sql;
SOURCE 04_compras.sql;
SOURCE 05_inventario.sql;
SOURCE 06_importaciones.sql;
SOURCE 07_ventas.sql;
SOURCE 08_transferencias.sql;
SOURCE 09_eventos.sql;
SOURCE 10_configuracion.sql;
SOURCE 11_auditoria.sql;
SOURCE 12_seed.sql;
SOURCE 13_views.sql;
SOURCE 14_procedimientos.sql;
SOURCE 15_triggers.sql;
SOURCE 16_indices.sql;
SOURCE 17_eventos_facturacion.sql;
SOURCE 18_modulos_extendidos.sql;
SOURCE 19_vistas_eventos.sql;
SOURCE 20_triggers_eventos.sql;
SOURCE 21_seed_v2.sql;

-- -----------------------------------------------------------------------------
-- Módulo Inventario — paquete DEFINITIVO (INV-DB-1.0.0, 2026-07-18).
-- Reemplaza a 22_conteo_fisico_dominio.sql .. 26_inventario_views_procs.sql
-- (archivados en database/mysql/archive/, marcados DEPRECATED in situ).
-- Ver database/mysql/inventario_definitivo/install.sql para instalarlo de
-- forma independiente, o database/mysql/install_inventario_definitivo.sql
-- para la variante ejecutable directamente desde esta carpeta.
-- -----------------------------------------------------------------------------
SOURCE install_inventario_definitivo.sql;

SELECT 'LibroSys MySQL v2 instalado correctamente.' AS resultado;
