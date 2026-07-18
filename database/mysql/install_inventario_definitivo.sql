-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: install_inventario_definitivo.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Instalador del paquete definitivo del módulo Inventario, pensado para
-- ejecutarse DESDE database/mysql (misma carpeta que install_all.sql), sin
-- necesidad de cambiar de directorio hacia inventario_definitivo/.
--
-- USO:
--   cd database/mysql
--   mysql -u root -p librosys < install_inventario_definitivo.sql
--
-- Equivalente a `inventario_definitivo/install.sql`, con cada SOURCE
-- prefijado por la subcarpeta correspondiente.
-- =============================================================================

USE librosys;

SOURCE inventario_definitivo/00_VERSION.sql;
SOURCE inventario_definitivo/01_cleanup_redundante.sql;
SOURCE inventario_definitivo/02_catalogos.sql;
SOURCE inventario_definitivo/03_existencias_movimientos.sql;
SOURCE inventario_definitivo/04_transferencias.sql;
SOURCE inventario_definitivo/05_ajustes.sql;
SOURCE inventario_definitivo/06_conteos.sql;
SOURCE inventario_definitivo/07_descartes.sql;
SOURCE inventario_definitivo/08_auditoria_idempotencia.sql;
SOURCE inventario_definitivo/09_funciones.sql;
SOURCE inventario_definitivo/10_procedimientos.sql;
SOURCE inventario_definitivo/11_triggers.sql;
SOURCE inventario_definitivo/12_vistas_indices.sql;
SOURCE inventario_definitivo/13_seed_joselito.sql;

SELECT 'INV-DB-1.0.0 :: Paquete Inventario DEFINITIVO instalado correctamente.' AS resultado;
