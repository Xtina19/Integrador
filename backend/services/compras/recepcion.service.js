/**
 * Service: Recepción de mercancía.
 * Confirmar puede invocar InventoryPort; no escribe stock directamente.
 */

const recepcionRepo = require('../../repositories/compras/recepcion.repository')
const detalleRecepcionRepo = require('../../repositories/compras/detalleRecepcion.repository')
const detalleOrdenRepo = require('../../repositories/compras/detalleOrdenCompra.repository')
const ordenRepo = require('../../repositories/compras/ordenCompra.repository')
const {
  ESTADO: REC_ESTADO,
  RESULTADO_INSPECCION,
} = require('../../models/compras/recepcion.model')
const { ESTADO: OC_ESTADO } = require('../../models/compras/ordenCompra.model')
const numeracionService = require('./numeracionDocumentos.service')
const ordenCompraService = require('./ordenCompra.service')
const inventoryPort = require('./_inventoryPort')
const {
  withTransaction,
  audit,
  translateDbError,
  PurchaseError,
  ValidationError,
} = require('./_internal')

async function getById(id, conn = null) {
  const rec = await recepcionRepo.findById(id, conn)
  if (!rec) {
    throw new PurchaseError('PURCHASE_RECEPTION_NOT_FOUND', {
      message: 'Recepción no encontrada.',
      developerMessage: 'La recepción no existe.',
      httpStatus: 404,
    })
  }
  const detalles = await detalleRecepcionRepo.findByParentId(id, conn)
  return { ...rec, detalles }
}

async function list({ page = 1, pageSize = 50, ...filters } = {}) {
  const offset = (Math.max(1, page) - 1) * pageSize
  const [total, data] = await Promise.all([
    recepcionRepo.count(filters),
    recepcionRepo.findPage({ filters, pageSize, offset }),
  ])
  return { data, page, pageSize, total }
}

function assertOcRecibible(orden) {
  const ok = [OC_ESTADO.APROBADA, OC_ESTADO.PARCIALMENTE_RECIBIDA, OC_ESTADO.RECIBIDA]
  if (!ok.includes(orden.estado)) {
    throw new PurchaseError('PURCHASE_RECEPTION_ORDER_NOT_APPROVED', {
      message: 'La orden no está lista para recepción.',
      developerMessage: `OC en estado ${orden.estado} no admite recepción.`,
      httpStatus: 409,
    })
  }
}

/**
 * Saldo pendiente por línea OC (ignora inspecciones rechazadas).
 * TODO(futuro): repository getCantidadesRecibidasValidas(ordenCompraId).
 */
async function buildSaldosPendientes(ordenCompraId, conn = null) {
  const detalles = await detalleOrdenRepo.findByParentId(ordenCompraId, conn)
  // Reuse lógica de cantidades válidas (ignora inspección rechazada).
  // TODO(futuro): repository getCantidadesRecibidasValidas(ordenCompraId).
  const recepciones = await recepcionRepo.findByOrdenCompraId(ordenCompraId, conn)
  const validas = new Set(
    recepciones
      .filter(
        (r) =>
          r.activo &&
          r.estado === REC_ESTADO.CONFIRMADA &&
          r.resultadoInspeccion &&
          r.resultadoInspeccion !== RESULTADO_INSPECCION.RECHAZADA
      )
      .map((r) => r.id)
  )
  const acumulado = {}
  for (const d of detalles) acumulado[d.id] = 0
  for (const recId of validas) {
    const lineas = await detalleRecepcionRepo.findByParentId(recId, conn)
    for (const l of lineas) {
      if (!l.activo) continue
      acumulado[l.detalleOrdenCompraId] =
        (acumulado[l.detalleOrdenCompraId] || 0) + Number(l.cantidadRecibida)
    }
  }

  const saldos = {}
  const byId = {}
  for (const d of detalles) {
    byId[d.id] = d
    saldos[d.id] = Number(d.cantidadSolicitada) - (acumulado[d.id] || 0)
  }
  return { saldos, byId }
}

/**
 * Mapea líneas (forma ya validada en domain) aplicando integridad vs OC y saldos.
 */
function mapRecepcionLines(linesInput, saldos, byId) {
  const lines = []
  for (const raw of linesInput) {
    const detalleOrdenCompraId = Number(raw.detalleOrdenCompraId)
    if (!byId[detalleOrdenCompraId]) {
      throw new ValidationError('VALIDATION_REQUIRED_FIELD', {
        message: 'Complete los campos obligatorios.',
        developerMessage: 'detalleOrdenCompraId inválido o no pertenece a la OC.',
        details: { field: 'detalleOrdenCompraId' },
      })
    }
    const qty = Number(raw.cantidadRecibida)
    const pendiente = saldos[detalleOrdenCompraId]
    if (qty > pendiente + 1e-9) {
      throw new PurchaseError('PURCHASE_RECEPTION_EXCEEDS_PENDING', {
        message: 'La cantidad supera lo pendiente por recibir.',
        developerMessage: `cantidad ${qty} > pendiente ${pendiente} en detalle ${detalleOrdenCompraId}`,
        httpStatus: 409,
      })
    }
    const doc = byId[detalleOrdenCompraId]
    lines.push({
      detalleOrdenCompraId,
      productoId: Number(raw.productoId ?? doc.productoId),
      cantidadRecibida: qty,
      costoUnitario: Number(raw.costoUnitario ?? doc.costoUnitario),
      activo: true,
    })
  }
  return lines
}

async function crear(input, actorUserId = null) {
  const ordenCompraId = Number(input.ordenCompraId)
  const orden = await ordenRepo.findById(ordenCompraId)
  if (!orden) {
    throw new PurchaseError('PURCHASE_ORDER_NOT_FOUND', {
      message: 'Orden de compra no encontrada.',
      developerMessage: 'La orden de compra no existe.',
      httpStatus: 404,
    })
  }
  assertOcRecibible(orden)

  const { saldos, byId } = await buildSaldosPendientes(ordenCompraId)
  const allZero = Object.values(saldos).every((s) => s <= 1e-9)
  if (allZero) {
    throw new PurchaseError('PURCHASE_RECEPTION_EXCEEDS_PENDING', {
      message: 'La cantidad supera lo pendiente por recibir.',
      developerMessage: 'La OC no tiene saldo pendiente por recibir.',
      httpStatus: 409,
    })
  }

  const lines = mapRecepcionLines(input.lineas || input.detalles, saldos, byId)

  try {
    return await withTransaction(async (conn) => {
      const { codigo } = await numeracionService.generarCodigo('REC', conn)
      const id = await recepcionRepo.insert(
        {
          codigo,
          ordenCompraId,
          almacenId: Number(input.almacenId),
          fechaRecepcion: input.fechaRecepcion,
          usuarioReceptor: Number(input.usuarioReceptor),
          usuarioInspector: input.usuarioInspector ?? null,
          resultadoInspeccion: null,
          observaciones: input.observaciones ?? null,
          estado: REC_ESTADO.BORRADOR,
          activo: true,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleRecepcionRepo.insertMany(
        lines.map((l) => ({ ...l, recepcionId: id, createdBy: actorUserId, updatedBy: actorUserId })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'recepcion',
          entidadId: id,
          accion: 'crear',
          descripcion: `Recepción ${codigo} creada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    translateDbError(err)
  }
}

async function actualizar(id, input, actorUserId = null) {
  const actual = await getById(id)
  if (actual.estado !== REC_ESTADO.BORRADOR) {
    throw new PurchaseError('PURCHASE_RECEPTION_INVALID_STATE', {
      message: 'No se puede realizar esta acción en la recepción.',
      developerMessage: 'Solo se edita recepción en borrador.',
      httpStatus: 409,
    })
  }

  const { saldos, byId } = await buildSaldosPendientes(actual.ordenCompraId)
  // Al editar borrador, las líneas de esta recepción no están confirmadas; saldos OK.
  const lines = mapRecepcionLines(input.lineas || input.detalles || actual.detalles, saldos, byId)

  try {
    return await withTransaction(async (conn) => {
      await recepcionRepo.update(
        id,
        {
          almacenId: input.almacenId ?? actual.almacenId,
          fechaRecepcion: input.fechaRecepcion ?? actual.fechaRecepcion,
          usuarioReceptor: input.usuarioReceptor ?? actual.usuarioReceptor,
          usuarioInspector:
            input.usuarioInspector !== undefined ? input.usuarioInspector : actual.usuarioInspector,
          observaciones: input.observaciones !== undefined ? input.observaciones : actual.observaciones,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleRecepcionRepo.deleteByParentId(id, conn)
      await detalleRecepcionRepo.insertMany(
        lines.map((l) => ({ ...l, recepcionId: id, createdBy: actorUserId, updatedBy: actorUserId })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'recepcion',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `Recepción ${actual.codigo} actualizada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    translateDbError(err)
  }
}

async function confirmar(id, input, actorUserId = null) {
  const resultado = input.resultadoInspeccion

  try {
    return await withTransaction(async (conn) => {
      const actual = await getById(id, conn)
      if (actual.estado !== REC_ESTADO.BORRADOR) {
        throw new PurchaseError('PURCHASE_RECEPTION_INVALID_STATE', {
          message: 'No se puede realizar esta acción en la recepción.',
          developerMessage: 'Solo se confirma recepción en borrador.',
          httpStatus: 409,
        })
      }

      const orden = await ordenRepo.findById(actual.ordenCompraId, conn)
      assertOcRecibible(orden)

      await recepcionRepo.updateEstado(
        id,
        REC_ESTADO.CONFIRMADA,
        {
          fechaConfirmacion: new Date(),
          resultadoInspeccion: resultado,
          updatedBy: actorUserId,
        },
        conn
      )
      if (input.usuarioInspector !== undefined) {
        await recepcionRepo.update(id, { usuarioInspector: input.usuarioInspector, updatedBy: actorUserId }, conn)
      }
      if (input.observaciones !== undefined) {
        await recepcionRepo.update(id, { observaciones: input.observaciones, updatedBy: actorUserId }, conn)
      }

      const aplicaStock =
        resultado === RESULTADO_INSPECCION.ACEPTADA ||
        resultado === RESULTADO_INSPECCION.PARCIALMENTE_ACEPTADA

      if (aplicaStock) {
        try {
          await inventoryPort.registrarEntradaRecepcion({
            recepcionId: id,
            codigo: actual.codigo,
            almacenId: actual.almacenId,
            lineas: actual.detalles.map((l) => ({
              productoId: l.productoId,
              cantidad: l.cantidadRecibida,
              costoUnitario: l.costoUnitario,
              detalleOrdenCompraId: l.detalleOrdenCompraId,
            })),
            actorUserId,
          })
        } catch (invErr) {
          if (invErr instanceof PurchaseError) throw invErr
          throw new PurchaseError('PURCHASE_INVENTORY_EFFECT_FAILED', {
            message: 'No se pudo actualizar el inventario con la recepción.',
            developerMessage: invErr.message || 'Fallo Inventory Engine',
            httpStatus: 409,
            cause: invErr,
          })
        }
      } else if (resultado === RESULTADO_INSPECCION.RECHAZADA) {
        // Confirmada documentalmente, sin stock (regla v1).
      }

      await ordenCompraService.recalcularEstadoRecepcion(actual.ordenCompraId, actorUserId, conn)

      await audit(
        actorUserId,
        {
          entidad: 'recepcion',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `Recepción ${actual.codigo} confirmada (${resultado})`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    translateDbError(err)
  }
}

async function anular(id, actorUserId = null) {
  const actual = await getById(id)
  if (actual.estado === REC_ESTADO.ANULADA) {
    throw new PurchaseError('PURCHASE_RECEPTION_INVALID_STATE', {
      message: 'No se puede realizar esta acción en la recepción.',
      developerMessage: 'La recepción ya está anulada.',
      httpStatus: 409,
    })
  }
  // v1: sin reverse de inventario si estaba confirmada.
  try {
    return await withTransaction(async (conn) => {
      await recepcionRepo.updateEstado(id, REC_ESTADO.ANULADA, { updatedBy: actorUserId }, conn)
      if (actual.estado === REC_ESTADO.CONFIRMADA) {
        await ordenCompraService.recalcularEstadoRecepcion(actual.ordenCompraId, actorUserId, conn)
      }
      await audit(
        actorUserId,
        {
          entidad: 'recepcion',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `Recepción ${actual.codigo} anulada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    translateDbError(err)
  }
}

module.exports = {
  list,
  getById,
  crear,
  actualizar,
  confirmar,
  anular,
}
