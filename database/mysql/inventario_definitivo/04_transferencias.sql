-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 04_transferencias.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- ALTERa `transferencia` y `detalle_transferencia` para alinearlas al
-- agregado Transferencia del dominio (EstadoTransferencia, version,
-- dominio_id, cantidadDespachada/Faltante/Danada).
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- 1) transferencia.estado — migrar datos ANTES de estrechar el ENUM
--    Legado: solicitada|aprobada|en_transito|recibida|finalizada|cancelada
--    Dominio: borrador|solicitada|en_transito|recibida_parcial|recibida|cancelada
--    Mapeo:  aprobada -> solicitada ; finalizada -> recibida
-- -----------------------------------------------------------------------------
UPDATE transferencia SET estado = 'solicitada' WHERE estado = 'aprobada';
UPDATE transferencia SET estado = 'recibida'   WHERE estado = 'finalizada';

ALTER TABLE transferencia
  MODIFY COLUMN estado ENUM(
    'borrador','solicitada','en_transito','recibida_parcial','recibida','cancelada'
  ) NOT NULL DEFAULT 'borrador';

ALTER TABLE transferencia
  ADD COLUMN version    INT UNSIGNED NOT NULL DEFAULT 1 AFTER observaciones,
  ADD COLUMN dominio_id  CHAR(36)     NULL AFTER version,
  ADD UNIQUE KEY uk_transferencia_dominio_id (dominio_id);

-- -----------------------------------------------------------------------------
-- 2) detalle_transferencia — renombrar cantidad_enviada -> cantidad_despachada
--    y añadir cantidad_faltante / cantidad_danada (recepción parcial/dañada).
-- -----------------------------------------------------------------------------
ALTER TABLE detalle_transferencia
  DROP CHECK chk_detalle_transferencia_cantidades;

ALTER TABLE detalle_transferencia
  CHANGE COLUMN cantidad_enviada cantidad_despachada INT UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE detalle_transferencia
  ADD COLUMN cantidad_faltante INT UNSIGNED NOT NULL DEFAULT 0 AFTER cantidad_recibida,
  ADD COLUMN cantidad_danada   INT UNSIGNED NOT NULL DEFAULT 0 AFTER cantidad_faltante,
  ADD COLUMN dominio_id        CHAR(36)     NULL AFTER cantidad_danada,
  ADD UNIQUE KEY uk_detalle_transferencia_dominio_id (dominio_id);

-- Regla del agregado Transferencia.recibir(): recibida + faltante + dañada no
-- puede superar lo despachado, y lo despachado no puede superar lo solicitado.
ALTER TABLE detalle_transferencia
  ADD CONSTRAINT chk_detalle_transferencia_cantidades CHECK (
    cantidad_solicitada > 0
    AND cantidad_despachada <= cantidad_solicitada
    AND (cantidad_recibida + cantidad_faltante + cantidad_danada) <= cantidad_despachada
  );

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '04_transferencias.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 04_transferencias.sql aplicado.' AS resultado;
