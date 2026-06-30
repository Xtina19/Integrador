import {
  collectErrors,
  requireSelect,
  requireText,
  toValidationResult,
  validateCode,
  validateDate,
  validateDescription,
  validateEmail,
  validatePhone,
  validatePositiveDecimal,
  validateUnique,
  trim,
  type ValidationResult,
} from '../utils/formValidation'

export interface AdminProductForm {
  code: string
  isbn: string
  title: string
  author?: string
  category: string
  publisher: string
  price: string | number
  currency: string
  status?: string
  notes?: string
}

export interface AdminCategoryForm {
  name: string
  description: string
  status?: string
}

export interface AdminPublisherForm {
  name: string
  country: string
  contact: string
  phone: string
  address: string
  contractType?: string
  contractExpiry?: string
  status?: string
}

export interface AdminBranchForm {
  name: string
  code: string
  address: string
  phone: string
  manager: string
  status?: string
}

export interface AdminSupplierForm {
  name: string
  code: string
  type: string
  country: string
  contact: string
  phone: string
  email: string
  status?: string
}

export interface AdminCurrencyForm {
  code: string
  name: string
  symbol: string
  status?: string
}

export interface AdminExchangeRateForm {
  fromCurrency: string
  toCurrency: string
  rate: string | number
  date: string
}

export function validateAdminProduct(
  form: AdminProductForm,
  existingCodes: string[],
  existingIsbns: string[],
  excludeCode?: string,
  excludeIsbn?: string
): ValidationResult {
  const errors = collectErrors(
    validateCode(form.code, 'Código'),
    requireText(form.isbn, 'ISBN', 10, 20),
    requireText(form.title, 'Título'),
    requireSelect(form.category, 'una categoría'),
    requireSelect(form.publisher, 'una editorial'),
    validatePositiveDecimal(form.price, 'Precio'),
    requireSelect(form.currency, 'una moneda'),
    validateUnique(form.code, existingCodes, 'código', excludeCode),
    validateUnique(form.isbn, existingIsbns, 'ISBN', excludeIsbn),
    form.notes ? validateDescription(form.notes) : null
  )
  return toValidationResult(errors)
}

export function validateAdminCategory(
  form: AdminCategoryForm,
  existingNames: string[],
  excludeName?: string
): ValidationResult {
  const errors = collectErrors(
    requireText(form.name, 'Nombre'),
    requireText(form.description, 'Descripción', 3, 500),
    validateDescription(form.description),
    validateUnique(form.name, existingNames, 'nombre', excludeName)
  )
  return toValidationResult(errors)
}

export function validateAdminPublisher(
  form: AdminPublisherForm,
  existingNames: string[],
  excludeName?: string
): ValidationResult {
  const errors = collectErrors(
    requireText(form.name, 'Nombre'),
    requireText(form.country, 'País', 2, 80),
    requireText(form.contact, 'Contacto'),
    validatePhone(form.phone),
    requireText(form.address, 'Dirección', 5, 200),
    form.contractExpiry ? validateDate(form.contractExpiry, 'Fecha de vencimiento') : null,
    validateUnique(form.name, existingNames, 'nombre', excludeName)
  )
  return toValidationResult(errors)
}

export function validateAdminBranch(
  form: AdminBranchForm,
  existingCodes: string[],
  existingNames: string[],
  excludeCode?: string,
  excludeName?: string
): ValidationResult {
  const errors = collectErrors(
    requireText(form.name, 'Nombre'),
    validateCode(form.code, 'Código de sucursal'),
    requireText(form.address, 'Dirección', 5, 200),
    validatePhone(form.phone),
    requireText(form.manager, 'Gerente'),
    validateUnique(form.code, existingCodes, 'código', excludeCode),
    validateUnique(form.name, existingNames, 'nombre', excludeName)
  )
  return toValidationResult(errors)
}

export function validateAdminSupplier(
  form: AdminSupplierForm,
  existingCodes: string[],
  existingNames: string[],
  excludeCode?: string,
  excludeName?: string
): ValidationResult {
  const errors = collectErrors(
    requireText(form.name, 'Nombre'),
    validateCode(form.code, 'Código'),
    requireSelect(form.type, 'un tipo de proveedor'),
    requireText(form.country, 'País', 2, 80),
    requireText(form.contact, 'Contacto'),
    validatePhone(form.phone),
    validateEmail(form.email),
    validateUnique(form.code, existingCodes, 'código', excludeCode),
    validateUnique(form.name, existingNames, 'nombre', excludeName)
  )
  return toValidationResult(errors)
}

export function validateAdminCurrency(
  form: AdminCurrencyForm,
  existingCodes: string[],
  excludeCode?: string
): ValidationResult {
  const errors = collectErrors(
    validateCode(form.code, 'Código de moneda'),
    requireText(form.name, 'Nombre', 2, 80),
    requireText(form.symbol, 'Símbolo', 1, 5),
    validateUnique(form.code, existingCodes, 'código', excludeCode)
  )
  return toValidationResult(errors)
}

export function validateAdminExchangeRate(form: AdminExchangeRateForm): ValidationResult {
  const errors = collectErrors(
    requireSelect(form.fromCurrency, 'moneda origen'),
    requireSelect(form.toCurrency, 'moneda destino'),
    validatePositiveDecimal(form.rate, 'Tasa'),
    validateDate(form.date, 'Fecha'),
    trim(form.fromCurrency) === trim(form.toCurrency) ? 'Las monedas origen y destino deben ser diferentes.' : null
  )
  return toValidationResult(errors)
}

export function validateAdminPublisherContract(form: AdminPublisherForm): ValidationResult {
  const errors = collectErrors(
    requireText(form.name, 'Nombre'),
    requireText(form.country, 'País', 2, 80),
    requireText(form.contact, 'Contacto'),
    validatePhone(form.phone),
    requireText(form.address, 'Dirección', 5, 200),
    form.contractType ? requireSelect(form.contractType, 'un tipo de contrato') : null,
    form.contractExpiry ? validateDate(form.contractExpiry, 'Fecha de vencimiento') : null
  )
  return toValidationResult(errors)
}
