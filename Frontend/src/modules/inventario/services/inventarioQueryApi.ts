import { httpGet } from '@/services/http'
import { apiConfig } from '@/config/api'
import type { InventoryDashboardKpis, ProductoInventarioVista } from '@/modules/inventario/types/inventoryUi'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

/** Forma real devuelta por GET /api/inventario/productos (backend read-model). */
interface ProductoVistaBackendDto {
  productoId: string
  codigo?: string
  isbn?: string
  titulo: string
  autor?: string
  categoria?: string
  editorial?: string
  costoReferencia: number
  activo: boolean
  existenciaTotal: number
  stockMinimo: number

  existencias: {
    almacenId: string
    almacenNombre: string
    sucursalId?: string | null
    sucursalNombre?: string
    saldo: number
    stockMinimo?: number
    ubicacion?: string
  }[]

  transferenciasActivas: number
  conteosAbiertos: number
  ajustesPendientes: number
  descartesRelacionados: number
  ultimoMovimientoId: string | null
  ultimoMovimientoFecha: string | null
  ultimaAuditoriaFecha: string | null
}

/** Forma real devuelta por GET /api/inventario/dashboard (backend read-model). */
interface DashboardKpisBackendDto {
  totalProductos: number
  totalExistencias: number
  productosBajoStock: number
  productosSinStock: number
  valorInventario: number | null
  almacenesBloqueados: number
  transferenciasPendientes: number
  ajustesPendientes: number
  descartesPendientes: number
  conteosActivos: number
  movimientosUltimas24h: number

  porAlmacen: {
    almacenId: string
    almacenNombre: string
    existencias: number
    valor: number | null
  }[]
}

const AUTH_HEADERS = {
  'x-user-id': 'inventario',
  'x-user-roles': 'admin',
}

function withAuth() {
  return { headers: { ...apiConfig.headers, ...AUTH_HEADERS } }
}

function mapProducto(
  p: ProductoVistaBackendDto,
): ProductoInventarioVista {
  return {
    id: p.productoId,
    isbn: p.isbn ?? '',
    titulo: p.titulo,
    autor: p.autor ?? '—',
    categoria: p.categoria ?? '—',
    editorial: p.editorial ?? '—',
    costoReferencia: p.costoReferencia ?? 0,
    stockConsolidado: p.existenciaTotal,
    stockMinimo: p.stockMinimo ?? 0,

    porAlmacen: p.existencias.map((e) => ({
      almacenId: e.almacenId,
      almacenNombre: e.almacenNombre,
      sucursalId: e.sucursalId ?? null,
      sucursal:
        e.sucursalNombre ??
        e.almacenNombre,
      saldo: e.saldo,
      stockMinimo: e.stockMinimo ?? 0,
      ubicacion: e.ubicacion ?? '',
    })),

    transferenciasActivas: p.transferenciasActivas ?? 0,
    conteosAbiertos: p.conteosAbiertos ?? 0,
    ajustesPendientes: p.ajustesPendientes ?? 0,
    descartesRelacionados: p.descartesRelacionados ?? 0,
    ultimoMovimientoId: p.ultimoMovimientoId ?? undefined,
    ultimoMovimientoFecha: p.ultimoMovimientoFecha
      ? String(p.ultimoMovimientoFecha).slice(0, 10)
      : undefined,
    ultimaAuditoriaFecha: p.ultimaAuditoriaFecha
      ? String(p.ultimaAuditoriaFecha).slice(0, 10)
      : undefined,

    estado:
      p.existenciaTotal <= 0
        ? 'agotado'
        : p.existenciaTotal <=
            (p.stockMinimo ?? 0)
          ? 'bajo'
          : 'normal',
  }
}

export const inventarioQueryApi = {
  /** Backend expone GET /api/inventario/productos (no existe /productos-vista dedicado). */
  async productosVista(): Promise<ProductoInventarioVista[]> {
    const res = await httpGet<ApiEnvelope<ProductoVistaBackendDto[]>>('/api/inventario/productos', withAuth())
    return (res.data ?? []).map(mapProducto)
  },

  /** No hay endpoint GET /productos/:id — se filtra sobre el listado completo. */
  async productoVistaById(
    id: string,
  ): Promise<ProductoInventarioVista | null> {
    try {
      const response = await httpGet<
        ApiEnvelope<ProductoVistaBackendDto>
      >(
        `/api/inventario/productos/${id}`,
        withAuth(),
      )

      return response.data
        ? mapProducto(response.data)
        : null
    } catch {
      return null
    }
  },

  async dashboardKpis(): Promise<InventoryDashboardKpis> {
    const response = await httpGet<
      ApiEnvelope<DashboardKpisBackendDto>
    >(
      '/api/inventario/dashboard',
      withAuth(),
    )

    const ahora = new Date().toLocaleString(
      'es-DO',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    )

    if (!response.data) {
      return {
        stockTotal: 0,
        productosBajoStock: 0,
        productosSinStock: 0,
        almacenesBloqueados: 0,
        valorInventario: null,
        ultimaActualizacion: ahora,
      }
    }

    const data: DashboardKpisBackendDto =
      response.data

    return {
      stockTotal: data.totalExistencias,
      productosBajoStock:
        data.productosBajoStock,
      productosSinStock:
        data.productosSinStock,
      almacenesBloqueados:
        data.almacenesBloqueados,
      valorInventario:
        data.valorInventario,
      ultimaActualizacion: ahora,
    }
  },
}
