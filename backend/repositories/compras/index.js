/**
 * Barrel — Repositories del módulo Compras.
 *
 * Proveedores: reutilizar backend/repositories/proveedores.repository.js
 * (sin proxy ni wrapper en esta carpeta).
 */

module.exports = {
  numeracionDocumentos: require('./numeracionDocumentos.repository'),
  condicionPago: require('./condicionPago.repository'),
  ordenCompra: require('./ordenCompra.repository'),
  detalleOrdenCompra: require('./detalleOrdenCompra.repository'),
  recepcion: require('./recepcion.repository'),
  detalleRecepcion: require('./detalleRecepcion.repository'),
  facturaProveedor: require('./facturaProveedor.repository'),
  detalleFacturaProveedor: require('./detalleFacturaProveedor.repository'),
}
