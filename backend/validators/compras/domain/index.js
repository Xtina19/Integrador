/**
 * Domain validators — Compras (sin Express).
 */

module.exports = {
  common: require('./common'),
  condicionPago: require('./condicionPago.domain.validator'),
  ordenCompra: require('./ordenCompra.domain.validator'),
  recepcion: require('./recepcion.domain.validator'),
  facturaProveedor: require('./facturaProveedor.domain.validator'),
}
