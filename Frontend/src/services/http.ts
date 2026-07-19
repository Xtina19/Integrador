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

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{
      error?: string | { code?: string; message?: string }
      message?: string
      success?: boolean
    }>
    if (ax.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Intente de nuevo.'
    if (!ax.response) return 'No se pudo conectar con el servidor. Verifique que el backend esté activo.'
    const body = ax.response.data
    const nested =
      body?.error && typeof body.error === 'object' ? body.error.message : undefined
    const flat = typeof body?.error === 'string' ? body.error : undefined
    const status = ax.response.status
    const statusHint =
      status === 401
        ? 'No autenticado (401).'
        : status === 403
          ? 'No tiene permiso para esta operación (403).'
          : status === 404
            ? 'Recurso no encontrado (404).'
            : status === 409
              ? 'Conflicto de versión o estado (409).'
              : status === 422
                ? 'Regla de dominio rechazada (422).'
                : status === 502
                  ? 'Fallo de inventario (502).'
                  : status === 400
                    ? 'Solicitud inválida (400).'
                    : undefined
    return nested || flat || body?.message || statusHint || `Error del servidor (${status}).`
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
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
