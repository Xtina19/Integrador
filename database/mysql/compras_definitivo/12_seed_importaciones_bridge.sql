-- =============================================================================
-- LibroSys — Bridge Importaciones ↔ Compras DEFINITIVO
-- Archivo: 12_seed_importaciones_bridge.sql
--
-- Debe ejecutarse DESPUÉS de 11_seed_joselito.sql (OC id 4, detalles 6–7).
-- =============================================================================

USE librosys;

INSERT INTO factura_internacional (id, codigo, orden_compra_id, proveedor_id, moneda_id, fecha_factura, monto, estado_pago, etapa_importacion) VALUES
(1, 'FI-2026-045', 4, 2, 3, '2026-07-05', 2720.00, 'pendiente', 'costos_flete');

INSERT INTO consolidacion (id, codigo, nombre, estado, total_cajas, observaciones, fecha_creacion) VALUES
(1, 'CON-2026-008', 'Consolidación España Q2 2026', 'activa', 84, 'Consolidación marítima desde España', '2026-07-08');

INSERT INTO embarque (id, codigo, factura_internacional_id, orden_compra_id, proveedor_id, consolidacion_id, tipo_transporte, origen, destino, fecha_salida, fecha_llegada_estimada, cantidad_cajas, estado, observaciones) VALUES
(1, 'EMB-012', 1, 4, 2, 1, 'maritimo', 'Barcelona, ES', 'Santo Domingo, RD', '2026-07-10', '2026-08-05', 84, 'costeado', 'Contenedor — novedades Planeta Q3');

INSERT INTO consolidacion_embarque (consolidacion_id, embarque_id) VALUES
(1, 1);

INSERT INTO costos_embarque (id, embarque_id, moneda_id, flete_internacional, seguro, aduana, transporte_local, gastos_portuarios, manipulacion, otros) VALUES
(1, 1, 1, 12400.00, 2100.00, 8900.00, 800.00, 450.00, 250.00, 0.00);

INSERT INTO costeo_libro (id, embarque_id, producto_id, orden_compra_id, detalle_orden_id, costo_producto, flete_asignado) VALUES
(1, 1, 1, 4, 7, 8.50, 1.20),
(2, 1, 2, 4, 8, 6.80, 0.95);

INSERT INTO pallet (id, codigo, embarque_id, cantidad_cajas, peso_kg, ubicacion) VALUES
(1, 'PAL-012-A', 1, 42, 680.00, 'Puerto SD — Muelle 3'),
(2, 'PAL-012-B', 1, 42, 695.00, 'Puerto SD — Muelle 3');

INSERT INTO caja (id, codigo, pallet_id, embarque_id, peso_kg, ubicacion) VALUES
(1, 'CAJ-012-01', 1, 1, 16.20, 'Puerto SD — Muelle 3'),
(2, 'CAJ-012-02', 1, 1, 16.50, 'Puerto SD — Muelle 3');

-- Recepción almacén post-importación (documento Compras; vínculo Importaciones)
INSERT INTO recepcion (
  id, codigo, orden_compra_id, factura_internacional_id, embarque_id,
  almacen_id, fecha_recepcion, usuario_receptor, usuario_inspector,
  resultado_inspeccion, observaciones, estado, activo, created_by, updated_by
) VALUES (
  2, 'REC-INT-2026-000002', 4, 1, 1,
  1, '2026-08-06', 3, 3,
  NULL, 'Pendiente inspección — llegada embarque EMB-012', 'borrador', 1, 3, 3
);

INSERT INTO detalle_recepcion (
  id, recepcion_id, detalle_orden_compra_id, producto_id,
  cantidad_recibida, costo_unitario, activo, created_by, updated_by
) VALUES
(3, 2, 6, 1, 1, 8.50, 1, 3, 3),
(4, 2, 7, 2, 1, 6.80, 1, 3, 3);

UPDATE numeracion_documentos
SET ultimo_numero = 2
WHERE tipo_documento = 'REC' AND anio = 2026;

SELECT 'COM-DB-1.0.0 :: 12_seed_importaciones_bridge.sql aplicado.' AS resultado;
