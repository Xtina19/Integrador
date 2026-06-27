import type { PurchaseOrderLine } from '../types/domain'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateEventDates(startDate: string, endDate: string): ValidationResult {
  const errors: string[] = []
  if (!startDate || !endDate) {
    errors.push('Las fechas de inicio y fin son obligatorias.')
  } else if (endDate < startDate) {
    errors.push('La fecha final no puede ser menor a la fecha inicial.')
  }
  return { valid: errors.length === 0, errors }
}

export function validatePurchaseOrder(lines: PurchaseOrderLine[], supplier: string): ValidationResult {
  const errors: string[] = []
  if (!supplier?.trim()) errors.push('Debe seleccionar un proveedor.')
  if (!lines.length) errors.push('No se puede aprobar una orden sin productos.')
  if (lines.some((l) => l.qty <= 0)) errors.push('Cada línea debe tener cantidad mayor a cero.')
  return { valid: errors.length === 0, errors }
}

export function validateInventoryAdjustment(qty: number): ValidationResult {
  const errors: string[] = []
  if (qty <= 0) errors.push('No se permite un ajuste con cantidad igual o menor a cero.')
  return { valid: errors.length === 0, errors }
}

export function validateShipment(supplier: string, code: string): ValidationResult {
  const errors: string[] = []
  if (!code?.trim()) errors.push('El código de embarque es obligatorio.')
  if (!supplier?.trim()) errors.push('No se permite registrar un embarque sin proveedor.')
  return { valid: errors.length === 0, errors }
}

export function validateTransferFinalize(status: string): ValidationResult {
  if (status !== 'received') {
    return { valid: false, errors: ['No se puede finalizar una transferencia que no ha sido recibida.'] }
  }
  return { valid: true, errors: [] }
}
