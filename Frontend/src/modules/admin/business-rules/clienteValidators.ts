import type { ClienteDocumentoTipo, ClienteInput, ClienteTipo } from '@/types/clientes'
import { trim } from '@/utils/formValidation'

const TIPOS_CON_INSTITUCION: ClienteTipo[] = ['colegio', 'universidad', 'institucion']
const TIPOS_DOCUMENTO_OBLIGATORIO: ClienteTipo[] = ['empresa', 'colegio', 'universidad', 'institucion']

export function documentoRequeridoParaTipo(tipo: ClienteTipo): boolean {
  return TIPOS_DOCUMENTO_OBLIGATORIO.includes(tipo)
}

export function institucionRequeridaParaTipo(tipo: ClienteTipo): boolean {
  return TIPOS_CON_INSTITUCION.includes(tipo)
}

export function documentoTipoSugerido(tipo: ClienteTipo): ClienteDocumentoTipo {
  if (tipo === 'persona') return 'cedula'
  if (tipo === 'empresa' || tipo === 'colegio' || tipo === 'universidad' || tipo === 'institucion') {
    return 'rnc'
  }
  return 'ninguno'
}

export function validateCliente(
  input: ClienteInput,
  options?: {
    documentosExistentes?: string[]
    excludeId?: string
    documentoActual?: string
    modo?: 'completo' | 'alta_rapida'
  },
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const nombre = trim(input.nombre)
  const documento = trim(input.documento)
  const telefono = trim(input.telefono)
  const modo = options?.modo ?? 'completo'

  if (!nombre) errors.push('El nombre / razón social es obligatorio.')
  if (nombre.length > 120) errors.push('El nombre no puede superar 120 caracteres.')

  if (!input.tipo) errors.push('Seleccione el tipo de cliente.')

  if (documentoRequeridoParaTipo(input.tipo) && !documento) {
    errors.push('El documento (RNC) es obligatorio para este tipo de cliente.')
  }

  if (documento && input.documentoTipo === 'ninguno') {
    errors.push('Indique el tipo de documento o deje el documento vacío.')
  }

  if (documento) {
    const otros = (options?.documentosExistentes ?? []).filter((d) => {
      if (!d) return false
      if (options?.excludeId && options.documentoActual && d === options.documentoActual) return false
      return true
    })
    const dup = otros.some((d) => d.toLowerCase() === documento.toLowerCase())
    if (dup) errors.push('Ya existe un cliente con ese documento.')
  }

  if (modo === 'alta_rapida' && !telefono) {
    errors.push('El teléfono es obligatorio en el alta rápida de mostrador.')
  }

  if (institucionRequeridaParaTipo(input.tipo) && !trim(input.institucion)) {
    errors.push('Indique la institución / dependencia.')
  }

  if (trim(input.observaciones).length > 200) {
    errors.push('Las observaciones no pueden superar 200 caracteres.')
  }

  if (input.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(input.correo))) {
    errors.push('El correo no es válido.')
  }

  if (modo === 'completo' && !input.estado) {
    errors.push('Seleccione el estado del cliente.')
  }

  return { valid: errors.length === 0, errors }
}
