import type { PurchaseOrderLine } from '../types/domain'
import {
  collectErrors,
  requireSelect,
  requireText,
  toValidationResult,
  validateCode,
  validateDate,
  validateDateOrder,
  validateDescription,
  validateEmail,
  validateNonNegative,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validatePositiveDecimal,
  validatePositiveInt,
  validateUnique,
  trim,
  type ValidationResult,
} from '../utils/formValidation'

export type { ValidationResult }

export function validateEventDates(startDate: string, endDate: string): ValidationResult {
  const errors = collectErrors(
    validateDate(startDate, 'Fecha de inicio'),
    validateDate(endDate, 'Fecha de finalización'),
    validateDateOrder(startDate, endDate)
  )
  return toValidationResult(errors)
}

export function validatePurchaseOrder(lines: PurchaseOrderLine[], supplier: string): ValidationResult {
  const errors = collectErrors(
    requireSelect(supplier, 'un proveedor'),
    !lines.length ? 'No se puede guardar una orden sin productos.' : null,
    lines.some((l) => !trim(l.product)) ? 'Cada línea debe tener un producto seleccionado.' : null,
    lines.some((l) => l.qty <= 0) ? 'Cada línea debe tener cantidad mayor a cero.' : null,
    lines.some((l) => l.unitCost < 0) ? 'No se permiten costos unitarios negativos.' : null
  )
  return toValidationResult(errors)
}

export function validatePurchaseOrderCreate(
  orderNumber: string,
  supplier: string,
  date: string,
  currency: string,
  lines: PurchaseOrderLine[],
  existingOrderIds: string[],
  excludeOrderId?: string
): ValidationResult {
  const lineValidation = validatePurchaseOrder(lines, supplier)
  const errors = collectErrors(
    validateCode(orderNumber, 'Número de orden'),
    requireSelect(supplier, 'un proveedor'),
    validateDate(date, 'Fecha'),
    requireSelect(currency, 'una moneda'),
    validateUnique(orderNumber, existingOrderIds, 'número de orden', excludeOrderId)
  )
  return toValidationResult([...new Set([...errors, ...lineValidation.errors])])
}

export function validateInventoryAdjustment(qty: number, reason?: string, productTitle?: string): ValidationResult {
  const errors = collectErrors(
    requireSelect(productTitle ?? '', 'un producto'),
    qty <= 0 ? 'No se permite un ajuste con cantidad igual o menor a cero.' : null,
    reason !== undefined ? requireText(reason, 'Motivo', 3, 200) : null
  )
  return toValidationResult(errors)
}

export interface ProductFormInput {
  code: string
  isbn: string
  name: string
  category: string
  publisher: string
  supplier?: string
  cost: number | string
  price: number | string
  stock: number | string
  minStock: number | string
  location: string
}

export function validateProduct(
  input: ProductFormInput,
  existingCodes: string[],
  existingIsbns: string[],
  excludeCode?: string,
  excludeIsbn?: string
): ValidationResult {
  const errors = collectErrors(
    validateCode(input.code, 'Código'),
    requireText(input.isbn, 'ISBN', 10, 20),
    requireText(input.name, 'Nombre'),
    requireSelect(input.category, 'una categoría'),
    requireSelect(input.publisher, 'una editorial'),
    input.supplier ? requireSelect(input.supplier, 'un proveedor') : null,
    validateNonNegative(input.cost, 'Costo'),
    validatePositiveDecimal(input.price, 'Precio'),
    validateNonNegative(input.stock, 'Stock'),
    validateNonNegative(input.minStock, 'Stock mínimo'),
    requireText(input.location, 'Ubicación', 2, 100),
    validateUnique(input.code, existingCodes, 'código', excludeCode),
    validateUnique(input.isbn, existingIsbns, 'ISBN', excludeIsbn)
  )
  return toValidationResult(errors)
}

export function validateShipment(supplier: string, code: string): ValidationResult {
  const errors = collectErrors(
    validateCode(code, 'Código de embarque'),
    requireSelect(supplier, 'un proveedor')
  )
  return toValidationResult(errors)
}

export interface ShipmentFormInput {
  code: string
  supplier: string
  origin: string
  destination: string
  departure: string
  arrival: string
  boxes: number | string
  invoiceId?: string
}

export function validateShipmentForm(
  input: ShipmentFormInput,
  existingCodes: string[],
  excludeCode?: string
): ValidationResult {
  const base = validateShipment(input.supplier, input.code)
  const errors = collectErrors(
    input.invoiceId !== undefined ? requireSelect(input.invoiceId, 'una factura internacional') : null,
    requireText(input.origin, 'Origen', 2, 120),
    requireText(input.destination, 'Destino', 2, 120),
    validateDate(input.departure, 'Fecha de salida'),
    validateDate(input.arrival, 'Fecha estimada de llegada'),
    validateDateOrder(input.departure, input.arrival),
    validatePositiveInt(input.boxes, 'Cantidad de cajas'),
    validateUnique(input.code, existingCodes, 'código de embarque', excludeCode)
  )
  return toValidationResult([...new Set([...errors, ...base.errors])])
}

export function validateTransferFinalize(status: string): ValidationResult {
  if (status !== 'received') {
    return { valid: false, errors: ['No se puede finalizar una transferencia que no ha sido recibida.'] }
  }
  return { valid: true, errors: [] }
}

export interface TransferFormInput {
  origin: string
  destination: string
  product: string
  qty: number | string
  transport?: string
}

export function validateTransfer(input: TransferFormInput): ValidationResult {
  const errors = collectErrors(
    requireSelect(input.origin, 'sucursal de origen'),
    requireSelect(input.destination, 'sucursal de destino'),
    requireSelect(input.product, 'un producto'),
    validatePositiveInt(input.qty, 'Cantidad'),
    trim(input.origin) === trim(input.destination) ? 'Origen y destino deben ser diferentes.' : null,
    input.transport ? requireText(input.transport, 'Transporte', 2, 100) : null
  )
  return toValidationResult(errors)
}

export interface EventFormInput {
  name: string
  type: string
  startDate: string
  endDate: string
  location: string
  publisher: string
  budget: number | string
  responsible: string
}

export function validateEvent(input: EventFormInput): ValidationResult {
  const errors = collectErrors(
    requireText(input.name, 'Nombre del evento'),
    requireSelect(input.type, 'un tipo de evento'),
    ...validateEventDates(input.startDate, input.endDate).errors.map((e) => e),
    requireText(input.location, 'Lugar', 3, 150),
    requireSelect(input.publisher, 'una editorial'),
    validateNonNegative(input.budget, 'Presupuesto'),
    requireSelect(input.responsible, 'un responsable')
  )
  return toValidationResult(errors)
}

export interface UserFormInput {
  fullName: string
  email: string
  phone: string
  role: string
  branch: string
  username: string
  password: string
  confirmPassword: string
}

export function validateUser(
  input: UserFormInput,
  existingUsernames: string[],
  existingEmails: string[]
): ValidationResult {
  const errors = collectErrors(
    requireText(input.fullName, 'Nombre completo'),
    validateEmail(input.email),
    validatePhone(input.phone),
    requireSelect(input.role, 'un rol'),
    requireSelect(input.branch, 'una sucursal'),
    requireText(input.username, 'Usuario', 3, 50),
    /\s/.test(input.username) ? 'El usuario no puede contener espacios.' : null,
    validatePassword(input.password),
    validatePasswordMatch(input.password, input.confirmPassword),
    validateUnique(input.username, existingUsernames, 'usuario'),
    validateUnique(input.email, existingEmails, 'correo')
  )
  return toValidationResult(errors)
}

export interface CostingFormInput {
  product: string
  newCost: number | string
  costType: string
  notes?: string
}

export function validateCosting(input: CostingFormInput): ValidationResult {
  const errors = collectErrors(
    requireSelect(input.product, 'un producto'),
    validatePositiveDecimal(input.newCost, 'Nuevo costo'),
    requireSelect(input.costType, 'un tipo de costeo'),
    input.notes ? validateDescription(input.notes) : null
  )
  return toValidationResult(errors)
}

export interface ReceptionUpdateInput {
  date: string
  items: number
}

export function validateReceptionUpdate(input: ReceptionUpdateInput): ValidationResult {
  const errors = collectErrors(
    validateDate(input.date, 'Fecha'),
    validatePositiveInt(input.items, 'Cantidad de ítems')
  )
  return toValidationResult(errors)
}

export interface SupplierInvoiceUpdateInput {
  invoiceNumber: string
  date: string
  amount: number | string
  currency: string
}

export function validateSupplierInvoiceUpdate(input: SupplierInvoiceUpdateInput): ValidationResult {
  const errors = collectErrors(
    requireText(input.invoiceNumber, 'Número de factura', 2, 50),
    validateDate(input.date, 'Fecha'),
    validatePositiveDecimal(input.amount, 'Monto'),
    requireSelect(input.currency, 'una moneda')
  )
  return toValidationResult(errors)
}

export interface InternationalInvoiceUpdateInput {
  supplier: string
  date: string
  currency: string
  amount: number | string
}

export function validateInternationalInvoiceUpdate(input: InternationalInvoiceUpdateInput): ValidationResult {
  const errors = collectErrors(
    requireSelect(input.supplier, 'un proveedor'),
    validateDate(input.date, 'Fecha'),
    requireSelect(input.currency, 'una moneda'),
    validatePositiveDecimal(input.amount, 'Monto')
  )
  return toValidationResult(errors)
}

export interface ConsolidationUpdateInput {
  name: string
  status: string
  notes?: string
}

export function validateConsolidationUpdate(input: ConsolidationUpdateInput): ValidationResult {
  const errors = collectErrors(
    requireText(input.name, 'Nombre'),
    requireSelect(input.status, 'un estado'),
    input.notes ? validateDescription(input.notes) : null
  )
  return toValidationResult(errors)
}
