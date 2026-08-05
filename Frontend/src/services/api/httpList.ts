import { httpGet } from '@/services/http'

export interface PageResult<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

type ListResponse<T> = T[] | PageResult<T> | { success?: boolean; data: T[]; total?: number }

export async function listAll<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T[]> {
  const pageSize = 200
  const all: T[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (all.length < total) {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
    }
    qs.set('pageSize', String(pageSize))
    qs.set('page', String(page))
    const res = await httpGet<ListResponse<T>>(`${url}?${qs}`)

    if (Array.isArray(res)) return res

    const batch = res && Array.isArray(res.data) ? res.data : []
    if (!batch.length) break

    all.push(...batch)
    total = res && typeof res.total === 'number' ? res.total : all.length
    if (batch.length < pageSize) break
    page += 1
  }

  return all
}

/** Genera código de catálogo si el formulario no lo trae (alta). */
export function ensureCode(prefix: string, name: string, explicit?: string, existing: string[] = []): string {
  let code = String(explicit ?? '').trim().toUpperCase()
  if (!code) {
    const slug = name
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase()
      .slice(0, 12)
    code = `${prefix}-${slug || Date.now().toString(36).toUpperCase()}`
  }
  const taken = new Set(existing.map((c) => c.toUpperCase()))
  let candidate = code
  let n = 1
  while (taken.has(candidate)) {
    candidate = `${code.slice(0, 16)}-${n++}`
  }
  return candidate
}
