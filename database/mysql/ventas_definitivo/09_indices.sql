-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 09_indices.sql
-- Índices adicionales según VEN-UC-2.0.0 (listados / filtros).
-- =============================================================================

USE librosys;

-- Listado Ventas: sucursal + estado + fecha
CREATE INDEX idx_ventas_sucursal_estado_fecha
  ON ventas (sucursal_id, estado, fecha_emision);

-- Búsqueda por número (prefijo)
CREATE INDEX idx_ventas_numero_prefix
  ON ventas (numero_factura);

-- Postventa flags (dashboard operativo interno)
CREATE INDEX idx_ventas_flags_postventa
  ON ventas (tiene_cambios, tiene_devoluciones, tiene_notas_credito);

-- Pagos por forma (Dashboard comercial)
CREATE INDEX idx_pagos_venta_forma
  ON pagos (venta_id, forma_pago);

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '09_indices.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 09_indices.sql aplicado.' AS resultado;
