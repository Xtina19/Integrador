/**
 * Asigna req.traceId para correlación de logs y Error Envelope.
 * Propaga X-Trace-Id / X-Request-Id si vienen en la petición.
 */
const crypto = require('crypto')

function traceId(req, res, next) {
  const incoming =
    req.headers['x-trace-id'] || req.headers['x-request-id'] || null
  const id =
    incoming && String(incoming).trim()
      ? String(incoming).trim()
      : crypto.randomUUID()
  req.traceId = id
  res.setHeader('X-Trace-Id', id)
  next()
}

module.exports = { traceId }
