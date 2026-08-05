import type { InMemoryDatabaseAdapter, JsonRecord } from '../../infrastructure/persistence/InMemoryDatabaseAdapter'
import { ApplicationResult, fail, mapDomainError, ok } from '../results/ApplicationResult'

/** Mapa de almacenes operativos → nombre comercial (frontend/sucursales). */
export const ALMACEN_NOMBRES: Record<string, string> = {
  central: 'Almacén Central',
  'suc-1': 'Sucursal Centro',
  'suc-2': 'Sucursal Norte',
  'suc-3': 'Sucursal Este',
  'suc-4': 'Sucursal Oeste',
  'suc-5': 'Sucursal Sur',
}

export function nombreAlmacen(almacenId: string): string {
  return ALMACEN_NOMBRES[almacenId] ?? almacenId
}

export interface ProductoVistaExistencia {
  almacenId: string
  almacenNombre: string
  saldo: number
}

export interface ProductoVista {
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
  existencias: ProductoVistaExistencia[]
}

export interface MovimientoVista {
  id: string
  tipoMovimiento: string
  productoId: string
  productoTitulo?: string
  almacenId: string
  almacenNombre: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documentoTipo: string
  documentoId: string
  documentoLineaId?: string
  usuarioId: string
  fechaMovimiento: string
  motivoCodigo?: string
  observacion?: string
}

export interface KardexVista {
  id: string
  movimientoId: string
  productoId: string
  productoTitulo?: string
  almacenId: string
  almacenNombre: string
  tipoMovimiento: string
  cantidad: number
  saldoAnterior: number
  saldoPosterior: number
  documentoTipo: string
  documentoId: string
  usuarioId: string
  fechaMovimiento: string
  motivoCodigo?: string
  observacion?: string
}

export interface AuditoriaVista {
  id: string
  tipoAccion: string
  usuarioId: string
  fecha: string
  resultado: string
  movimientoId?: string
  documentoTipo?: string
  documentoId?: string
  productoId?: string
  almacenId?: string
  valorAntes?: Readonly<Record<string, unknown>>
  valorDespues?: Readonly<Record<string, unknown>>
  detalle?: string
  idempotencyKey?: string
}

export interface AuditoriaFilters {
  usuarioId?: string
  documento?: string
  accion?: string
  resultado?: string
  from?: string
  to?: string
}

export interface DashboardKpis {
  totalProductos: number
  totalExistencias: number
  valorInventario: number
  almacenesBloqueados: number
  transferenciasPendientes: number
  ajustesPendientes: number
  descartesPendientes: number
  conteosActivos: number
  movimientosUltimas24h: number
  porAlmacen: Array<{ almacenId: string; almacenNombre: string; existencias: number; valor: number }>
}

/**
 * Servicio de lectura (read-model) sobre las tablas en memoria del módulo Inventario.
 * No muta estado, no invoca al Engine ni a los Application Services de escritura.
 */
export class InventoryQueryService {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  private productoTitulo(productoId: string): string | undefined {
    const row = this.db.tables.productos.get(productoId)
    return row ? String(row.titulo ?? productoId) : undefined
  }

  async listProductosVista(): Promise<ApplicationResult<ProductoVista[]>> {
    try {
      const productos: ProductoVista[] = []
      for (const row of this.db.tables.productos.values()) {
        const productoId = String(row.id)
        const existencias: ProductoVistaExistencia[] = []
        for (const exRow of this.db.tables.existencias.values()) {
          if (String(exRow.productoId) !== productoId) continue
          const almacenId = String(exRow.almacenId)
          existencias.push({
            almacenId,
            almacenNombre: nombreAlmacen(almacenId),
            saldo: Number(exRow.saldo ?? 0),
          })
        }
        existencias.sort((a, b) => a.almacenId.localeCompare(b.almacenId))
        productos.push({
          productoId,
          codigo: row.codigo ? String(row.codigo) : undefined,
          isbn: row.isbn ? String(row.isbn) : undefined,
          titulo: String(row.titulo ?? productoId),
          autor: row.autor ? String(row.autor) : undefined,
          categoria: row.categoria ? String(row.categoria) : undefined,
          editorial: row.editorial ? String(row.editorial) : undefined,
          costoReferencia: Number(row.costoReferencia ?? 0),
          activo: Boolean(row.activo),
          existenciaTotal: existencias.reduce((sum, e) => sum + e.saldo, 0),
          existencias,
        })
      }
      productos.sort((a, b) => a.titulo.localeCompare(b.titulo))
      return ok(productos)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async listMovimientos(): Promise<ApplicationResult<MovimientoVista[]>> {
    try {
      const items: MovimientoVista[] = []
      for (const row of this.db.tables.movimientos.values()) {
        const almacenId = String(row.almacenId)
        items.push({
          id: String(row.id),
          tipoMovimiento: String(row.tipoMovimiento),
          productoId: String(row.productoId),
          productoTitulo: this.productoTitulo(String(row.productoId)),
          almacenId,
          almacenNombre: nombreAlmacen(almacenId),
          cantidad: Number(row.cantidad),
          saldoAnterior: Number(row.saldoAnterior),
          saldoPosterior: Number(row.saldoPosterior),
          documentoTipo: String(row.documentoTipo),
          documentoId: String(row.documentoId),
          documentoLineaId: row.documentoLineaId ? String(row.documentoLineaId) : undefined,
          usuarioId: String(row.usuarioId),
          fechaMovimiento: String(row.fechaMovimiento),
          motivoCodigo: row.motivoCodigo ? String(row.motivoCodigo) : undefined,
          observacion: row.observacion ? String(row.observacion) : undefined,
        })
      }
      items.sort((a, b) => b.fechaMovimiento.localeCompare(a.fechaMovimiento))
      return ok(items)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async getMovimiento(id: string): Promise<ApplicationResult<MovimientoVista>> {
    const result = await this.listMovimientos()
    if (!result.ok) return result
    const found = result.value.find((m) => m.id === id)
    if (!found) {
      return fail('NOT_FOUND', 'Movimiento no encontrado.')
    }
    return ok(found)
  }

  async listKardex(productoId?: string): Promise<ApplicationResult<KardexVista[]>> {
    try {
      const items: KardexVista[] = []
      for (const row of this.db.tables.kardex.values()) {
        if (productoId && String(row.productoId) !== productoId) continue
        const almacenId = String(row.almacenId)
        items.push({
          id: String(row.id),
          movimientoId: String(row.movimientoId),
          productoId: String(row.productoId),
          productoTitulo: this.productoTitulo(String(row.productoId)),
          almacenId,
          almacenNombre: nombreAlmacen(almacenId),
          tipoMovimiento: String(row.tipoMovimiento),
          cantidad: Number(row.cantidad),
          saldoAnterior: Number(row.saldoAnterior),
          saldoPosterior: Number(row.saldoPosterior),
          documentoTipo: String(row.documentoTipo),
          documentoId: String(row.documentoId),
          usuarioId: String(row.usuarioId),
          fechaMovimiento: String(row.fechaMovimiento),
          motivoCodigo: row.motivoCodigo ? String(row.motivoCodigo) : undefined,
          observacion: row.observacion ? String(row.observacion) : undefined,
        })
      }
      items.sort((a, b) => b.fechaMovimiento.localeCompare(a.fechaMovimiento))
      return ok(items)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async listAuditorias(filters?: AuditoriaFilters): Promise<ApplicationResult<AuditoriaVista[]>> {
    try {
      const items: AuditoriaVista[] = []
      for (const row of this.db.tables.auditorias.values()) {
        if (filters?.usuarioId && String(row.usuarioId) !== filters.usuarioId) continue
        if (
          filters?.documento &&
          String(row.documentoId ?? '') !== filters.documento &&
          String(row.documentoTipo ?? '') !== filters.documento
        ) {
          continue
        }
        if (filters?.accion && String(row.tipoAccion) !== filters.accion) continue
        if (filters?.resultado && String(row.resultado) !== filters.resultado) continue
        const fecha = String(row.fecha)
        if (filters?.from && fecha < filters.from) continue
        if (filters?.to && fecha > filters.to) continue
        items.push({
          id: String(row.id),
          tipoAccion: String(row.tipoAccion),
          usuarioId: String(row.usuarioId),
          fecha,
          resultado: String(row.resultado),
          movimientoId: row.movimientoId ? String(row.movimientoId) : undefined,
          documentoTipo: row.documentoTipo ? String(row.documentoTipo) : undefined,
          documentoId: row.documentoId ? String(row.documentoId) : undefined,
          productoId: row.productoId ? String(row.productoId) : undefined,
          almacenId: row.almacenId ? String(row.almacenId) : undefined,
          valorAntes: row.valorAntes as Readonly<Record<string, unknown>> | undefined,
          valorDespues: row.valorDespues as Readonly<Record<string, unknown>> | undefined,
          detalle: row.detalle ? String(row.detalle) : undefined,
          idempotencyKey: row.idempotencyKey ? String(row.idempotencyKey) : undefined,
        })
      }
      items.sort((a, b) => b.fecha.localeCompare(a.fecha))
      return ok(items)
    } catch (error) {
      return mapDomainError(error)
    }
  }

  async exportAuditoriasCsv(filters?: AuditoriaFilters): Promise<ApplicationResult<string>> {
    const result = await this.listAuditorias(filters)
    if (!result.ok) return result
    const header = [
      'id',
      'tipoAccion',
      'usuarioId',
      'fecha',
      'resultado',
      'documentoTipo',
      'documentoId',
      'productoId',
      'almacenId',
      'detalle',
    ]
    const escape = (value: unknown): string => {
      const str = value === undefined || value === null ? '' : String(value)
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    }
    const rows = result.value.map((a) =>
      [
        a.id,
        a.tipoAccion,
        a.usuarioId,
        a.fecha,
        a.resultado,
        a.documentoTipo,
        a.documentoId,
        a.productoId,
        a.almacenId,
        a.detalle,
      ]
        .map(escape)
        .join(','),
    )
    return ok([header.join(','), ...rows].join('\n'))
  }

  async dashboardKpis(): Promise<ApplicationResult<DashboardKpis>> {
    try {
      const productosById = new Map<string, JsonRecord>(
        [...this.db.tables.productos.entries()].map(([id, row]) => [id, row]),
      )
      const porAlmacenMap = new Map<string, { existencias: number; valor: number }>()
      let totalExistencias = 0
      let valorInventario = 0
      for (const row of this.db.tables.existencias.values()) {
        const saldo = Number(row.saldo ?? 0)
        const producto = productosById.get(String(row.productoId))
        const costo = Number(producto?.costoReferencia ?? 0)
        const almacenId = String(row.almacenId)
        totalExistencias += saldo
        valorInventario += saldo * costo
        const acc = porAlmacenMap.get(almacenId) ?? { existencias: 0, valor: 0 }
        acc.existencias += saldo
        acc.valor += saldo * costo
        porAlmacenMap.set(almacenId, acc)
      }

      let almacenesBloqueados = 0
      for (const row of this.db.tables.almacenes.values()) {
        if (row.bloqueadoPorConteo) almacenesBloqueados += 1
      }

      const contarEstado = (
        table: Map<string, JsonRecord>,
        estados: readonly string[],
      ): number => {
        let count = 0
        for (const row of table.values()) {
          if (estados.includes(String(row.estado))) count += 1
        }
        return count
      }

      const transferenciasPendientes = contarEstado(this.db.tables.transferencias, [
        'borrador',
        'solicitada',
        'en_transito',
        'recibida_parcial',
      ])
      const ajustesPendientes = contarEstado(this.db.tables.ajustes, ['borrador', 'solicitado'])
      const descartesPendientes = contarEstado(this.db.tables.descartes, ['borrador', 'solicitado'])
      const conteosActivos = contarEstado(this.db.tables.conteos, [
        'abierto',
        'en_conteo',
        'en_revision',
      ])

      const hace24h = Date.now() - 24 * 60 * 60 * 1000
      let movimientosUltimas24h = 0
      for (const row of this.db.tables.movimientos.values()) {
        const fecha = Date.parse(String(row.fechaMovimiento))
        if (!Number.isNaN(fecha) && fecha >= hace24h) movimientosUltimas24h += 1
      }

      return ok({
        totalProductos: this.db.tables.productos.size,
        totalExistencias,
        valorInventario,
        almacenesBloqueados,
        transferenciasPendientes,
        ajustesPendientes,
        descartesPendientes,
        conteosActivos,
        movimientosUltimas24h,
        porAlmacen: [...porAlmacenMap.entries()]
          .map(([almacenId, acc]) => ({
            almacenId,
            almacenNombre: nombreAlmacen(almacenId),
            existencias: acc.existencias,
            valor: acc.valor,
          }))
          .sort((a, b) => a.almacenId.localeCompare(b.almacenId)),
      })
    } catch (error) {
      return mapDomainError(error)
    }
  }
}
