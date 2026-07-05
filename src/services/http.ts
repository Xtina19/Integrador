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
    const ax = error as AxiosError<{ error?: string; message?: string }>
    if (ax.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Intente de nuevo.'
    if (!ax.response) return 'No se pudo conectar con el servidor. Verifique que el backend esté activo.'
    const body = ax.response.data
    return body?.error || body?.message || `Error del servidor (${ax.response.status}).`
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

export { http }
