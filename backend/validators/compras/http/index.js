/**
 * HTTP validators — Compras (leen req; delegan forma a domain).
 */

module.exports = {
  common: require('./common'),
  condicionPago: require('./condicionPago.http.validator'),
  ordenCompra: require('./ordenCompra.http.validator'),
  recepcion: require('./recepcion.http.validator'),
  facturaProveedor: require('./facturaProveedor.http.validator'),
}
