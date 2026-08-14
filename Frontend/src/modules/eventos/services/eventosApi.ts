/**
 * Cliente HTTP del módulo Eventos → /api/eventos
 * Tablas: Evento, PersonalEvento, Material, EditorialEvento,
 *         EventoTieneEditorialEvento, EventoTieneProveedorEvento, DetalleProveedorEvento
 */
import { apiConfig, isApiEnabled } from '@/config/api'
import type { EventInventoryItem, EventStaffMember, EventUtensil } from '@/modules/eventos/types/eventExtended'

const BASE = `${apiConfig.baseUrl}/api/eventos`

export interface EventoEditorialApi {
  id_editorial: number
  nombre: string
}

export interface EventoListadoApi {
  id_evento: number
  nombre: string
  tipo_evento: string
  ubicacion: string
  id_sucursal: number
  fecha_inicio: string
  fecha_fin: string
  capacidad_esperada: number | null
  presupuesto: number | null
  costo_actual: number | null
  disponible: number | null
  estado: string
  observacion: string | null
  fecha_registro: string
  responsable?: string | null
  id_persona_responsable?: number | null
  editoriales: EventoEditorialApi[]
}

export interface EventoResumenApi {
  eventos_activos: number
  presupuesto_total: number
  ganancia_eventos: number
}

export interface EventoDetalleApi extends EventoListadoApi {
  descripcion?: string | null
  costo_real?: number | null
  inventario: Array<{
    id_producto: number
    titulo: string
    isbn: string | null
    cantidad: number
    sucursal: string
  }>
  personal: Array<{
    id_personal_evento: number
    id_persona: number
    nombre_persona?: string
    nombre?: string
    rol: string
    hora_entrada?: string | null
    hora_salida?: string | null
    costo?: number | null
    observacion?: string | null
  }>
  utensilios: Array<{
    id_detalle_prov_evento?: number
    id_material: number
    nombre_material?: string
    id_proveedor: number
    nombre_comercial?: string
    cantidad_usada?: number
    costo_unitario?: number
    costo_total?: number
    observaciones?: string | null
  }>
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text.slice(0, 200) || 'El backend no devolvió un JSON válido.')
  }
}

function apiError(body: unknown, fallback: string, status: number): Error {
  const obj = body && typeof body === 'object' ? (body as { error?: string; success?: boolean }) : null
  return new Error(obj?.error || fallback || `Error ${status}`)
}

export function mapPersonalEvento(rows: EventoDetalleApi['personal'] | undefined): EventStaffMember[] {
  return (rows ?? []).map((person) => ({
    id: `PE-${person.id_personal_evento}`,
    id_persona: Number(person.id_persona),
    personaNombre: person.nombre_persona ?? person.nombre ?? 'Persona sin nombre',
    rol: person.rol ?? '',
    horaEntrada: person.hora_entrada?.slice(0, 16) ?? '',
    horaSalida: person.hora_salida?.slice(0, 16) ?? '',
    costo: person.costo != null ? String(person.costo) : '',
    observacion: person.observacion ?? '',
  }))
}

export function mapUtensiliosEvento(rows: EventoDetalleApi['utensilios'] | undefined): EventUtensil[] {
  return (rows ?? []).map((item, index) => ({
    id: `EU-${item.id_material}-${index}`,
    supplier: item.nombre_comercial ?? '',
    utensil: item.nombre_material ?? '',
    qty: Number(item.cantidad_usada ?? 0),
    unitCost: Number(item.costo_unitario ?? 0),
    notes: item.observaciones ?? '',
    id_material: Number(item.id_material),
    id_proveedor: Number(item.id_proveedor),
  }))
}

export function mapInventarioSucursal(rows: EventoDetalleApi['inventario'] | undefined): EventInventoryItem[] {
  return (rows ?? []).map((item, index) => ({
    id: `EI-${item.id_producto}-${index}`,
    product: item.titulo ?? '',
    code: String(item.id_producto ?? ''),
    isbn: String(item.isbn ?? ''),
    qty: Number(item.cantidad ?? 0),
    originBranch: item.sucursal ?? '',
  }))
}

export function costoPersonalEvento(rows: EventoDetalleApi['personal'] | undefined): number {
  return (rows ?? []).reduce((total, person) => total + Number(person.costo ?? 0), 0)
}

export const eventosApi = {
  isEnabled: () => isApiEnabled('eventos'),

  async listEvents(): Promise<EventoListadoApi[]> {
    const res = await fetch(BASE)
    const body = await readJson(res)
    if (!res.ok) throw apiError(body, 'No se pudieron cargar los eventos.', res.status)
    if (!Array.isArray(body)) throw new Error('La respuesta del backend no contiene una lista de eventos.')
    return body as EventoListadoApi[]
  },

  async getResumen(): Promise<EventoResumenApi> {
    const res = await fetch(`${BASE}/resumen`)
    const body = await readJson(res)
    if (!res.ok) throw apiError(body, 'No se pudo cargar el resumen de eventos.', res.status)
    return body as EventoResumenApi
  },

  async getEvent(id: string | number): Promise<EventoDetalleApi> {
    const res = await fetch(`${BASE}/${id}`)
    const body = await readJson(res)
    if (!res.ok) throw apiError(body, 'No se pudo cargar el evento.', res.status)
    return body as EventoDetalleApi
  },

  async saveEvent(payload: Record<string, unknown>, id?: string | number) {
    const url = id != null ? `${BASE}/${id}` : BASE
    const res = await fetch(url, {
      method: id != null ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await readJson(res)
    const result = body as { success?: boolean; error?: string; id_evento?: number } | null
    if (!res.ok || !result?.success) {
      throw new Error(result?.error ?? 'Error al guardar el evento')
    }
    return result
  },

  async deleteEvent(id: string | number) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
    const body = await readJson(res)
    const result = body as { success?: boolean; error?: string } | null
    if (!res.ok || !result?.success) {
      throw new Error(result?.error || 'No se pudo eliminar el evento.')
    }
    return result
  },
}
