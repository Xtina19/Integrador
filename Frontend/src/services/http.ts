import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { apiConfig } from '@/config/api'

export class ApiError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.code = options?.code
    this.details = options?.details
  }
}

const USER_MSG = {
  network:
    'No fue posible cargar la información en este momento. Intente nuevamente o contacte al administrador del sistema.',
  timeout:
    'La operación está tardando más de lo esperado. Intente nuevamente en unos momentos.',
  unauthorized: 'Su sesión no es válida o ha expirado. Vuelva a iniciar sesión.',
  forbidden: 'No tiene permiso para realizar esta operación.',
  notFound: 'No se encontró la información solicitada.',
  conflict: 'No fue posible completar la operación por un conflicto de estado. Actualice e intente de nuevo.',
  validation: 'Revise los datos ingresados e intente nuevamente.',
  server:
    'No fue posible completar la operación en este momento. Intente nuevamente o contacte al administrador del sistema.',
  unexpected: 'Ocurrió un error inesperado. Intente nuevamente o contacte al administrador del sistema.',
} as const

function logTechnicalError(error: unknown, userMessage: string): void {
  if (typeof console === 'undefined' || typeof console.error !== 'function') return
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError
    console.error('[LibroSys API]', {
      userMessage,
      code: ax.code,
      status: ax.response?.status,
      url: ax.config?.url,
      method: ax.config?.method,
      responseData: ax.response?.data,
      message: ax.message,
    })
    return
  }
  console.error('[LibroSys]', userMessage, error)
}

/**
 * Mensaje orientado a usuario final (producción).
 * Los detalles técnicos se registran en consola, no en la UI.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // ApiError ya fue normalizado; no re-loguear en cadena.
    return error.message
  }

  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{
      error?: string | { code?: string; message?: string }
      message?: string
      success?: boolean
    }>

    let userMessage: string = USER_MSG.server

    if (ax.code === 'ECONNABORTED') {
      userMessage = USER_MSG.timeout
    } else if (!ax.response) {
      userMessage = USER_MSG.network
    } else {
      const status = ax.response.status
      const body = ax.response.data
      const nested =
        body?.error && typeof body.error === 'object' ? body.error.message : undefined
      const flat = typeof body?.error === 'string' ? body.error : undefined
      const domainMsg = nested || flat || body?.message

      // Mensajes de dominio (validación de negocio) sí pueden mostrarse si son claros.
      const looksTechnical =
        !domainMsg ||
        /\b(ECONN|SQL|stack|Exception|TypeError|at\s+\S+\s+\()/i.test(String(domainMsg)) ||
        /backend|servidor|localhost|:\d{2,5}/i.test(String(domainMsg))

      if (domainMsg && !looksTechnical) {
        userMessage = String(domainMsg)
      } else if (status === 401) {
        userMessage = USER_MSG.unauthorized
      } else if (status === 403) {
        userMessage = USER_MSG.forbidden
      } else if (status === 404) {
        userMessage = USER_MSG.notFound
      } else if (status === 409) {
        userMessage = USER_MSG.conflict
      } else if (status === 400 || status === 422) {
        userMessage = USER_MSG.validation
      } else {
        userMessage = USER_MSG.server
      }
    }

    logTechnicalError(error, userMessage)
    return userMessage
  }

  if (error instanceof Error) {
    const looksTechnical =
      /\b(ECONN|SQL|stack|Exception|TypeError)\b/i.test(error.message) ||
      /backend|servidor|localhost/i.test(error.message)
    const userMessage = looksTechnical ? USER_MSG.unexpected : error.message || USER_MSG.unexpected
    logTechnicalError(error, userMessage)
    return userMessage
  }

  logTechnicalError(error, USER_MSG.unexpected)
  return USER_MSG.unexpected
}

const http = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: apiConfig.headers,
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const ax = error as AxiosError<{ error?: string; message?: string }>
      throw new ApiError(getFriendlyErrorMessage(error), {
        status: ax.response?.status,
        code: ax.code,
        details: ax.response?.data,
      })
    }
    throw error
  }
)

export async function httpGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config)
  return data
}

export async function httpPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<T>(url, body, config)
  return data
}

export async function httpPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.put<T>(url, body, config)
  return data
}

export async function httpDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<T>(url, config)
  return data
}

export async function httpPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.patch<T>(url, body, config)
  return data
}

export { http }
