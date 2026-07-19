/**
 * Service: Orden de Compra.
 * Ciclo documental + líneas. Sin Inventory Engine ni HTTP.
 */

const ordenRepo = require('../../repositories/compras/ordenCompra.repository')
const detalleRepo = require('../../repositories/compras/detalleOrdenCompra.repository')
const recepcionRepo = require('../../repositories/compras/recepcion.repository')
const detalleRecepcionRepo = require('../../repositories/compras/detalleRecepcion.repository')
const proveedoresRepo = require('../../repositories/proveedores.repository')
const condicionRepo = require('../../repositories/compras/condicionPago.repository')
const {
  ESTADO,
  TIPO_COMPRA,
} = require('../../models/compras/ordenCompra.model')
const { RESULTADO_INSPECCION } = require('../../models/compras/recepcion.model')
const numeracionService = require('./numeracionDocumentos.service')
const { resolveTasaCambioOrInput } = require('./tasaCambio.resolve')
const {
  withTransaction,
  audit,
  translateDbError,
  lineTotals,
  headerFromLines,
  PurchaseError,
  ValidationError,
} = require('./_internal')
const { DatabaseError, DATABASE_CODES } = require('../../errors')

function assertEditable(orden) {
  if (orden.estado !== ESTADO.BORRADOR && orden.estado !== ESTADO.PENDIENTE_APROBACION) {
    throw new PurchaseError('PURCHASE_ORDER_NOT_EDITABLE', {
      message: 'La orden ya no se puede modificar.',
      developerMessage: 'Solo se editan OC en borrador o pendiente de aprobación.',
      httpStatus: 409,
    })
  }
}

async function resolveProveedor(proveedorId) {
  const raw = await proveedoresRepo.findRawById(proveedorId)
  if (!raw) {
    throw new PurchaseError('PURCHASE_PROVIDER_NOT_FOUND', {
      message: 'Proveedor no encontrado.',
      developerMessage: 'El proveedor no existe.',
      httpStatus: 404,
    })
  }
  if (raw.estado === 'inactivo') {
    throw new PurchaseError('PURCHASE_SUPPLIER_INACTIVE', {
      message: 'El proveedor no está activo.',
      developerMessage: 'El proveedor está inactivo.',
      httpStatus: 409,
    })
  }
  return raw
}

function assertTipoProveedor(tipoCompra, proveedorTipo) {
  if (tipoCompra === TIPO_COMPRA.INTERNACIONAL && proveedorTipo === 'nacional') {
    throw new PurchaseError('PURCHASE_SUPPLIER_TYPE_MISMATCH', {
      message: 'El proveedor no corresponde al tipo de compra.',
      developerMessage: 'Compra internacional requiere proveedor internacional o mixto.',
      httpStatus: 409,
    })
  }
  if (tipoCompra === TIPO_COMPRA.NACIONAL && proveedorTipo === 'internacional') {
    throw new PurchaseError('PURCHASE_SUPPLIER_TYPE_MISMATCH', {
      message: 'El proveedor no corresponde al tipo de compra.',
      developerMessage: 'Compra nacional no admite proveedor solo internacional.',
      httpStatus: 409,
    })
  }
}

/** Mapea líneas ya validadas (domain) o persistidas → filas con totales. Sin revalidar forma. */
function mapLinesWithTotals(linesInput) {
  const lines = []
  let linea = 1
  for (const raw of linesInput) {
    const t = lineTotals({
      cantidadSolicitada: raw.cantidadSolicitada,
      costoUnitario: raw.costoUnitario,
      descuento: raw.descuento,
      impuesto: raw.impuesto,
    })
    lines.push({
      linea: linea++,
      productoId: Number(raw.productoId),
      cantidadSolicitada: t.qty,
      costoUnitario: t.costo,
      descuento: t.descuento,
      impuesto: t.impuesto,
      subtotal: t.subtotal,
      activo: true,
    })
  }
  return lines
}

async function getById(id, conn = null) {
  const orden = await ordenRepo.findById(id, conn)
  if (!orden) {
    throw new PurchaseError('PURCHASE_ORDER_NOT_FOUND', {
      message: 'Orden de compra no encontrada.',
      developerMessage: 'La orden de compra no existe.',
      httpStatus: 404,
    })
  }
  const detalles = await detalleRepo.findByParentId(id, conn)
  return { ...orden, detalles }
}

async function list({ page = 1, pageSize = 50, ...filters } = {}) {
  const offset = (Math.max(1, page) - 1) * pageSize
  const [total, data] = await Promise.all([
    ordenRepo.count(filters),
    ordenRepo.findPage({ filters, pageSize, offset }),
  ])
  return { data, page, pageSize, total }
}

async function crear(input, actorUserId = null) {
  const proveedor = await resolveProveedor(input.proveedorId)
  const tipoCompra = input.tipoCompra || TIPO_COMPRA.NACIONAL
  assertTipoProveedor(tipoCompra, proveedor.tipo)

  if (!(await condicionRepo.findById(input.condicionPagoId))) {
    throw new PurchaseError('PURCHASE_CONDITION_NOT_FOUND', {
      message: 'Condición de pago no encontrada.',
      developerMessage: 'condicionPagoId inválido.',
      httpStatus: 404,
    })
  }

  const lines = mapLinesWithTotals(input.lineas || input.detalles)
  const headers = headerFromLines(lines)
  const estadoInicial =
    input.estado === ESTADO.PENDIENTE_APROBACION ? ESTADO.PENDIENTE_APROBACION : ESTADO.BORRADOR
  const monedaId = Number(input.monedaId)
  const tasaCambio = await resolveTasaCambioOrInput(monedaId, input.tasaCambio, {
    fecha: input.fechaOrden,
  })

  try {
    return await withTransaction(async (conn) => {
      const { codigo } = await numeracionService.generarCodigo('OC', conn)
      const id = await ordenRepo.insert(
        {
          codigo,
          proveedorId: Number(input.proveedorId),
          sucursalId: input.sucursalId ?? null,
          monedaId,
          tasaCambio,
          condicionPagoId: Number(input.condicionPagoId),
          tipoCompra,
          fechaOrden: input.fechaOrden,
          fechaEntregaEstimada: input.fechaEntregaEstimada ?? null,
          ...headers,
          estado: estadoInicial,
          activo: true,
          observaciones: input.observaciones ?? null,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleRepo.insertMany(
        lines.map((l) => ({ ...l, ordenCompraId: id, createdBy: actorUserId, updatedBy: actorUserId })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'crear',
          descripcion: `OC ${codigo} creada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    if (err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY) {
      throw new PurchaseError('PURCHASE_NUMERATION_FAILED', {
        message: 'No se pudo asignar el número del documento.',
        developerMessage: 'Código OC duplicado.',
        httpStatus: 500,
      })
    }
    translateDbError(err)
  }
}

async function actualizar(id, input, actorUserId = null) {
  const actual = await getById(id)
  assertEditable(actual)

  const proveedorId = input.proveedorId ?? actual.proveedorId
  const proveedor = await resolveProveedor(proveedorId)
  const tipoCompra = input.tipoCompra ?? actual.tipoCompra
  assertTipoProveedor(tipoCompra, proveedor.tipo)

  const condicionPagoId = input.condicionPagoId ?? actual.condicionPagoId
  if (!(await condicionRepo.findById(condicionPagoId))) {
    throw new PurchaseError('PURCHASE_CONDITION_NOT_FOUND', {
      message: 'Condición de pago no encontrada.',
      developerMessage: 'condicionPagoId inválido.',
      httpStatus: 404,
    })
  }

  const lines = mapLinesWithTotals(input.lineas || input.detalles || actual.detalles)
  const headers = headerFromLines(lines)
  const monedaId = Number(input.monedaId ?? actual.monedaId)
  const tasaCambio = await resolveTasaCambioOrInput(
    monedaId,
    input.tasaCambio !== undefined ? input.tasaCambio : actual.tasaCambio,
    { fecha: input.fechaOrden ?? actual.fechaOrden }
  )

  try {
    return await withTransaction(async (conn) => {
      await ordenRepo.update(
        id,
        {
          proveedorId: Number(proveedorId),
          sucursalId: input.sucursalId !== undefined ? input.sucursalId : actual.sucursalId,
          monedaId,
          tasaCambio,
          condicionPagoId: Number(condicionPagoId),
          tipoCompra,
          fechaOrden: input.fechaOrden ?? actual.fechaOrden,
          fechaEntregaEstimada:
            input.fechaEntregaEstimada !== undefined
              ? input.fechaEntregaEstimada
              : actual.fechaEntregaEstimada,
          ...headers,
          observaciones:
            input.observaciones !== undefined ? input.observaciones : actual.observaciones,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleRepo.deleteByParentId(id, conn)
      await detalleRepo.insertMany(
        lines.map((l) => ({ ...l, ordenCompraId: id, createdBy: actorUserId, updatedBy: actorUserId })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `OC ${actual.codigo} actualizada`,
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

async function enviarAprobacion(id, actorUserId = null) {
  const orden = await getById(id)
  if (orden.estado !== ESTADO.BORRADOR) {
    throw new PurchaseError('PURCHASE_ORDER_INVALID_STATE', {
      message: 'No se puede realizar esta acción en el estado actual de la orden.',
      developerMessage: 'Solo borrador → pendiente_aprobacion.',
      httpStatus: 409,
    })
  }
  if (!orden.detalles.length) {
    throw new ValidationError('VALIDATION_EMPTY_LINES', {
      message: 'Debe agregar al menos una línea.',
      developerMessage: 'No se puede enviar una OC sin líneas.',
    })
  }
  try {
    return await withTransaction(async (conn) => {
      await ordenRepo.updateEstado(id, ESTADO.PENDIENTE_APROBACION, { updatedBy: actorUserId }, conn)
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `OC ${orden.codigo} → pendiente_aprobacion`,
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

async function aprobar(id, actorUserId = null) {
  const orden = await getById(id)
  if (orden.estado === ESTADO.APROBADA) {
    throw new PurchaseError('PURCHASE_ORDER_ALREADY_APPROVED', {
      message: 'La orden ya fue aprobada.',
      developerMessage: 'La OC ya está aprobada.',
      httpStatus: 409,
    })
  }
  if (orden.estado !== ESTADO.PENDIENTE_APROBACION) {
    throw new PurchaseError('PURCHASE_ORDER_INVALID_STATE', {
      message: 'No se puede realizar esta acción en el estado actual de la orden.',
      developerMessage: 'Solo pendiente_aprobacion → aprobada.',
      httpStatus: 409,
    })
  }
  const now = new Date()
  try {
    return await withTransaction(async (conn) => {
      await ordenRepo.updateEstado(
        id,
        ESTADO.APROBADA,
        {
          fechaAprobacion: now,
          aprobadoPor: actorUserId,
          updatedBy: actorUserId,
        },
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `OC ${orden.codigo} aprobada`,
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

async function cancelar(id, actorUserId = null) {
  const orden = await getById(id)
  if (orden.estado === ESTADO.CANCELADA) {
    throw new PurchaseError('PURCHASE_ORDER_CANCELLED', {
      message: 'La orden está cancelada.',
      developerMessage: 'La OC ya está cancelada.',
      httpStatus: 409,
    })
  }
  if (orden.estado === ESTADO.CERRADA) {
    throw new PurchaseError('PURCHASE_ORDER_CLOSED', {
      message: 'La orden está cerrada.',
      developerMessage: 'No se puede cancelar una OC cerrada.',
      httpStatus: 409,
    })
  }
  const allowed = [ESTADO.BORRADOR, ESTADO.PENDIENTE_APROBACION, ESTADO.APROBADA]
  if (!allowed.includes(orden.estado)) {
    throw new PurchaseError('PURCHASE_ORDER_INVALID_STATE', {
      message: 'No se puede realizar esta acción en el estado actual de la orden.',
      developerMessage: `No se cancela desde estado ${orden.estado}.`,
      httpStatus: 409,
    })
  }

  try {
    return await withTransaction(async (conn) => {
      const recepciones = await recepcionRepo.findByOrdenCompraId(id, conn)
      const tieneConfirmada = recepciones.some((r) => r.estado === 'confirmada' && r.activo)
      if (tieneConfirmada) {
        throw new PurchaseError('PURCHASE_ORDER_INVALID_STATE', {
          message: 'No se puede realizar esta acción en el estado actual de la orden.',
          developerMessage: 'La OC tiene recepciones confirmadas; no se puede cancelar.',
          httpStatus: 409,
        })
      }

      await ordenRepo.updateEstado(id, ESTADO.CANCELADA, { updatedBy: actorUserId }, conn)
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `OC ${orden.codigo} cancelada`,
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

async function cerrar(id, actorUserId = null) {
  const orden = await getById(id)
  if (orden.estado !== ESTADO.RECIBIDA) {
    throw new PurchaseError('PURCHASE_ORDER_INVALID_STATE', {
      message: 'No se puede realizar esta acción en el estado actual de la orden.',
      developerMessage: 'Solo se cierra desde estado recibida.',
      httpStatus: 409,
    })
  }
  try {
    return await withTransaction(async (conn) => {
      await ordenRepo.updateEstado(id, ESTADO.CERRADA, { updatedBy: actorUserId }, conn)
      await audit(
        actorUserId,
        {
          entidad: 'orden_compra',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `OC ${orden.codigo} cerrada`,
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

/**
 * Recalcula parcialmente_recibida / recibida según cantidades.
 * Ignora recepciones con resultado_inspeccion = rechazada.
 *
 * TODO(futuro): exponer en detalleOrdenCompra.repository un método
 * getCantidadesRecibidasValidas(ordenCompraId) que encapsule esta consulta
 * (confirmada + inspección aceptada|parcialmente_aceptada) y simplifique este Service.
 */
async function recalcularEstadoRecepcion(ordenCompraId, actorUserId = null, conn = null) {
  const orden = await ordenRepo.findById(ordenCompraId, conn)
  if (!orden) {
    throw new PurchaseError('PURCHASE_ORDER_NOT_FOUND', {
      message: 'Orden de compra no encontrada.',
      developerMessage: 'La orden de compra no existe.',
      httpStatus: 404,
    })
  }

  const terminal = [ESTADO.CERRADA, ESTADO.CANCELADA, ESTADO.BORRADOR, ESTADO.PENDIENTE_APROBACION]
  if (terminal.includes(orden.estado)) return orden

  const detalles = await detalleRepo.findByParentId(ordenCompraId, conn)
  const recepciones = await recepcionRepo.findByOrdenCompraId(ordenCompraId, conn)

  const validas = new Set(
    recepciones
      .filter(
        (r) =>
          r.activo &&
          r.estado === 'confirmada' &&
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
      acumulado[l.detalleOrdenCompraId] = (acumulado[l.detalleOrdenCompraId] || 0) + Number(l.cantidadRecibida)
    }
  }

  let alguna = false
  let completa = detalles.length > 0
  for (const d of detalles) {
    const rec = acumulado[d.id] || 0
    if (rec > 0) alguna = true
    if (rec + 1e-9 < Number(d.cantidadSolicitada)) completa = false
  }

  let nuevo = orden.estado
  if (completa && alguna) nuevo = ESTADO.RECIBIDA
  else if (alguna) nuevo = ESTADO.PARCIALMENTE_RECIBIDA
  else if (orden.estado === ESTADO.PARCIALMENTE_RECIBIDA || orden.estado === ESTADO.RECIBIDA) {
    nuevo = ESTADO.APROBADA
  }

  if (nuevo !== orden.estado) {
    await ordenRepo.updateEstado(ordenCompraId, nuevo, { updatedBy: actorUserId }, conn)
  }
  return ordenRepo.findById(ordenCompraId, conn)
}

module.exports = {
  list,
  getById,
  crear,
  actualizar,
  enviarAprobacion,
  aprobar,
  cancelar,
  cerrar,
  recalcularEstadoRecepcion,
}
