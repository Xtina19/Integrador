/**
 * Respuestas HTTP homogéneas.
 */
function sendError(res, status, message) {
  return res.status(status).json({ error: message })
}

function sendOk(res, data, status = 200) {
  return res.status(status).json(data)
}

module.exports = { sendError, sendOk }
