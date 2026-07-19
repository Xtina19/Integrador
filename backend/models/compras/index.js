/**
 * Barrel — Models del módulo Compras.
 */

module.exports = {
  condicionPago: require('./condicionPago.model'),
  numeracionDocumentos: require('./numeracionDocumentos.model'),
  ordenCompra: require('./ordenCompra.model'),
  detalleOrdenCompra: require('./detalleOrdenCompra.model'),
  recepcion: require('./recepcion.model'),
  detalleRecepcion: require('./detalleRecepcion.model'),
  facturaProveedor: require('./facturaProveedor.model'),
  detalleFacturaProveedor: require('./detalleFacturaProveedor.model'),
}
