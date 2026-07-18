-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 00_VERSION.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Paquete de esquema MySQL 8 definitivo para el módulo Inventario de LibroSys.
-- Sustituye 22_conteo_fisico_dominio.sql, 23_descarte_dominio.sql,
-- 24_descarte_documento.sql, 25_inventario_seed_joselito.sql y
-- 26_inventario_views_procs.sql con un modelo alineado 1:1 al dominio DDD del
-- backend (backend/src/modules/inventario) — agregados Ajuste, ConteoFisico,
-- Descarte, Transferencia y las entidades Existencia/MovimientoInventario/
-- Kardex/AuditoriaMovimiento — sin modificar una sola línea de TypeScript.
--
-- Convención de ids: cada tabla-documento conserva su PRIMARY KEY INT
-- AUTO_INCREMENT (compatibilidad con las FKs enteras del resto del ERP:
-- productos, almacenes, usuarios, sucursales) y añade `dominio_id CHAR(36)
-- NULL UNIQUE` para poder enlazar, si se requiere, el identificador UUID que
-- generan los Application Services del backend (IIdGenerator) sin romper esas
-- FKs enteras.
--
-- Esta tabla de versión registra cada script del paquete a medida que se
-- ejecuta (columna script_name es UNIQUE), de modo que el paquete completo es
-- reproducible y auditable.
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS inventario_schema_version (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  version       VARCHAR(20)  NOT NULL,
  script_name   VARCHAR(100) NOT NULL,
  checksum      VARCHAR(64)  NULL,
  applied_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inv_schema_version_script (script_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventario_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '00_VERSION.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 00_VERSION.sql aplicado.' AS resultado;
