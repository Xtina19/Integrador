import type { IntencionEfectoInventario } from '../../domain/value-objects/IntencionEfectoInventario'
import type { MonedaCodigo } from '../../domain/enums'
import type { VentaRepository, ListVentasCriterios } from '../../domain/ports/VentaRepository'

export type { VentaRepository, ListVentasCriterios }

/** ACL hacia BC Clientes (identidad mínima; el maestro editable está en Administración). */
export interface ClienteConsultaPort {
  getActivo(clienteId: string): Promise<{ id: string; nombre: string; activo: boolean } | null>
  buscar(texto: string): Promise<Array<{ id: string; nombre: string; activo: boolean }>>
  /** Proyecta identidad desde el maestro en la emisión (sin sync separado). */
  ensureIdentity(cliente: { id: string; nombre: string; activo: boolean }): void
}

/** ACL hacia Productos */
export interface ProductoConsultaPort {
  getVendible(productoId: string): Promise<{
    id: string
    titulo: string
    precio: number
    moneda: MonedaCodigo
    activo: boolean
  } | null>
}

/** Consulta de disponibilidad — no muta stock */
export interface InventarioConsultaPort {
  disponabilidad(
    productoId: string,
    almacenId: string,
  ): Promise<{
    saldo: number
    almacenBloqueadoPorConteo: boolean
  }>
}

/**
 * Puerto hacia Inventory Engine.
 * Única vía de afectación de existencias desde Ventas.
 */
export interface InventarioEfectosPort {
  aplicar(
    intencion: IntencionEfectoInventario,
  ): Promise<{ ok: true } | { ok: false; message: string }>
}

export interface UsuarioPermisosPort {
  getContexto(usuarioId: string): Promise<{
    rol: 'cajero' | 'supervisor' | 'administrador'
    topePorcentajeDescuento: number
  } | null>
}

export interface IdGeneratorPort {
  generate(): string
}
