-- =============================================================================
-- LibroSys — Compras (legado)
-- Archivo: 04_compras.sql
--
-- DEPRECATED desde COM-DB-1.0.0 (2026-07-19).
-- El esquema canónico vive en database/mysql/compras_definitivo/
-- y se instala con install_compras_definitivo.sql (tras 05_inventario.sql).
--
-- Este archivo se conserva vacío a propósito para no romper scripts que
-- aún hacen SOURCE 04_compras.sql.
-- Canónico en install_all: install_compras_schema.sql + seed Joselito.
-- =============================================================================

USE librosys;

SELECT '04_compras.sql :: DEPRECATED — usar install_compras_schema.sql / compras_definitivo (COM-DB-1.0.0).' AS aviso;
