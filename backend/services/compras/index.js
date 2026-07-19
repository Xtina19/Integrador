/**
 * Barrel — Services del módulo Compras.
 */

module.exports = {
  numeracionDocumentos: require('./numeracionDocumentos.service'),
  condicionesPago: require('./condicionesPago.service'),
  ordenCompra: require('./ordenCompra.service'),
  recepcion: require('./recepcion.service'),
  facturaProveedor: require('./facturaProveedor.service'),
  inventoryPort: require('./_inventoryPort'),
}
