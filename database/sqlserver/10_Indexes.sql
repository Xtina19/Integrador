-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 10_Indexes.sql
-- Índices no-únicos / compuestos (UK ya viven en CREATE TABLE o filtrados).
-- Equivalente: índices de 03_administracion, 05_inventario, compras 10_indices,
--              ventas 09_indices, inventario 12_vistas_indices.
-- =============================================================================

USE LibroSys;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Seguridad / administración
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_roles_estado' AND object_id = OBJECT_ID(N'dbo.roles'))
  CREATE INDEX IX_roles_estado ON dbo.roles (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_permisos_modulo' AND object_id = OBJECT_ID(N'dbo.permisos'))
  CREATE INDEX IX_permisos_modulo ON dbo.permisos (modulo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_usuarios_rol' AND object_id = OBJECT_ID(N'dbo.usuarios'))
  CREATE INDEX IX_usuarios_rol ON dbo.usuarios (rol_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_usuarios_estado' AND object_id = OBJECT_ID(N'dbo.usuarios'))
  CREATE INDEX IX_usuarios_estado ON dbo.usuarios (estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_editoriales_estado' AND object_id = OBJECT_ID(N'dbo.editoriales'))
  CREATE INDEX IX_editoriales_estado ON dbo.editoriales (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_proveedores_tipo' AND object_id = OBJECT_ID(N'dbo.proveedores'))
  CREATE INDEX IX_proveedores_tipo ON dbo.proveedores (tipo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_proveedores_estado' AND object_id = OBJECT_ID(N'dbo.proveedores'))
  CREATE INDEX IX_proveedores_estado ON dbo.proveedores (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_sucursales_estado' AND object_id = OBJECT_ID(N'dbo.sucursales'))
  CREATE INDEX IX_sucursales_estado ON dbo.sucursales (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_almacenes_sucursal' AND object_id = OBJECT_ID(N'dbo.almacenes'))
  CREATE INDEX IX_almacenes_sucursal ON dbo.almacenes (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_almacenes_tipo' AND object_id = OBJECT_ID(N'dbo.almacenes'))
  CREATE INDEX IX_almacenes_tipo ON dbo.almacenes (tipo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_monedas_estado' AND object_id = OBJECT_ID(N'dbo.monedas'))
  CREATE INDEX IX_monedas_estado ON dbo.monedas (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_tasas_monedas' AND object_id = OBJECT_ID(N'dbo.tasas_cambio'))
  CREATE INDEX IX_tasas_monedas ON dbo.tasas_cambio (moneda_origen_id, moneda_destino_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_tasas_vigencia' AND object_id = OBJECT_ID(N'dbo.tasas_cambio'))
  CREATE INDEX IX_tasas_vigencia ON dbo.tasas_cambio (vigente_desde, vigente_hasta);

-- Productos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_categoria' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_categoria ON dbo.productos (categoria_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_editorial' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_editorial ON dbo.productos (editorial_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_productos_titulo' AND object_id = OBJECT_ID(N'dbo.productos'))
  CREATE INDEX IX_productos_titulo ON dbo.productos (titulo);

-- Inventario / movimientos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_almacen' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_almacen ON dbo.inventario (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_estado' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_estado ON dbo.inventario (estado_stock);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_bloqueado' AND object_id = OBJECT_ID(N'dbo.inventario'))
  CREATE INDEX IX_inventario_bloqueado ON dbo.inventario (bloqueado_por_conteo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_producto' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_producto ON dbo.movimiento_inventario (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_almacen' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_almacen ON dbo.movimiento_inventario (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_fecha' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_fecha ON dbo.movimiento_inventario (fecha_movimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_referencia' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_referencia ON dbo.movimiento_inventario (referencia_tipo, referencia);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_documento' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_documento ON dbo.movimiento_inventario (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_motivo' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_motivo ON dbo.movimiento_inventario (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_producto_almacen' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_producto_almacen ON dbo.movimiento_inventario (producto_id, almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_fecha_tipo' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_fecha_tipo ON dbo.movimiento_inventario (fecha_movimiento, tipo_movimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_movimiento_usuario_fecha' AND object_id = OBJECT_ID(N'dbo.movimiento_inventario'))
  CREATE INDEX IX_movimiento_usuario_fecha ON dbo.movimiento_inventario (usuario_id, fecha_movimiento);

-- Transferencias
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_estado ON dbo.transferencia (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_origen' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_origen ON dbo.transferencia (almacen_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_destino' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_destino ON dbo.transferencia (almacen_destino_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_origen_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_origen_estado ON dbo.transferencia (almacen_origen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_transferencia_destino_estado' AND object_id = OBJECT_ID(N'dbo.transferencia'))
  CREATE INDEX IX_transferencia_destino_estado ON dbo.transferencia (almacen_destino_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_transferencia_producto' AND object_id = OBJECT_ID(N'dbo.detalle_transferencia'))
  CREATE INDEX IX_detalle_transferencia_producto ON dbo.detalle_transferencia (producto_id);

-- Ajustes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_almacen_estado' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_almacen_estado ON dbo.ajuste (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_solicitante' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_solicitante ON dbo.ajuste (solicitante_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_aprobador' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_aprobador ON dbo.ajuste (aprobador_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_documento_origen' AND object_id = OBJECT_ID(N'dbo.ajuste'))
  CREATE INDEX IX_ajuste_documento_origen ON dbo.ajuste (documento_origen_tipo, documento_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_ajuste' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_ajuste ON dbo.ajuste_detalle (ajuste_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_producto' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_producto ON dbo.ajuste_detalle (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_motivo' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_motivo ON dbo.ajuste_detalle (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ajuste_detalle_linea_conteo' AND object_id = OBJECT_ID(N'dbo.ajuste_detalle'))
  CREATE INDEX IX_ajuste_detalle_linea_conteo ON dbo.ajuste_detalle (linea_conteo_id);

-- Conteos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_almacen_estado' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_almacen_estado ON dbo.conteo_fisico (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_sucursal' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_sucursal ON dbo.conteo_fisico (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_fisico_responsable' AND object_id = OBJECT_ID(N'dbo.conteo_fisico'))
  CREATE INDEX IX_conteo_fisico_responsable ON dbo.conteo_fisico (responsable_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_conteo_alcance_producto' AND object_id = OBJECT_ID(N'dbo.conteo_alcance_producto'))
  CREATE INDEX IX_conteo_alcance_producto ON dbo.conteo_alcance_producto (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_snapshot_conteo_producto' AND object_id = OBJECT_ID(N'dbo.snapshot_conteo'))
  CREATE INDEX IX_snapshot_conteo_producto ON dbo.snapshot_conteo (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_conteo' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_conteo ON dbo.linea_conteo (conteo_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_estado' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_estado ON dbo.linea_conteo (estado_linea);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_producto' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_producto ON dbo.linea_conteo (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_linea_conteo_regularizacion' AND object_id = OBJECT_ID(N'dbo.linea_conteo'))
  CREATE INDEX IX_linea_conteo_regularizacion ON dbo.linea_conteo (regularizacion_tipo, regularizacion_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_conteo_conteo' AND object_id = OBJECT_ID(N'dbo.auditoria_conteo_fisico'))
  CREATE INDEX IX_auditoria_conteo_conteo ON dbo.auditoria_conteo_fisico (conteo_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_conteo_accion' AND object_id = OBJECT_ID(N'dbo.auditoria_conteo_fisico'))
  CREATE INDEX IX_auditoria_conteo_accion ON dbo.auditoria_conteo_fisico (accion);

-- Descartes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_almacen_estado' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_almacen_estado ON dbo.descarte (almacen_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_sucursal' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_sucursal ON dbo.descarte (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_solicitante' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_solicitante ON dbo.descarte (solicitante_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_aprobador' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_aprobador ON dbo.descarte (aprobador_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_documento_origen' AND object_id = OBJECT_ID(N'dbo.descarte'))
  CREATE INDEX IX_descarte_documento_origen ON dbo.descarte (documento_origen_tipo, documento_origen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_descarte' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_descarte ON dbo.descarte_detalle (descarte_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_producto' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_producto ON dbo.descarte_detalle (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_detalle_motivo' AND object_id = OBJECT_ID(N'dbo.descarte_detalle'))
  CREATE INDEX IX_descarte_detalle_motivo ON dbo.descarte_detalle (motivo_codigo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_descarte_evidencia_descarte' AND object_id = OBJECT_ID(N'dbo.descarte_evidencia'))
  CREATE INDEX IX_descarte_evidencia_descarte ON dbo.descarte_evidencia (descarte_id);

-- Auditoría inventario / idempotencia
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_movimiento' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_movimiento ON dbo.auditoria_inventario (movimiento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_documento' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_documento ON dbo.auditoria_inventario (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_producto_almacen' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_producto_almacen ON dbo.auditoria_inventario (producto_id, almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_usuario_fecha' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_usuario_fecha ON dbo.auditoria_inventario (usuario_id, fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_inventario_idempotency' AND object_id = OBJECT_ID(N'dbo.auditoria_inventario'))
  CREATE INDEX IX_auditoria_inventario_idempotency ON dbo.auditoria_inventario (idempotency_key);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_idempotencia_documento' AND object_id = OBJECT_ID(N'dbo.inventario_idempotencia'))
  CREATE INDEX IX_inventario_idempotencia_documento ON dbo.inventario_idempotencia (documento_tipo, documento_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_inventario_idempotencia_tipo' AND object_id = OBJECT_ID(N'dbo.inventario_idempotencia'))
  CREATE INDEX IX_inventario_idempotencia_tipo ON dbo.inventario_idempotencia (tipo_operacion);

-- Compras
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_condiciones_pago_estado' AND object_id = OBJECT_ID(N'dbo.condiciones_pago'))
  CREATE INDEX IX_condiciones_pago_estado ON dbo.condiciones_pago (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_condiciones_pago_activo' AND object_id = OBJECT_ID(N'dbo.condiciones_pago'))
  CREATE INDEX IX_condiciones_pago_activo ON dbo.condiciones_pago (activo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_proveedor' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_proveedor ON dbo.orden_compra (proveedor_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_sucursal' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_sucursal ON dbo.orden_compra (sucursal_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_moneda' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_moneda ON dbo.orden_compra (moneda_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_condicion_pago' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_condicion_pago ON dbo.orden_compra (condicion_pago_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_estado ON dbo.orden_compra (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_tipo' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_tipo ON dbo.orden_compra (tipo_compra);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_fecha' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_fecha ON dbo.orden_compra (fecha_orden);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_activo' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_activo ON dbo.orden_compra (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_proveedor_estado_fecha' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_proveedor_estado_fecha ON dbo.orden_compra (proveedor_id, estado, fecha_orden);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_sucursal_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_sucursal_estado ON dbo.orden_compra (sucursal_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_orden_compra_tipo_estado' AND object_id = OBJECT_ID(N'dbo.orden_compra'))
  CREATE INDEX IX_orden_compra_tipo_estado ON dbo.orden_compra (tipo_compra, estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_producto' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_producto ON dbo.detalle_orden_compra (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_activo' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_activo ON dbo.detalle_orden_compra (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_orden_compra_subtotal' AND object_id = OBJECT_ID(N'dbo.detalle_orden_compra'))
  CREATE INDEX IX_detalle_orden_compra_subtotal ON dbo.detalle_orden_compra (orden_compra_id, subtotal);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_orden' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_orden ON dbo.recepcion (orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_almacen' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_almacen ON dbo.recepcion (almacen_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_estado' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_estado ON dbo.recepcion (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_fecha' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_fecha ON dbo.recepcion (fecha_recepcion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_factura_int' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_factura_int ON dbo.recepcion (factura_internacional_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_embarque' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_embarque ON dbo.recepcion (embarque_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_activo' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_activo ON dbo.recepcion (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_almacen_estado_fecha' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_almacen_estado_fecha ON dbo.recepcion (almacen_id, estado, fecha_recepcion);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recepcion_orden_estado' AND object_id = OBJECT_ID(N'dbo.recepcion'))
  CREATE INDEX IX_recepcion_orden_estado ON dbo.recepcion (orden_compra_id, estado);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_producto' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_producto ON dbo.detalle_recepcion (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_doc_oc' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_doc_oc ON dbo.detalle_recepcion (detalle_orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_recepcion_activo' AND object_id = OBJECT_ID(N'dbo.detalle_recepcion'))
  CREATE INDEX IX_detalle_recepcion_activo ON dbo.detalle_recepcion (activo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_proveedor' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_proveedor ON dbo.factura_proveedor (proveedor_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_moneda' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_moneda ON dbo.factura_proveedor (moneda_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_condicion' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_condicion ON dbo.factura_proveedor (condicion_pago_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado ON dbo.factura_proveedor (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado_pago' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado_pago ON dbo.factura_proveedor (estado_pago);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_fecha_emision' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_fecha_emision ON dbo.factura_proveedor (fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_activo' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_activo ON dbo.factura_proveedor (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_proveedor_estado_pago' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_proveedor_estado_pago ON dbo.factura_proveedor (proveedor_id, estado_pago, fecha_vencimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_factura_proveedor_estado_fecha' AND object_id = OBJECT_ID(N'dbo.factura_proveedor'))
  CREATE INDEX IX_factura_proveedor_estado_fecha ON dbo.factura_proveedor (estado, fecha_emision);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_producto' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_producto ON dbo.detalle_factura_proveedor (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_doc_oc' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_doc_oc ON dbo.detalle_factura_proveedor (detalle_orden_compra_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_activo' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_activo ON dbo.detalle_factura_proveedor (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_factura_linea_oc' AND object_id = OBJECT_ID(N'dbo.detalle_factura_proveedor'))
  CREATE INDEX IX_detalle_factura_linea_oc ON dbo.detalle_factura_proveedor (detalle_orden_compra_id, factura_proveedor_id);

-- Ventas
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_clientes_nombre' AND object_id = OBJECT_ID(N'dbo.venta_clientes'))
  CREATE INDEX IX_venta_clientes_nombre ON dbo.venta_clientes (nombre);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_clientes_activo' AND object_id = OBJECT_ID(N'dbo.venta_clientes'))
  CREATE INDEX IX_venta_clientes_activo ON dbo.venta_clientes (activo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_ref_erp' AND object_id = OBJECT_ID(N'dbo.ventas_ref_catalogo'))
  CREATE INDEX IX_ventas_ref_erp ON dbo.ventas_ref_catalogo (tipo, erp_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_sucursal_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_sucursal_fecha ON dbo.ventas (sucursal_id, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_estado_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_estado_fecha ON dbo.ventas (estado, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_cliente' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_cliente ON dbo.ventas (cliente_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_cliente_dominio' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_cliente_dominio ON dbo.ventas (cliente_dominio_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_usuario' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_usuario ON dbo.ventas (usuario_emision_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_sucursal_estado_fecha' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_sucursal_estado_fecha ON dbo.ventas (sucursal_id, estado, fecha_emision);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_numero_prefix' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_numero_prefix ON dbo.ventas (numero_factura);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ventas_flags_postventa' AND object_id = OBJECT_ID(N'dbo.ventas'))
  CREATE INDEX IX_ventas_flags_postventa ON dbo.ventas (tiene_cambios, tiene_devoluciones, tiene_notas_credito);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_lineas_venta' AND object_id = OBJECT_ID(N'dbo.venta_lineas'))
  CREATE INDEX IX_venta_lineas_venta ON dbo.venta_lineas (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_venta_lineas_producto' AND object_id = OBJECT_ID(N'dbo.venta_lineas'))
  CREATE INDEX IX_venta_lineas_producto ON dbo.venta_lineas (producto_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_venta' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_venta ON dbo.pagos (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_forma' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_forma ON dbo.pagos (forma_pago);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_nc' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_nc ON dbo.pagos (nota_credito_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_venta_forma' AND object_id = OBJECT_ID(N'dbo.pagos'))
  CREATE INDEX IX_pagos_venta_forma ON dbo.pagos (venta_id, forma_pago);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambios_venta' AND object_id = OBJECT_ID(N'dbo.cambios'))
  CREATE INDEX IX_cambios_venta ON dbo.cambios (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambios_fecha' AND object_id = OBJECT_ID(N'dbo.cambios'))
  CREATE INDEX IX_cambios_fecha ON dbo.cambios (fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambio_lineas_cambio' AND object_id = OBJECT_ID(N'dbo.cambio_lineas'))
  CREATE INDEX IX_cambio_lineas_cambio ON dbo.cambio_lineas (cambio_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cambio_lineas_producto' AND object_id = OBJECT_ID(N'dbo.cambio_lineas'))
  CREATE INDEX IX_cambio_lineas_producto ON dbo.cambio_lineas (producto_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devoluciones_venta' AND object_id = OBJECT_ID(N'dbo.devoluciones'))
  CREATE INDEX IX_devoluciones_venta ON dbo.devoluciones (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devoluciones_fecha' AND object_id = OBJECT_ID(N'dbo.devoluciones'))
  CREATE INDEX IX_devoluciones_fecha ON dbo.devoluciones (fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devolucion_lineas_dev' AND object_id = OBJECT_ID(N'dbo.devolucion_lineas'))
  CREATE INDEX IX_devolucion_lineas_dev ON dbo.devolucion_lineas (devolucion_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_devolucion_lineas_producto' AND object_id = OBJECT_ID(N'dbo.devolucion_lineas'))
  CREATE INDEX IX_devolucion_lineas_producto ON dbo.devolucion_lineas (producto_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_venta' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_venta ON dbo.notas_credito (venta_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_cliente' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_cliente ON dbo.notas_credito (cliente_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notas_credito_estado' AND object_id = OBJECT_ID(N'dbo.notas_credito'))
  CREATE INDEX IX_notas_credito_estado ON dbo.notas_credito (estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_nc_aplicaciones_nc' AND object_id = OBJECT_ID(N'dbo.nota_credito_aplicaciones'))
  CREATE INDEX IX_nc_aplicaciones_nc ON dbo.nota_credito_aplicaciones (nota_credito_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_nc_aplicaciones_venta' AND object_id = OBJECT_ID(N'dbo.nota_credito_aplicaciones'))
  CREATE INDEX IX_nc_aplicaciones_venta ON dbo.nota_credito_aplicaciones (venta_destino_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_historial_ventas_venta_fecha' AND object_id = OBJECT_ID(N'dbo.historial_ventas'))
  CREATE INDEX IX_historial_ventas_venta_fecha ON dbo.historial_ventas (venta_id, fecha);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_historial_ventas_tipo' AND object_id = OBJECT_ID(N'dbo.historial_ventas'))
  CREATE INDEX IX_historial_ventas_tipo ON dbo.historial_ventas (tipo_evento);

PRINT N'10_Indexes.sql :: índices creados.';
GO
