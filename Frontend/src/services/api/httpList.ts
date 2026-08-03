import { httpGet } from '@/services/http'

export interface PageResult<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export interface ApiListEnvelope<T> {
  success: boolean
  data?: T[]
  total?: number
  page?: number
  pageSize?: number
  message?: string
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

type ListResponse<T> =
  | T[]
  | PageResult<T>
  | ApiListEnvelope<T>

export async function listAll<T>(
  url: string,
  params?: Record<
    string,
    string | number | boolean | undefined
  >,
): Promise<T[]> {
  const query = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== ''
      ) {
        query.set(key, String(value))
      }
    })
  }

  if (!query.has('pageSize')) {
    query.set('pageSize', '100')
  }

  const queryString = query.toString()
  const fullUrl = queryString
    ? `${url}?${queryString}`
    : url

  const response = await httpGet<ListResponse<T>>(fullUrl)

  if (Array.isArray(response)) {
    return response
  }

  if (
    'success' in response &&
    response.success === false
  ) {
    throw new Error(
      response.error?.message ??
      'No se pudo obtener el listado.',
    )
  }

  return Array.isArray(response.data)
    ? response.data
    : []
}

/**
 * Genera un código de catálogo si el formulario
 * no lo proporciona.
 */
export function ensureCode(
  prefix: string,
  name: string,
  explicit?: string,
  existing: string[] = [],
): string {
  let code = String(explicit ?? '')
    .trim()
    .toUpperCase()

  if (!code) {
    const slug = name
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase()
      .slice(0, 12)

    code =
      `${prefix}-${slug ||
      Date.now().toString(36).toUpperCase()}`
  }

  const taken = new Set(
    existing.map((current) => current.toUpperCase()),
  )

  let candidate = code
  let number = 1

  while (taken.has(candidate)) {
    candidate = `${code.slice(0, 16)}-${number++}`
  }

  return candidate
}