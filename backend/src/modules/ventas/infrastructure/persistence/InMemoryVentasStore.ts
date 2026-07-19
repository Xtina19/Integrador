import type {
  InventarioEfectoLogRecord,
  VentaRecord,
  VentasCatalogoClienteRecord,
  VentasCatalogoProductoRecord,
  VentasExistenciaRecord,
  VentasUsuarioRecord,
} from './models/VentaPersistenceModels'

/**
 * Store in-memory del BC Ventas.
 * Independiente de MySQL/EF — preparado para sustituirse por adaptador SQL luego.
 */
export class InMemoryVentasStore {
  readonly ventas = new Map<string, VentaRecord>()
  readonly ventasByNumero = new Map<string, string>()
  readonly clientes = new Map<string, VentasCatalogoClienteRecord>()
  readonly productos = new Map<string, VentasCatalogoProductoRecord>()
  readonly existencias = new Map<string, VentasExistenciaRecord>()
  readonly usuarios = new Map<string, VentasUsuarioRecord>()
  readonly inventarioEfectosLog: InventarioEfectoLogRecord[] = []
  readonly auditoriaComercial: Array<{ id: string; at: string; tipo: string; payload: unknown }> = []

  private secuenciaFactura = new Map<string, number>()
  private secuenciaNotaCredito = 0
  private idCounter = 0

  existenciaKey(productoId: string, almacenId: string): string {
    return `${productoId}::${almacenId}`
  }

  nextId(prefix = 'ven'): string {
    this.idCounter += 1
    return `${prefix}-${this.idCounter}`
  }

  nextNumeroFactura(sucursalId: string): string {
    const n = (this.secuenciaFactura.get(sucursalId) ?? 1000) + 1
    this.secuenciaFactura.set(sucursalId, n)
    const suc = sucursalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SUC'
    return `F-${suc}-${n}`
  }

  /** Códigos globales secuenciales: NC-000001, NC-000002, … (sin sucursal). */
  nextNumeroNotaCredito(): string {
    this.secuenciaNotaCredito += 1
    return `NC-${String(this.secuenciaNotaCredito).padStart(6, '0')}`
  }

  clear(): void {
    this.ventas.clear()
    this.ventasByNumero.clear()
    this.clientes.clear()
    this.productos.clear()
    this.existencias.clear()
    this.usuarios.clear()
    this.inventarioEfectosLog.length = 0
    this.auditoriaComercial.length = 0
    this.secuenciaFactura.clear()
    this.secuenciaNotaCredito = 0
    this.idCounter = 0
  }
}
