-- =============================================================================
-- LibroSys — Índices adicionales
-- Archivo: 16_indices.sql
-- Descripción: Índices compuestos y de rendimiento complementarios
-- =============================================================================

USE librosys;

-- Compras
CREATE INDEX idx_orden_compra_proveedor_estado
  ON orden_compra (proveedor_id, estado);

CREATE INDEX idx_orden_compra_fecha_estado
  ON orden_compra (fecha_orden, estado);

CREATE INDEX idx_detalle_orden_subtotal
  ON detalle_orden_compra (orden_compra_id, subtotal);

CREATE INDEX idx_recepcion_tipo_estado
  ON recepcion (tipo_compra, estado);

CREATE INDEX idx_factura_proveedor_estado_fecha
  ON factura_proveedor (estado_pago, fecha_factura);

-- Inventario
CREATE INDEX idx_inventario_estado_stock_almacen
  ON inventario (estado_stock, almacen_id);

CREATE INDEX idx_movimiento_tipo_fecha
  ON movimiento_inventario (tipo_movimiento, fecha_movimiento);

CREATE INDEX idx_productos_editorial_categoria
  ON productos (editorial_id, categoria_id);

CREATE INDEX idx_ajuste_fecha_estado
  ON ajuste_inventario (fecha_ajuste, estado);

-- Importaciones
CREATE INDEX idx_factura_int_etapa_estado
  ON factura_internacional (etapa_importacion, estado_pago);

CREATE INDEX idx_embarque_estado_fechas
  ON embarque (estado, fecha_salida, fecha_llegada_estimada);

CREATE INDEX idx_embarque_proveedor_estado
  ON embarque (proveedor_id, estado);

CREATE INDEX idx_costeo_embarque_orden
  ON costeo_libro (embarque_id, orden_compra_id);

CREATE INDEX idx_pallet_embarque_ubicacion
  ON pallet (embarque_id, ubicacion);

CREATE INDEX idx_caja_embarque_pallet
  ON caja (embarque_id, pallet_id);

-- Ventas
CREATE INDEX idx_venta_sucursal_fecha_estado
  ON venta (sucursal_id, fecha_venta, estado);

CREATE INDEX idx_venta_usuario_fecha
  ON venta (usuario_id, fecha_venta);

CREATE INDEX idx_detalle_venta_producto_cantidad
  ON detalle_venta (producto_id, cantidad);

-- Transferencias
CREATE INDEX idx_transferencia_estado_fechas
  ON transferencia (estado, fecha_solicitud, fecha_envio);

CREATE INDEX idx_detalle_transferencia_estado_cantidades
  ON detalle_transferencia (transferencia_id, cantidad_recibida, cantidad_enviada);

-- Eventos
CREATE INDEX idx_eventos_estado_fecha_inicio
  ON eventos (estado, fecha_inicio);

CREATE INDEX idx_asignacion_evento_estado
  ON asignacion_evento (evento_id, estado);

CREATE INDEX idx_presupuesto_evento_utilizacion
  ON presupuestos_evento (evento_id, monto_utilizado, monto_presupuestado);

-- Configuración y notificaciones
CREATE INDEX idx_notificaciones_usuario_leida_fecha
  ON notificaciones (usuario_id, leida, created_at);

CREATE INDEX idx_correo_pendiente
  ON correo_notificacion (estado_envio, created_at);

-- Auditoría
CREATE INDEX idx_auditoria_modulo_accion_fecha
  ON auditoria (modulo, accion, fecha_evento);

CREATE INDEX idx_auditoria_cambio_campo
  ON auditoria_cambio (auditoria_id, campo);

CREATE INDEX idx_auditoria_acceso_tipo_fecha
  ON auditoria_acceso (tipo_acceso, fecha_acceso);

-- Seguridad
CREATE INDEX idx_usuarios_rol_estado
  ON usuarios (rol_id, estado);

CREATE INDEX idx_tasas_vigencia_actual
  ON tasas_cambio (moneda_origen_id, moneda_destino_id, vigente_desde DESC);

-- Administración
CREATE INDEX idx_proveedores_pais_tipo
  ON proveedores (pais, tipo, estado);

CREATE INDEX idx_almacenes_sucursal_tipo
  ON almacenes (sucursal_id, tipo, estado);
