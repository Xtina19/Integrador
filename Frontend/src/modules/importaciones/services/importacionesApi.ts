/**
 * Cliente HTTP Importaciones → /api/importaciones
 * Contrato: { success, message?, data, meta? }
 */
import { httpGet, httpPost, httpPatch, httpDelete, getFriendlyErrorMessage, http } from '@/services/http'
import { isApiEnabled } from '@/config/api'
import type { ShipmentCosts } from '@/types/domain'

const BASE = '/api/importaciones'

interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  meta?: { page?: number; pageSize?: number; total?: number }
  error?: { code: string; message: string }
}

export interface PageResult<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export interface EmbarqueDto {
  id: number
  codigo: string
  proveedor: string
  paisOrigen: string
  origen: string
  destino: string
  fechaDespacho: string
  fechaLlegadaEst: string
  fechaLlegadaReal?: string | null
  tipoTransporte: string
  numeroTracking?: string | null
  estadoDb: string
  estado: string
  observacion?: string | null
  cajas?: number | null
  costs?: ShipmentCosts | null
  facturaInternacional?: FacturaInternacionalDto | null
  consolidacion?: ConsolidacionDto | null
  ordenCompraId?: number | null
  codigoOrden?: string | null
  pipelineStage?: string
  documentosFlete?: DocumentoCostoFleteDto[]
}

export interface DocumentoCostoFleteDto {
  id: number
  codigo: string
  embarqueId: number
  embarqueCodigo?: string | null
  numeroDocumento?: string | null
  tipoDocumento: string
  concepto: string
  proveedorServicio: string
  fechaDocumento: string
  moneda: string
  tasaCambio?: number | null
  monto: number
  montoLocal?: number | null
  estadoDb: string
  status: 'registered' | 'validated' | 'paid' | 'void'
  nombreArchivo?: string | null
  mimeType?: string | null
  tieneArchivo?: boolean
  observacion?: string | null
}

export interface FacturaInternacionalDto {
  id: number
  numeroFactura: string
  embarqueId: number
  embarqueCodigo?: string | null
  proveedor: string
  fechaEmision: string
  moneda: string
  total: number
  status: 'pending' | 'paid'
  ordenCompraId?: number | null
  codigoOrden?: string | null
  stage?: string
}

export interface ConsolidacionDto {
  id: number
  codigo: string
  embarqueId: number
  almacenId: number
  almacenNombre?: string | null
  fechaConsolidacion: string
  totalBultos: number
  status: 'pending' | 'processed' | 'closed'
  observacion?: string | null
}

export interface OrdenPendienteEmbarqueDto {
  ordenCompraId: number
  codigoOrden: string
  proveedor: string
  fechaOrden: string
  total: number
  monedaId: number
  idAlmacen: number
}

function unwrap<T>(res: ApiEnvelope<T>): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? res.message ?? 'Error en API Importaciones')
  }
  return res.data
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    throw new Error(getFriendlyErrorMessage(e))
  }
}

function buildDocumentoFleteForm(body: Record<string, unknown>): FormData {
  const fd = new FormData()
  const skip = new Set(['archivo', 'contenidoArchivo'])
  for (const [key, value] of Object.entries(body)) {
    if (skip.has(key) || value == null || value === '') continue
    fd.append(key, String(value))
  }
  const archivo = body.archivo
  if (archivo instanceof File) fd.append('archivo', archivo, archivo.name)
  return fd
}

export const importacionesApi = {
  isEnabled: () => isApiEnabled('importaciones'),

  async listEmbarques(params?: { page?: number; pageSize?: number }): Promise<PageResult<EmbarqueDto>> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<EmbarqueDto[]>>(`${BASE}/embarques`, { params })
      const data = unwrap(res)
      return {
        data,
        page: res.meta?.page ?? 1,
        pageSize: res.meta?.pageSize ?? data.length,
        total: res.meta?.total ?? data.length,
      }
    })
  },

  async getEmbarque(id: number): Promise<EmbarqueDto> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<EmbarqueDto>>(`${BASE}/embarques/${id}`)
      return unwrap(res)
    })
  },

  async listOrdenesPendientes(): Promise<OrdenPendienteEmbarqueDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<OrdenPendienteEmbarqueDto[]>>(`${BASE}/ordenes-pendientes`)
      return unwrap(res)
    })
  },

  async listFacturasInternacionales(): Promise<FacturaInternacionalDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<FacturaInternacionalDto[]>>(
        `${BASE}/facturas-internacionales`,
      )
      return unwrap(res)
    })
  },

  async listConsolidaciones(): Promise<ConsolidacionDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<ConsolidacionDto[]>>(`${BASE}/consolidaciones`)
      return unwrap(res)
    })
  },

  async createEmbarque(body: {
    ordenCompraId: number
    type?: string
    origin?: string
    destination?: string
    departure?: string
    arrival?: string
    boxes?: number
    notes?: string
    moneda?: string
  }): Promise<EmbarqueDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<EmbarqueDto>>(`${BASE}/embarques`, body)
      return unwrap(res)
    })
  },

  async updateEmbarque(
    id: number,
    body: Partial<{
      type: string
      origin: string
      destination: string
      departure: string
      arrival: string
      boxes: number
      notes: string
    }>,
  ): Promise<EmbarqueDto> {
    return safeCall(async () => {
      const res = await httpPatch<ApiEnvelope<EmbarqueDto>>(`${BASE}/embarques/${id}`, body)
      return unwrap(res)
    })
  },

  async avanzarEmbarque(id: number, body?: { almacenId?: number }): Promise<EmbarqueDto> {
    return safeCall(async () => {
      const res = await httpPost<ApiEnvelope<EmbarqueDto>>(
        `${BASE}/embarques/${id}/avanzar`,
        body ?? {},
      )
      return unwrap(res)
    })
  },

  async deleteEmbarque(id: number): Promise<void> {
    return safeCall(async () => {
      const res = await httpDelete<ApiEnvelope<{ id: number }>>(`${BASE}/embarques/${id}`)
      unwrap(res)
    })
  },

  async updateConsolidacion(
    id: number,
    body: { status?: string; notes?: string },
  ): Promise<ConsolidacionDto> {
    return safeCall(async () => {
      const res = await httpPatch<ApiEnvelope<ConsolidacionDto>>(
        `${BASE}/consolidaciones/${id}`,
        { status: body.status, observacion: body.notes },
      )
      return unwrap(res)
    })
  },

  async listDocumentosFlete(embarqueId?: number): Promise<DocumentoCostoFleteDto[]> {
    return safeCall(async () => {
      const res = await httpGet<ApiEnvelope<DocumentoCostoFleteDto[]>>(`${BASE}/documentos-flete`, {
        params: embarqueId ? { embarqueId } : undefined,
      })
      return unwrap(res)
    })
  },

  async createDocumentoFlete(
    embarqueId: number,
    body: {
      numeroDocumento?: string
      tipoDocumento: string
      concepto: string
      proveedorServicio: string
      fechaDocumento: string
      moneda?: string
      tasaCambio?: number
      monto: number
      montoLocal?: number
      nombreArchivo?: string
      mimeType?: string
      contenidoArchivo?: string
      archivo?: File
      observacion?: string
      status?: string
    },
  ): Promise<DocumentoCostoFleteDto> {
    return safeCall(async () => {
      const payload = body.archivo ? buildDocumentoFleteForm(body) : body
      const res = await httpPost<ApiEnvelope<DocumentoCostoFleteDto>>(
        `${BASE}/embarques/${embarqueId}/documentos-flete`,
        payload,
        { timeout: 120000, maxBodyLength: Infinity, maxContentLength: Infinity },
      )
      return unwrap(res)
    })
  },

  async updateDocumentoFlete(
    id: number,
    body: Partial<{
      numeroDocumento: string
      tipoDocumento: string
      concepto: string
      proveedorServicio: string
      fechaDocumento: string
      moneda: string
      monto: number
      nombreArchivo: string
      mimeType: string
      contenidoArchivo: string
      archivo: File
      observacion: string
      status: string
    }>,
  ): Promise<DocumentoCostoFleteDto> {
    return safeCall(async () => {
      const payload = body.archivo ? buildDocumentoFleteForm(body) : body
      const res = await httpPatch<ApiEnvelope<DocumentoCostoFleteDto>>(
        `${BASE}/documentos-flete/${id}`,
        payload,
        { timeout: 120000, maxBodyLength: Infinity, maxContentLength: Infinity },
      )
      return unwrap(res)
    })
  },

  async voidDocumentoFlete(id: number): Promise<void> {
    return safeCall(async () => {
      const res = await httpDelete<ApiEnvelope<{ id: number }>>(`${BASE}/documentos-flete/${id}`)
      unwrap(res)
    })
  },

  async downloadDocumentoFleteArchivo(id: number): Promise<{ blob: Blob; fileName: string }> {
    return safeCall(async () => {
      const response = await http.get(`${BASE}/documentos-flete/${id}/archivo`, {
        responseType: 'blob',
      })
      const disposition = response.headers['content-disposition'] as string | undefined
      let fileName = 'documento-flete'
      if (disposition) {
        const match = /filename="([^"]+)"/.exec(disposition)
        if (match?.[1]) fileName = match[1]
      }
      return { blob: response.data as Blob, fileName }
    })
  },
}
