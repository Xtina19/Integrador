/**
 * Service: Factura del Proveedor (compras nacionales).
 * Máximo una por OC. Prohibida en OC internacionales.
 */

const facturaRepo = require('../../repositories/compras/facturaProveedor.repository')
const detalleFacturaRepo = require('../../repositories/compras/detalleFacturaProveedor.repository')
const ordenRepo = require('../../repositories/compras/ordenCompra.repository')
const condicionRepo = require('../../repositories/compras/condicionPago.repository')
const {
  ESTADO,
  ESTADO_PAGO,
} = require('../../models/compras/facturaProveedor.model')
const { TIPO_COMPRA } = require('../../models/compras/ordenCompra.model')
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

async function getById(id, conn = null) {
  const fp = await facturaRepo.findById(id, conn)
  if (!fp) {
    throw new PurchaseError('PURCHASE_INVOICE_NOT_FOUND', {
      message: 'Factura de proveedor no encontrada.',
      developerMessage: 'La factura de proveedor no existe.',
      httpStatus: 404,
    })
  }
  const detalles = await detalleFacturaRepo.findByParentId(id, conn)
  return { ...fp, detalles }
}

async function list({ page = 1, pageSize = 50, ...filters } = {}) {
  const offset = (Math.max(1, page) - 1) * pageSize
  const [total, data] = await Promise.all([
    facturaRepo.count(filters),
    facturaRepo.findPage({ filters, pageSize, offset }),
  ])
  return { data, page, pageSize, total }
}

async function getByOrdenCompraId(ordenCompraId) {
  const fp = await facturaRepo.findByOrdenCompraId(ordenCompraId)
  if (!fp) return null
  return getById(fp.id)
}

function mapInvoiceLinesWithTotals(linesInput) {
  const lines = []
  let linea = 1
  for (const raw of linesInput) {
    const t = lineTotals({
      cantidad: raw.cantidad,
      cantidadSolicitada: raw.cantidad,
      costoUnitario: raw.costoUnitario,
      descuento: raw.descuento,
      impuesto: raw.impuesto,
    })
    lines.push({
      linea: linea++,
      productoId: Number(raw.productoId),
      detalleOrdenCompraId: raw.detalleOrdenCompraId ?? null,
      cantidad: t.qty,
      costoUnitario: t.costo,
      descuento: t.descuento,
      impuesto: t.impuesto,
      subtotal: t.subtotal,
      activo: true,
    })
  }
  return lines
}

async function assertOrdenParaFactura(ordenCompraId) {
  const orden = await ordenRepo.findById(ordenCompraId)
  if (!orden) {
    throw new PurchaseError('PURCHASE_ORDER_NOT_FOUND', {
      message: 'Orden de compra no encontrada.',
      developerMessage: 'La orden de compra no existe.',
      httpStatus: 404,
    })
  }
  if (orden.tipoCompra === TIPO_COMPRA.INTERNACIONAL) {
    throw new PurchaseError('PURCHASE_INTERNATIONAL_INVOICE_FORBIDDEN', {
      message: 'Las compras internacionales se gestionan en Importaciones.',
      developerMessage: 'Las OC internacionales no registran Factura del Proveedor en Compras.',
      httpStatus: 409,
    })
  }
  const existing = await facturaRepo.findByOrdenCompraId(ordenCompraId)
  if (existing) {
    throw new PurchaseError('PURCHASE_INVOICE_ALREADY_EXISTS', {
      message: 'Esta orden ya tiene una factura registrada.',
      developerMessage: 'La OC nacional ya tiene una factura de proveedor.',
      httpStatus: 409,
    })
  }
  return orden
}

async function registrar(input, actorUserId = null) {
  const orden = await assertOrdenParaFactura(input.ordenCompraId)
  const proveedorId = Number(input.proveedorId ?? orden.proveedorId)
  if (proveedorId !== Number(orden.proveedorId)) {
    throw new PurchaseError('PURCHASE_INVOICE_SUPPLIER_MISMATCH', {
      message: 'El proveedor de la factura no coincide con la orden.',
      developerMessage: 'proveedor_id de la factura ≠ proveedor de la OC.',
      httpStatus: 409,
    })
  }
  if (!(await condicionRepo.findById(input.condicionPagoId ?? orden.condicionPagoId))) {
    throw new PurchaseError('PURCHASE_CONDITION_NOT_FOUND', {
      message: 'Condición de pago no encontrada.',
      developerMessage: 'condicionPagoId inválido.',
      httpStatus: 404,
    })
  }

  const lines = mapInvoiceLinesWithTotals(input.lineas || input.detalles)
  const headers = headerFromLines(lines)
  const monedaId = Number(input.monedaId ?? orden.monedaId)
  const tasaCambio = await resolveTasaCambioOrInput(monedaId, input.tasaCambio, {
    fecha: input.fechaEmision ?? orden.fechaOrden,
  })

  try {
    return await withTransaction(async (conn) => {
      const { codigo } = await numeracionService.generarCodigo('FP', conn)
      const id = await facturaRepo.insert(
        {
          codigo,
          ordenCompraId: orden.id,
          proveedorId,
          numeroFactura: String(input.numeroFactura).trim(),
          ncf: input.ncf ?? null,
          monedaId,
          tasaCambio,
          condicionPagoId: Number(input.condicionPagoId ?? orden.condicionPagoId),
          fechaEmision: input.fechaEmision,
          fechaRecepcionDocumento: input.fechaRecepcionDocumento ?? null,
          fechaVencimiento: input.fechaVencimiento ?? null,
          ...headers,
          estado: ESTADO.REGISTRADA,
          estadoPago: input.estadoPago || ESTADO_PAGO.PENDIENTE,
          activo: true,
          observaciones: input.observaciones ?? null,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleFacturaRepo.insertMany(
        lines.map((l) => ({
          ...l,
          facturaProveedorId: id,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'factura_proveedor',
          entidadId: id,
          accion: 'crear',
          descripcion: `FP ${codigo} registrada para OC ${orden.codigo}`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    if (err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY) {
      throw new PurchaseError('PURCHASE_INVOICE_DUPLICATE_NUMBER', {
        message: 'Ese número de factura ya existe para el proveedor.',
        developerMessage: 'Número de factura duplicado para el proveedor.',
        httpStatus: 409,
      })
    }
    translateDbError(err)
  }
}

async function actualizar(id, input, actorUserId = null) {
  const actual = await getById(id)
  // Regla oficial LibroSys: solo BORRADOR es editable.
  // El DER aprobado de factura_proveedor no incluye 'borrador'
  // (registrada | contabilizada | anulada); por compatibilidad no se altera el ENUM.
  if (String(actual.estado).toLowerCase() !== 'borrador') {
    throw new PurchaseError('PURCHASE_INVOICE_NOT_EDITABLE', {
      message: 'Solo las facturas en borrador pueden editarse.',
      developerMessage: `Edición rechazada: estado documento=${actual.estado}, estado_pago=${actual.estadoPago}.`,
      httpStatus: 409,
    })
  }

  if (actual.estadoPago === ESTADO_PAGO.PAGADA) {
    throw new PurchaseError('PURCHASE_INVOICE_NOT_EDITABLE', {
      message: 'Las facturas pagadas son de solo lectura.',
      developerMessage: 'Intento de editar factura pagada.',
      httpStatus: 409,
    })
  }

  const lines = mapInvoiceLinesWithTotals(input.lineas || input.detalles || actual.detalles)
  const headers = headerFromLines(lines)
  const monedaId = Number(input.monedaId ?? actual.monedaId)
  const tasaCambio = await resolveTasaCambioOrInput(
    monedaId,
    input.tasaCambio !== undefined ? input.tasaCambio : actual.tasaCambio,
    { fecha: input.fechaEmision ?? actual.fechaEmision }
  )

  try {
    return await withTransaction(async (conn) => {
      await facturaRepo.update(
        id,
        {
          numeroFactura:
            input.numeroFactura !== undefined
              ? String(input.numeroFactura).trim()
              : actual.numeroFactura,
          ncf: input.ncf !== undefined ? input.ncf : actual.ncf,
          monedaId,
          tasaCambio,
          condicionPagoId: Number(input.condicionPagoId ?? actual.condicionPagoId),
          fechaEmision: input.fechaEmision ?? actual.fechaEmision,
          fechaRecepcionDocumento:
            input.fechaRecepcionDocumento !== undefined
              ? input.fechaRecepcionDocumento
              : actual.fechaRecepcionDocumento,
          fechaVencimiento:
            input.fechaVencimiento !== undefined ? input.fechaVencimiento : actual.fechaVencimiento,
          ...headers,
          observaciones: input.observaciones !== undefined ? input.observaciones : actual.observaciones,
          updatedBy: actorUserId,
        },
        conn
      )
      await detalleFacturaRepo.deleteByParentId(id, conn)
      await detalleFacturaRepo.insertMany(
        lines.map((l) => ({
          ...l,
          facturaProveedorId: id,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        })),
        conn
      )
      await audit(
        actorUserId,
        {
          entidad: 'factura_proveedor',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `FP ${actual.codigo} actualizada`,
        },
        conn
      )
      return getById(id, conn)
    })
  } catch (err) {
    if (err instanceof PurchaseError || err instanceof ValidationError) throw err
    if (err instanceof DatabaseError && err.code === DATABASE_CODES.DUPLICATE_KEY) {
      throw new PurchaseError('PURCHASE_INVOICE_DUPLICATE_NUMBER', {
        message: 'Ese número de factura ya existe para el proveedor.',
        developerMessage: 'Número de factura duplicado para el proveedor.',
        httpStatus: 409,
      })
    }
    translateDbError(err)
  }
}

async function anular(id, actorUserId = null) {
  const actual = await getById(id)
  if (actual.estado === ESTADO.ANULADA) {
    throw new PurchaseError('PURCHASE_INVOICE_NOT_EDITABLE', {
      message: 'La factura ya está anulada.',
      developerMessage: 'La factura ya está anulada.',
      httpStatus: 409,
    })
  }
  if (actual.estadoPago === ESTADO_PAGO.PAGADA) {
    throw new PurchaseError('PURCHASE_INVOICE_NOT_EDITABLE', {
      message: 'Las facturas pagadas no se pueden anular ni eliminar.',
      developerMessage: 'Anulación rechazada: estado_pago=pagada.',
      httpStatus: 409,
    })
  }
  try {
    return await withTransaction(async (conn) => {
      await facturaRepo.updateEstado(id, ESTADO.ANULADA, { updatedBy: actorUserId }, conn)
      await audit(
        actorUserId,
        {
          entidad: 'factura_proveedor',
          entidadId: id,
          accion: 'actualizar',
          descripcion: `FP ${actual.codigo} anulada`,
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
  getByOrdenCompraId,
  registrar,
  actualizar,
  anular,
}
