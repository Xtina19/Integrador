export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function trim(value: string): string {
  return value.trim()
}

export function isBlank(value: string): boolean {
  return !value || !value.trim()
}

export function toValidationResult(errors: string[]): ValidationResult {
  return { valid: errors.length === 0, errors }
}

export function collectErrors(...items: (string | null | undefined)[]): string[] {
  return items.filter((e): e is string => Boolean(e))
}

export function requireText(
  value: string,
  fieldLabel: string,
  min = 3,
  max = 100
): string | null {
  const v = trim(value)
  if (!v) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  if (v.length < min) return `${fieldLabel} debe tener al menos ${min} caracteres.`
  if (v.length > max) return `${fieldLabel} no puede superar ${max} caracteres.`
  return null
}

export function requireSelect(value: string, fieldLabel: string): string | null {
  if (isBlank(value)) return `Seleccione ${fieldLabel.toLowerCase()}.`
  return null
}

export function validateCode(value: string, fieldLabel = 'Código'): string | null {
  const v = trim(value)
  if (!v) return `Debe ingresar un ${fieldLabel.toLowerCase()}.`
  if (/\s/.test(v)) return `${fieldLabel} no puede contener espacios.`
  if (v.length < 2) return `${fieldLabel} debe tener al menos 2 caracteres.`
  if (v.length > 50) return `${fieldLabel} no puede superar 50 caracteres.`
  return null
}

export function validateDescription(value: string, max = 500): string | null {
  if (value.length > max) return `La descripción no puede superar ${max} caracteres.`
  return null
}

export function parseNumber(value: number | string): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const v = trim(value)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function validatePositiveInt(value: number | string, fieldLabel: string): string | null {
  const n = parseNumber(value)
  if (n === null) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  if (!Number.isInteger(n)) return `${fieldLabel} debe ser un número entero.`
  if (n <= 0) return `${fieldLabel} debe ser mayor que cero.`
  return null
}

export function validateNonNegative(value: number | string, fieldLabel: string): string | null {
  const n = parseNumber(value)
  if (n === null) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  if (n < 0) return `No se permiten valores negativos en ${fieldLabel.toLowerCase()}.`
  return null
}

export function validatePositiveDecimal(value: number | string, fieldLabel: string): string | null {
  const n = parseNumber(value)
  if (n === null) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  if (n <= 0) return `${fieldLabel} debe ser mayor que cero.`
  return null
}

export function validatePercentage(value: number | string, fieldLabel = 'Porcentaje'): string | null {
  const n = parseNumber(value)
  if (n === null) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  if (n < 0 || n > 100) return `${fieldLabel} debe estar entre 0 y 100.`
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | null {
  const v = trim(value)
  if (!v) return 'Debe ingresar un correo electrónico.'
  if (!EMAIL_RE.test(v)) return 'Ingrese un correo electrónico válido.'
  return null
}

const PHONE_RE = /^[\d\s()+-]{7,20}$/

export function validatePhone(value: string): string | null {
  const v = trim(value)
  if (!v) return 'Debe ingresar un teléfono.'
  if (!PHONE_RE.test(v)) return 'Ingrese un teléfono válido.'
  return null
}

export function validateDate(value: string, fieldLabel = 'Fecha'): string | null {
  if (isBlank(value)) return `Debe ingresar ${fieldLabel.toLowerCase()}.`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return `${fieldLabel} no es válida.`
  return null
}

export function validateDateOrder(start: string, end: string): string | null {
  if (start && end && end < start) {
    return 'La fecha final no puede ser menor a la fecha inicial.'
  }
  return null
}

export function validateUnique(
  value: string,
  existing: string[],
  fieldLabel: string,
  exclude?: string
): string | null {
  const v = trim(value).toLowerCase()
  const excludeNorm = exclude ? trim(exclude).toLowerCase() : undefined
  if (excludeNorm && v === excludeNorm) return null
  const duplicate = existing.some((item) => {
    const norm = trim(item).toLowerCase()
    return norm === v && norm !== excludeNorm
  })
  if (duplicate) return `Ya existe un registro con ese ${fieldLabel.toLowerCase()}.`
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Debe ingresar una contraseña.'
  if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  return null
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Las contraseñas no coinciden.'
  return null
}
