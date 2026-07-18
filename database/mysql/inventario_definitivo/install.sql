-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: install.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Instalador del paquete definitivo del módulo Inventario.
--
-- USO — ejecutar DESDE esta carpeta (database/mysql/inventario_definitivo):
--   cd database/mysql/inventario_definitivo
--   mysql -u root -p librosys < install.sql
--
-- Prerrequisito: el esquema base de LibroSys (database/mysql/01_database.sql
-- .. 21_seed_v2.sql, típicamente vía database/mysql/install_all.sql hasta
-- antes de 22_conteo_fisico_dominio.sql) debe estar aplicado, ya que este
-- paquete ALTERa `productos`, `inventario`, `almacenes`, `movimiento_inventario`
-- y `transferencia` creados allí.
--
-- Si prefiere ejecutar desde la carpeta database/mysql sin cambiar de
-- directorio, use `database/mysql/install_inventario_definitivo.sql` en su
-- lugar (mismo contenido, con las rutas ya prefijadas con
-- `inventario_definitivo/`).
-- =============================================================================

SOURCE 00_VERSION.sql;
SOURCE 01_cleanup_redundante.sql;
SOURCE 02_catalogos.sql;
SOURCE 03_existencias_movimientos.sql;
SOURCE 04_transferencias.sql;
SOURCE 05_ajustes.sql;
SOURCE 06_conteos.sql;
SOURCE 07_descartes.sql;
SOURCE 08_auditoria_idempotencia.sql;
SOURCE 09_funciones.sql;
SOURCE 10_procedimientos.sql;
SOURCE 11_triggers.sql;
SOURCE 12_vistas_indices.sql;
SOURCE 13_seed_joselito.sql;

SELECT 'INV-DB-1.0.0 :: Paquete Inventario DEFINITIVO instalado correctamente.' AS resultado;
