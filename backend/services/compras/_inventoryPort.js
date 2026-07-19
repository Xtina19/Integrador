/**
 * Puerto Inventory Engine para Compras.
 *
 * COMPRAS_INVENTORY_STUB=1 (default) → no-op exitoso.
 * COMPRAS_INVENTORY_STUB=0 → falla si no hay adaptador real conectado.
 */

const { PurchaseError } = require('../../errors')

let realAdapter = null

/**
 * Conecta el adaptador real del Inventory Engine (futuro).
 * @param {{ registrarEntradaRecepcion: Function }} adapter
 */
function connectInventoryAdapter(adapter) {
  realAdapter = adapter
}

function isStubEnabled() {
  const raw = process.env.COMPRAS_INVENTORY_STUB
  if (raw === undefined || raw === '') return true
  return String(raw).toLowerCase() === '1' || String(raw).toLowerCase() === 'true'
}

/**
 * @param {object} payload
 * @param {number} payload.recepcionId
 * @param {string} payload.codigo
 * @param {number} payload.almacenId
 * @param {Array<{ productoId: number, cantidad: number, costoUnitario: number, detalleOrdenCompraId: number }>} payload.lineas
 * @param {number|null} payload.actorUserId
 */
async function registrarEntradaRecepcion(payload) {
  if (realAdapter && typeof realAdapter.registrarEntradaRecepcion === 'function') {
    return realAdapter.registrarEntradaRecepcion(payload)
  }

  if (isStubEnabled()) {
    return {
      ok: true,
      stub: true,
      message: 'Inventory Engine stub (COMPRAS_INVENTORY_STUB=1)',
      lineas: payload.lineas?.length ?? 0,
    }
  }

  throw new PurchaseError('PURCHASE_INVENTORY_EFFECT_FAILED', {
    message: 'No se pudo actualizar el inventario con la recepción.',
    developerMessage:
      'Inventory Engine no conectado y COMPRAS_INVENTORY_STUB=0. Conectar adaptador real o habilitar stub.',
    httpStatus: 409,
    details: { stubEnabled: false, hasAdapter: false },
  })
}

module.exports = {
  connectInventoryAdapter,
  registrarEntradaRecepcion,
  isStubEnabled,
}
