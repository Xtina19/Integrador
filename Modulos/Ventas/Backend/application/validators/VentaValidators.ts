import type { EmitirVentaCommand } from '../commands/VentaCommands'
import { fail, type ApplicationResult } from '../results/ApplicationResult'

export function validateEmitirVentaCommand(
  cmd: EmitirVentaCommand,
): ApplicationResult<EmitirVentaCommand> {
  if (!cmd.sucursalId?.trim() || !cmd.almacenId?.trim()) {
    return fail('VALIDATION', 'sucursalId y almacenId son obligatorios.')
  }
  if (!cmd.usuarioId?.trim()) {
    return fail('VALIDATION', 'usuarioId es obligatorio.')
  }
  if (!cmd.idempotencyKey?.trim()) {
    return fail('VALIDATION', 'idempotencyKey es obligatorio.')
  }
  if (!cmd.lineas?.length) {
    return fail('VALIDATION', 'Se requiere al menos una línea.')
  }
  if (!cmd.pagos?.length) {
    return fail('VALIDATION', 'Se requiere al menos un pago.')
  }
  for (const linea of cmd.lineas) {
    if (!linea.productoId?.trim()) {
      return fail('VALIDATION', 'Cada línea requiere productoId.')
    }
    if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
      return fail('VALIDATION', 'Cada línea requiere cantidad entera > 0.')
    }
  }
  for (const pago of cmd.pagos) {
    if (!pago.formaPago) {
      return fail('VALIDATION', 'Cada pago requiere formaPago.')
    }
    if (!(pago.monto > 0)) {
      return fail('VALIDATION', 'Cada pago requiere monto > 0.')
    }
  }
  if (cmd.tipoVenta === 'cliente_registrado' && !cmd.clienteId?.trim()) {
    return fail('VALIDATION', 'clienteId es obligatorio para Cliente Registrado.')
  }
  return { ok: true, value: cmd }
}

export function validateId(id: string | undefined, field = 'id'): ApplicationResult<string> {
  if (!id?.trim()) {
    return fail('VALIDATION', `${field} es obligatorio.`)
  }
  return { ok: true, value: id.trim() }
}
