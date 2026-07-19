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

-- Esquema Compras DEFINITIVO (COM-DB-1.0.0) — requiere productos de 05_inventario
SOURCE install_compras_schema.sql;

SOURCE 06_importaciones.sql;
SOURCE 07_ventas.sql;
SOURCE 08_transferencias.sql;
SOURCE 09_eventos.sql;
SOURCE 10_configuracion.sql;
SOURCE 11_auditoria.sql;
SOURCE 12_seed.sql;

-- Seed Compras Joselito (tras maestros/productos/usuarios de 12_seed)
SOURCE compras_definitivo/11_seed_joselito.sql;
-- Bridge Importaciones (FI/embarque/recepción INT) — requiere OC id 4 del seed anterior
SOURCE compras_definitivo/12_seed_importaciones_bridge.sql;

-- Master Data oficial (catálogo único compartido por todos los módulos)
SOURCE master_data/install.sql;

SOURCE 13_views.sql;
SOURCE 14_procedimientos.sql;
SOURCE 15_triggers.sql;
SOURCE 16_indices.sql;
SOURCE 17_eventos_facturacion.sql;
SOURCE 18_modulos_extendidos.sql;
SOURCE 19_vistas_eventos.sql;
SOURCE 20_triggers_eventos.sql;
SOURCE 21_seed_v2.sql;

SOURCE install_inventario_definitivo.sql;
SOURCE install_ventas_definitivo.sql;

SELECT 'LibroSys MySQL v2 instalado correctamente.' AS resultado;
