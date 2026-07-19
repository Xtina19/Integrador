-- =============================================================================
-- LibroSys — Compras DEFINITIVO
-- Archivo: 10_indices.sql
-- Índices compuestos adicionales para consultas frecuentes del módulo.
-- =============================================================================

USE librosys;

-- Índices idempotentes (MariaDB 10.4+ / MySQL 8+)
-- Órdenes de compra: listados por proveedor/estado y por sucursal/fecha
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_estado_fecha
  ON orden_compra (proveedor_id, estado, fecha_orden);

CREATE INDEX IF NOT EXISTS idx_orden_compra_sucursal_estado
  ON orden_compra (sucursal_id, estado);

CREATE INDEX IF NOT EXISTS idx_orden_compra_tipo_estado
  ON orden_compra (tipo_compra, estado);

-- Detalle OC: totales por orden
CREATE INDEX IF NOT EXISTS idx_detalle_orden_compra_subtotal
  ON detalle_orden_compra (orden_compra_id, subtotal);

-- Recepciones: bandeja operativa por almacén y fecha
CREATE INDEX IF NOT EXISTS idx_recepcion_almacen_estado_fecha
  ON recepcion (almacen_id, estado, fecha_recepcion);

CREATE INDEX IF NOT EXISTS idx_recepcion_orden_estado
  ON recepcion (orden_compra_id, estado);

-- Facturas proveedor: cuentas por pagar
CREATE INDEX IF NOT EXISTS idx_factura_proveedor_proveedor_estado_pago
  ON factura_proveedor (proveedor_id, estado_pago, fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_factura_proveedor_estado_fecha
  ON factura_proveedor (estado, fecha_emision);

-- Detalle factura: trazabilidad a línea de OC (nombre distinto al KEY de 09_*)
CREATE INDEX IF NOT EXISTS idx_detalle_factura_linea_oc
  ON detalle_factura_proveedor (detalle_orden_compra_id, factura_proveedor_id);

INSERT INTO compras_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '10_indices.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'COM-DB-1.0.0 :: 10_indices.sql aplicado.' AS resultado;
