import { httpGet, httpPost } from '@/services/http'

const base = '/api/inventario/costeos'

export interface CosteoInventarioDto {
  id: string
  fecha: string
  productoId: string
  producto: string
  isbn: string
  previousCost: number
  newCost: number
  previousPrice?: number
  newPrice?: number
  marginPercent?: number
  costType: string
  notes: string
  origen: string
  documentoRef?: string | null
  resultado?: string
}

export interface RegistrarCosteoRequest {
  productoId: string
  newCost: number
  newPrice?: number
  marginPercent?: number
  costType: string
  notes?: string
  origen?: 'manual' | 'importacion'
  documentoRef?: string
}

function unwrapList(payload: unknown): CosteoInventarioDto[] {
  if (Array.isArray(payload)) return payload as CosteoInventarioDto[]
  const obj = payload as { data?: CosteoInventarioDto[] }
  return obj?.data ?? []
}

function unwrapOne(payload: unknown): CosteoInventarioDto {
  const obj = payload as { data?: CosteoInventarioDto }
  return (obj?.data ?? payload) as CosteoInventarioDto
}

export const costeoInventarioApi = {
  async list(params?: { productoId?: string; origen?: string; limit?: number }) {
    const qs = new URLSearchParams()
    if (params?.productoId) qs.set('productoId', params.productoId)
    if (params?.origen) qs.set('origen', params.origen)
    if (params?.limit) qs.set('limit', String(params.limit))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    const res = await httpGet<{ success?: boolean; data?: CosteoInventarioDto[] }>(`${base}${suffix}`)
    return unwrapList(res)
  },

  async registrar(input: RegistrarCosteoRequest) {
    const res = await httpPost<{ success?: boolean; data?: CosteoInventarioDto }>(base, {
      productoId: input.productoId,
      newCost: input.newCost,
      newPrice: input.newPrice,
      marginPercent: input.marginPercent,
      costType: input.costType,
      notes: input.notes ?? '',
      origen: input.origen ?? 'manual',
      documentoRef: input.documentoRef,
    })
    return unwrapOne(res)
  },
}
