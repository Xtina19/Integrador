export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo de la petición debe ser un objeto JSON.')
  }
  return body as Record<string, unknown>
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${field} es obligatorio.`)
  }
  return value.trim()
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') {
    throw new ValidationError('Valor de texto inválido.')
  }
  return value.trim()
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`${field} debe ser numérico.`)
  }
  return value
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined
  return requireNumber(value, field)
}

const TIPOS_VENTA = new Set(['consumidor_final', 'cliente_registrado'])
const MONEDAS = new Set(['DOP', 'USD', 'COP'])
const FORMAS_PAGO = new Set(['efectivo', 'tarjeta', 'transferencia', 'nota_credito'])

function parseLineas(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError('lineas es obligatorio y no puede estar vacío.')
  }
  return raw.map((item, i) => {
    const row = item as Record<string, unknown>
    return {
      productoId: requireString(row.productoId, `lineas[${i}].productoId`),
      cantidad: requireNumber(row.cantidad, `lineas[${i}].cantidad`),
      precioUnitario: optionalNumber(row.precioUnitario, `lineas[${i}].precioUnitario`),
      descuentoPorcentaje: optionalNumber(
        row.descuentoPorcentaje,
        `lineas[${i}].descuentoPorcentaje`,
      ),
      descuentoMonto: optionalNumber(row.descuentoMonto, `lineas[${i}].descuentoMonto`),
    }
  })
}

function parsePagos(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError('pagos es obligatorio y no puede estar vacío.')
  }
  return raw.map((item, i) => {
    const row = item as Record<string, unknown>
    const formaPago = requireString(row.formaPago, `pagos[${i}].formaPago`)
    if (!FORMAS_PAGO.has(formaPago)) {
      throw new ValidationError(`pagos[${i}].formaPago inválida.`)
    }
    if (row.referencia !== undefined && row.referencia !== null && String(row.referencia).trim()) {
      throw new ValidationError(
        `pagos[${i}].referencia ya no está soportado. Use notaCreditoId para nota_credito.`,
      )
    }
    const notaCreditoId =
      optionalString(row.notaCreditoId) ?? optionalString(row.nota_credito_id)

    if (formaPago === 'nota_credito') {
      if (!notaCreditoId) {
        throw new ValidationError(
          `pagos[${i}].notaCreditoId es obligatorio cuando formaPago es nota_credito.`,
        )
      }
      return {
        formaPago: formaPago as 'nota_credito',
        monto: requireNumber(row.monto, `pagos[${i}].monto`),
        notaCreditoId,
        montoEntregadoEfectivo: optionalNumber(
          row.montoEntregadoEfectivo,
          `pagos[${i}].montoEntregadoEfectivo`,
        ),
      }
    }

    return {
      formaPago: formaPago as 'efectivo' | 'tarjeta' | 'transferencia',
      monto: requireNumber(row.monto, `pagos[${i}].monto`),
      montoEntregadoEfectivo: optionalNumber(
        row.montoEntregadoEfectivo,
        `pagos[${i}].montoEntregadoEfectivo`,
      ),
    }
  })
}

/** Cuerpo HTTP para emitir venta (incluye pagos / pago mixto). */
export function validateEmitirVentaBody(body: unknown) {
  const b = asRecord(body)
  const tipoVenta = requireString(b.tipoVenta, 'tipoVenta')
  if (!TIPOS_VENTA.has(tipoVenta)) {
    throw new ValidationError('tipoVenta inválido.')
  }
  const moneda = requireString(b.moneda, 'moneda')
  if (!MONEDAS.has(moneda)) {
    throw new ValidationError('moneda inválida.')
  }
  return {
    tipoVenta: tipoVenta as 'consumidor_final' | 'cliente_registrado',
    clienteId: optionalString(b.clienteId),
    clienteSnapshot: parseClienteSnapshot(b.clienteSnapshot),
    sucursalId: requireString(b.sucursalId, 'sucursalId'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    moneda: moneda as 'DOP' | 'USD' | 'COP',
    lineas: parseLineas(b.lineas),
    pagos: parsePagos(b.pagos),
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
  }
}

function parseClienteSnapshot(
  raw: unknown,
): { nombre: string; activo: boolean } | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ValidationError('clienteSnapshot inválido.')
  }
  const row = raw as Record<string, unknown>
  return {
    nombre: requireString(row.nombre, 'clienteSnapshot.nombre'),
    activo: row.activo !== false,
  }
}

export function validateEmitirConPagoUnicoBody(body: unknown) {
  const dto = validateEmitirVentaBody(body)
  if (dto.pagos.length !== 1) {
    throw new ValidationError('Registrar pago requiere exactamente un pago.')
  }
  return dto
}

export function validateEmitirPagoMixtoBody(body: unknown) {
  const dto = validateEmitirVentaBody(body)
  if (dto.pagos.length < 2) {
    throw new ValidationError('Pago mixto requiere al menos dos pagos.')
  }
  return dto
}

export function validateRegistrarCambioBody(body: unknown) {
  const b = asRecord(body)
  const lineasDevueltas = b.lineasDevueltas
  const lineasNuevas = b.lineasNuevas
  if (!Array.isArray(lineasDevueltas) || lineasDevueltas.length === 0) {
    throw new ValidationError('lineasDevueltas es obligatorio.')
  }
  // lineasNuevas puede ser [] (cambio sin producto de salida).
  if (lineasNuevas !== undefined && lineasNuevas !== null && !Array.isArray(lineasNuevas)) {
    throw new ValidationError('lineasNuevas debe ser un arreglo.')
  }
  const nuevasArr = Array.isArray(lineasNuevas) ? lineasNuevas : []

  let compensacionCliente: 'devolucion_dinero' | 'nota_credito' | undefined
  if (b.compensacionCliente !== undefined && b.compensacionCliente !== null && b.compensacionCliente !== '') {
    const raw = requireString(b.compensacionCliente, 'compensacionCliente')
    if (raw !== 'devolucion_dinero' && raw !== 'nota_credito') {
      throw new ValidationError(
        'compensacionCliente debe ser devolucion_dinero o nota_credito.',
      )
    }
    compensacionCliente = raw
  }

  let pagoDiferencia:
    | {
        formaPago: 'efectivo' | 'tarjeta' | 'transferencia'
        monto: number
        montoEntregadoEfectivo?: number
      }
    | undefined
  if (b.pagoDiferencia !== undefined && b.pagoDiferencia !== null) {
    const p = asRecord(b.pagoDiferencia)
    const formaPago = requireString(p.formaPago, 'pagoDiferencia.formaPago')
    if (!FORMAS_PAGO.has(formaPago)) {
      throw new ValidationError('pagoDiferencia.formaPago inválida.')
    }
    if (p.referencia !== undefined && p.referencia !== null && String(p.referencia).trim()) {
      throw new ValidationError('pagoDiferencia.referencia ya no está soportado.')
    }
    pagoDiferencia = {
      formaPago: formaPago as 'efectivo' | 'tarjeta' | 'transferencia',
      monto: requireNumber(p.monto, 'pagoDiferencia.monto'),
      montoEntregadoEfectivo: optionalNumber(
        p.montoEntregadoEfectivo,
        'pagoDiferencia.montoEntregadoEfectivo',
      ),
    }
  }

  return {
    lineasDevueltas: lineasDevueltas.map((item, i) => {
      const row = item as Record<string, unknown>
      return {
        productoId: requireString(row.productoId, `lineasDevueltas[${i}].productoId`),
        cantidad: requireNumber(row.cantidad, `lineasDevueltas[${i}].cantidad`),
      }
    }),
    lineasNuevas: nuevasArr.map((item, i) => {
      const row = item as Record<string, unknown>
      return {
        productoId: requireString(row.productoId, `lineasNuevas[${i}].productoId`),
        cantidad: requireNumber(row.cantidad, `lineasNuevas[${i}].cantidad`),
        precioUnitario: optionalNumber(row.precioUnitario, `lineasNuevas[${i}].precioUnitario`),
      }
    }),
    compensacionCliente,
    pagoDiferencia,
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
    expectedVersion: optionalNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateEmitirNotaCreditoBody(body: unknown) {
  const b = asRecord(body)
  return {
    monto: requireNumber(b.monto, 'monto'),
    motivo: requireString(b.motivo, 'motivo'),
    expectedVersion: optionalNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateAnularNotaCreditoBody(body: unknown) {
  const b = asRecord(body)
  return {
    motivo: optionalString(b.motivo),
    expectedVersion: optionalNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateRevertirAplicacionesNotaCreditoBody(body: unknown) {
  const b = asRecord(body)
  return {
    expectedVersion: optionalNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateAnularVentaBody(body: unknown) {
  const b = asRecord(body)
  return {
    motivo: requireString(b.motivo, 'motivo'),
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
    expectedVersion: optionalNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateListVentasQuery(query: Record<string, unknown>) {
  const estado = optionalString(query.estado)
  if (estado && estado !== 'emitida' && estado !== 'anulada') {
    throw new ValidationError('estado debe ser emitida o anulada.')
  }
  const limitRaw = query.limit
  const offsetRaw = query.offset
  return {
    sucursalId: optionalString(query.sucursalId),
    estado: estado as 'emitida' | 'anulada' | undefined,
    clienteId: optionalString(query.clienteId),
    desde: optionalString(query.desde),
    hasta: optionalString(query.hasta),
    numeroFactura: optionalString(query.numeroFactura),
    limit:
      limitRaw === undefined || limitRaw === ''
        ? undefined
        : requireNumber(Number(limitRaw), 'limit'),
    offset:
      offsetRaw === undefined || offsetRaw === ''
        ? undefined
        : requireNumber(Number(offsetRaw), 'offset'),
  }
}
