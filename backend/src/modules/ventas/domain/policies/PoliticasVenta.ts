import type { TipoVenta, EstadoVenta } from '../enums'
import { VentasDomainError } from '../errors/VentasDomainError'

export interface ContextoDescuento {
  rol: 'cajero' | 'supervisor' | 'administrador'
  porcentajeSolicitado?: number
  montoSolicitado?: number
  topePorcentajeCajero: number
  topePorcentajeSupervisor: number
}

export class PoliticaDescuento {
  static assertPermitido(ctx: ContextoDescuento): void {
    const pct = ctx.porcentajeSolicitado ?? 0
    if (ctx.rol === 'administrador') return
    const tope = ctx.rol === 'supervisor' ? ctx.topePorcentajeSupervisor : ctx.topePorcentajeCajero
    if (pct > tope) {
      throw new VentasDomainError(
        'INVALID_DISCOUNT',
        `El descuento (${pct}%) supera el tope autorizado (${tope}%) para el rol ${ctx.rol}.`,
      )
    }
  }
}

export class PoliticaPostventaCliente {
  static assertPuedePostventa(tipoVenta: TipoVenta, estado: EstadoVenta): void {
    if (estado === 'anulada') {
      throw new VentasDomainError(
        'FORBIDDEN_TRANSITION',
        'Una factura anulada no admite postventa.',
      )
    }
    if (tipoVenta === 'consumidor_final') {
      throw new VentasDomainError(
        'POST_SALE_NOT_ALLOWED',
        'La postventa nominativa requiere Cliente Registrado.',
      )
    }
  }
}

export class PoliticaAnulacionVenta {
  static assertPuedeAnular(input: {
    estado: EstadoVenta
    rol: 'cajero' | 'supervisor' | 'administrador'
    tienePostventa: boolean
    permitirConPostventaRegularizada?: boolean
  }): void {
    if (input.estado === 'anulada') {
      throw new VentasDomainError('FORBIDDEN_TRANSITION', 'La factura ya está anulada.')
    }
    if (input.rol === 'cajero') {
      throw new VentasDomainError('FORBIDDEN_TRANSITION', 'El cajero no puede anular facturas.')
    }
    if (input.tienePostventa && !input.permitirConPostventaRegularizada) {
      throw new VentasDomainError(
        'FORBIDDEN_TRANSITION',
        'No se puede anular una factura con postventa pendiente de regularizar.',
      )
    }
  }
}

export class PoliticaEmisionVenta {
  static assertTipoCliente(tipoVenta: TipoVenta, clienteId: string | undefined): void {
    if (tipoVenta === 'cliente_registrado' && !clienteId?.trim()) {
      throw new VentasDomainError(
        'INVALID_CUSTOMER',
        'La venta a Cliente Registrado requiere clienteId.',
      )
    }
  }
}

export class ServicioElegibilidadPostventa {
  static puedeCambiar(tipoVenta: TipoVenta, estado: EstadoVenta): boolean {
    try {
      PoliticaPostventaCliente.assertPuedePostventa(tipoVenta, estado)
      return true
    } catch {
      return false
    }
  }

  static puedeNotaCredito(tipoVenta: TipoVenta, estado: EstadoVenta, clienteId?: string): boolean {
    if (!clienteId?.trim()) return false
    return this.puedeCambiar(tipoVenta, estado)
  }
}
