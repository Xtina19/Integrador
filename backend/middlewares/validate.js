/**
 * Middleware reutilizable: ejecuta un parse/validate HTTP y deja el DTO en req.validated.
 * El controller no debe invocar validators manualmente.
 *
 * @param {(req: import('express').Request) => unknown} parseFn
 */
function validate(parseFn) {
  return function validateMiddleware(req, res, next) {
    Promise.resolve()
      .then(() => parseFn(req))
      .then((data) => {
        req.validated = data
        next()
      })
      .catch(next)
  }
}

module.exports = { validate }
