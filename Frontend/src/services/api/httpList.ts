import { httpGet } from '@/services/http'

export interface PageResult<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export async function listAll<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T[]> {
  const qs = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    })
  }
  qs.set('pageSize', '100')
  const full = qs.toString() ? `${url}?${qs}` : `${url}?pageSize=100`
  const res = await httpGet<T[] | PageResult<T> | { success?: boolean; data: T[]; total?: number }>(full)
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  return []
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
