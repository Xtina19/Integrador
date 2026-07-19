/**
 * Bridge Importaciones ↔ Compras (documentación de desacople FASE 8).
 *
 * Compras NO:
 *   - crea/actualiza factura_internacional ni embarque
 *   - asume etapas de importación
 *   - mapea factura_internacional_id / embarque_id en recepcion.model.js
 *
 * Importaciones:
 *   - referencia orden_compra / detalle_orden_compra solo por FK
 *   - añade FKs diferidas sobre recepcion en 06_importaciones.sql
 *
 * Regla de negocio en Compras (mensaje, no entidad):
 *   facturaProveedor.service rechaza FP si OC es internacional
 *   (FI pertenece a Importaciones).
 */
module.exports = {
  BRIDGE_COLUMNS_ON_RECEPCION: ['factura_internacional_id', 'embarque_id'],
  OWNED_BY_IMPORTACIONES_FK: true,
}
