import { fixUtf8Text, normalizeEditorialFields, toDateInputValue } from '@/lib/editorialesDisplay'
import { httpGet, httpPost, httpPut, httpPatch } from '@/services/http'
import type { PageResult } from '@/services/api/httpList'

const base = '/api/editoriales'

export type EditorialRecord = {
  id: string
  code: string
  name: string
  country: string
  contact: string
  phone: string
  email: string
  contractType: string
  contractExpiry: string
  status: string
  productCount: number
}

export type EditorialDashboard = {
  total: number
  active: number
  inactive: number
  withoutProducts: number
  contractsExpired: number
  contractsExpiring: number
  contractsActive: number
  topByProducts: { id: string; code: string; name: string; productCount: number } | null
  productsByPublisher: { id: string; code: string; name: string; status: string; productCount: number }[]
  expiringSoon: {
    id: string
    code: string
    name: string
    contractType: string
    contractExpiry: string
    status: string
    daysRemaining: number
  }[]
}

export type EditorialProduct = {
  id: string
  code: string
  isbn: string
  title: string
  author: string
  category: string
  publisherId: string
  publisher: string
  stock: number
  status: string
  price: number
}

function normalizeRecord(row: EditorialRecord): EditorialRecord {
  return normalizeEditorialFields(row)
}

function normalizeDashboard(data: EditorialDashboard): EditorialDashboard {
  return {
    ...data,
    topByProducts: data.topByProducts
      ? {
          ...data.topByProducts,
          name: fixUtf8Text(data.topByProducts.name),
          code: fixUtf8Text(data.topByProducts.code),
        }
      : null,
    productsByPublisher: data.productsByPublisher.map((p) => ({
      ...p,
      name: fixUtf8Text(p.name),
      code: fixUtf8Text(p.code),
    })),
    expiringSoon: data.expiringSoon.map((p) => ({
      ...p,
      name: fixUtf8Text(p.name),
      code: fixUtf8Text(p.code),
      contractType: fixUtf8Text(p.contractType),
      contractExpiry: toDateInputValue(p.contractExpiry),
    })),
  }
}

function normalizeProduct(row: EditorialProduct): EditorialProduct {
  return normalizeEditorialFields(row)
}

/** Lista completa paginando en servidor (evita truncar en 100). */
async function listAllEditoriales(
  params?: Record<string, string | number | undefined>
): Promise<EditorialRecord[]> {
  const pageSize = 100
  let page = 1
  let total = Infinity
  const all: EditorialRecord[] = []

  while (all.length < total) {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
    }
    qs.set('page', String(page))
    qs.set('pageSize', String(pageSize))
    const res = await httpGet<EditorialRecord[] | PageResult<EditorialRecord>>(`${base}?${qs}`)
    const rows = Array.isArray(res) ? res : res.data
    total = Array.isArray(res) ? rows.length : Number(res.total || 0)
    all.push(...rows.map(normalizeRecord))
    if (rows.length === 0 || rows.length < pageSize) break
    page += 1
    if (page > 50) break
  }

  return all
}

export const editorialesApi = {
  list: (params?: Record<string, string | number | undefined>) => listAllEditoriales(params),
  search: async (q: string, params?: Record<string, string | number | undefined>) => {
    const rows = await httpGet<EditorialRecord[]>(`${base}/search`, { params: { q, ...params } })
    return rows.map(normalizeRecord)
  },
  dashboard: async () => normalizeDashboard(await httpGet<EditorialDashboard>(`${base}/dashboard`)),
  productos: async (params?: Record<string, string | number | undefined>) => {
    const rows = await httpGet<EditorialProduct[]>(`${base}/productos`, { params })
    return rows.map(normalizeProduct)
  },
  getById: async (id: string) => normalizeRecord(await httpGet<EditorialRecord>(`${base}/${id}`)),
  create: async (body: Record<string, unknown>) =>
    normalizeRecord(await httpPost<EditorialRecord>(base, body)),
  update: async (id: string, body: Record<string, unknown>) =>
    normalizeRecord(await httpPut<EditorialRecord>(`${base}/${id}`, body)),
  setEstado: async (id: string, status: string) =>
    normalizeRecord(await httpPatch<EditorialRecord>(`${base}/${id}/estado`, { status })),
}
