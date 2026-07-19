import type { ClienteDocumentoTipo, ClienteEstado, ClienteTipo } from '@/types/clientes'

export const CLIENTE_TIPO_OPTIONS: { value: ClienteTipo; label: string }[] = [
  { value: 'persona', label: 'Persona' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'colegio', label: 'Colegio' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'institucion', label: 'Institución' },
]

export const CLIENTE_ESTADO_OPTIONS: { value: ClienteEstado; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'bloqueado', label: 'Bloqueado' },
]

export const CLIENTE_DOCUMENTO_OPTIONS: { value: ClienteDocumentoTipo; label: string }[] = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'rnc', label: 'RNC' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'ninguno', label: 'Sin documento' },
]

export const CLIENTE_SUCURSAL_OPTIONS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'suc-polanco', label: 'Sucursal Polanco' },
  { value: 'suc-villa', label: 'Sucursal Villa Olga' },
  { value: 'suc-central', label: 'Almacén Central' },
]

export function labelClienteTipo(tipo: ClienteTipo): string {
  return CLIENTE_TIPO_OPTIONS.find((o) => o.value === tipo)?.label ?? tipo
}

export function labelClienteEstado(estado: ClienteEstado): string {
  return CLIENTE_ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? estado
}

export function labelClienteDocumento(tipo: ClienteDocumentoTipo): string {
  return CLIENTE_DOCUMENTO_OPTIONS.find((o) => o.value === tipo)?.label ?? tipo
}

export function labelSucursalPreferida(id: string): string {
  if (!id) return '—'
  return CLIENTE_SUCURSAL_OPTIONS.find((o) => o.value === id)?.label ?? id
}

export function formatDop(n: number): string {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)
}
