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
  existencias: { almacenId: string; almacenNombre: string; saldo: number }[]
}

/** Forma real devuelta por GET /api/inventario/dashboard (backend read-model). */
interface DashboardKpisBackendDto {
  totalProductos: number
  totalExistencias: number
  valorInventario: number
  almacenesBloqueados: number
  transferenciasPendientes: number
  ajustesPendientes: number
  descartesPendientes: number
  conteosActivos: number
  movimientosUltimas24h: number
  porAlmacen: { almacenId: string; almacenNombre: string; existencias: number; valor: number }[]
}

const AUTH_HEADERS = {
  'x-user-id': 'inventario',
  'x-user-roles': 'admin',
}

function withAuth() {
  return { headers: { ...apiConfig.headers, ...AUTH_HEADERS } }
}

function mapProducto(p: ProductoVistaBackendDto): ProductoInventarioVista {
  return {
    id: p.productoId,
    isbn: p.isbn ?? '',
    titulo: p.titulo,
    autor: p.autor ?? '—',
    categoria: p.categoria ?? '—',
    stockConsolidado: p.existenciaTotal,
    stockMinimo: 0,
    porAlmacen: p.existencias.map((e) => ({
      almacenId: e.almacenId,
      almacenNombre: e.almacenNombre,
      sucursal: e.almacenNombre,
      saldo: e.saldo,
    })),
    transferenciasActivas: 0,
    conteosAbiertos: 0,
    ajustesPendientes: 0,
    descartesRelacionados: 0,
    estado: p.existenciaTotal <= 0 ? 'agotado' : 'normal',
  }
}

export const inventarioQueryApi = {
  /** Backend expone GET /api/inventario/productos (no existe /productos-vista dedicado). */
  async productosVista(): Promise<ProductoInventarioVista[]> {
    const res = await httpGet<ApiEnvelope<ProductoVistaBackendDto[]>>('/api/inventario/productos', withAuth())
    return (res.data ?? []).map(mapProducto)
  },

  /** No hay endpoint GET /productos/:id — se filtra sobre el listado completo. */
  async productoVistaById(id: string): Promise<ProductoInventarioVista | null> {
    const productos = await inventarioQueryApi.productosVista()
    return productos.find((p) => p.id === id) ?? null
  },

  async dashboardKpis(): Promise<InventoryDashboardKpis> {
    const res = await httpGet<ApiEnvelope<DashboardKpisBackendDto>>('/api/inventario/dashboard', withAuth())
    const d = res.data
    const ahora = new Date().toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!d) {
      return {
        stockTotal: 0,
        productosBajoStock: 0,
        productosSinStock: 0,
        almacenesBloqueados: 0,
        valorInventario: null,
        ultimaActualizacion: ahora,
      }
    }
    // Solo métricas globales: los pendientes de proceso viven en cada pestaña.
    return {
      stockTotal: d.totalExistencias,
      productosBajoStock: 0,
      productosSinStock: 0,
      almacenesBloqueados: d.almacenesBloqueados,
      valorInventario: d.valorInventario > 0 ? d.valorInventario : null,
      ultimaActualizacion: ahora,
    }
  },
}
