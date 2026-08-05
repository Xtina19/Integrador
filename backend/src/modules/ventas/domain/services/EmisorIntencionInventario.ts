import type { IntencionEfectoInventario } from '../value-objects/IntencionEfectoInventario'

/**
 * Construye la intención de efecto inventariable.
 * NO ejecuta el Inventory Engine — solo prepara el contrato para el puerto de aplicación.
 */
export class EmisorIntencionInventario {
  static salidaVenta(input: {
    ventaId: string
    usuarioId: string
    idempotencyKey: string
    almacenId: string
    lineas: Array<{ productoId: string; cantidad: number }>
  }): IntencionEfectoInventario {
    return {
      tipoEfecto: 'salida_venta',
      documento: {
        tipo: 'venta',
        ventaId: input.ventaId,
        documentoId: input.ventaId,
      },
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKey,
      lineas: input.lineas.map((l) => ({
        productoId: l.productoId,
        almacenId: input.almacenId,
        cantidad: l.cantidad,
        sentido: 'salida' as const,
      })),
    }
  }

  static entradaDevolucion(input: {
    ventaId: string
    devolucionId: string
    usuarioId: string
    idempotencyKey: string
    almacenId: string
    lineas: Array<{ productoId: string; cantidad: number }>
  }): IntencionEfectoInventario {
    return {
      tipoEfecto: 'entrada_devolucion',
      documento: {
        tipo: 'devolucion',
        ventaId: input.ventaId,
        documentoId: input.devolucionId,
      },
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKey,
      lineas: input.lineas.map((l) => ({
        productoId: l.productoId,
        almacenId: input.almacenId,
        cantidad: l.cantidad,
        sentido: 'entrada' as const,
      })),
    }
  }

  static efectoCambio(input: {
    ventaId: string
    cambioId: string
    usuarioId: string
    idempotencyKey: string
    almacenId: string
    entradas: Array<{ productoId: string; cantidad: number }>
    /** Vacío = solo reingreso (devolución física sin producto de salida). */
    salidas: Array<{ productoId: string; cantidad: number }>
  }): IntencionEfectoInventario {
    return {
      tipoEfecto: 'efecto_cambio',
      documento: {
        tipo: 'cambio',
        ventaId: input.ventaId,
        documentoId: input.cambioId,
      },
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKey,
      lineas: [
        ...input.entradas.map((l) => ({
          productoId: l.productoId,
          almacenId: input.almacenId,
          cantidad: l.cantidad,
          sentido: 'entrada' as const,
        })),
        ...input.salidas.map((l) => ({
          productoId: l.productoId,
          almacenId: input.almacenId,
          cantidad: l.cantidad,
          sentido: 'salida' as const,
        })),
      ],
    }
  }

  static reversionAnulacion(input: {
    ventaId: string
    usuarioId: string
    idempotencyKey: string
    almacenId: string
    lineas: Array<{ productoId: string; cantidad: number }>
  }): IntencionEfectoInventario {
    return {
      tipoEfecto: 'reversion_anulacion',
      documento: {
        tipo: 'anulacion_venta',
        ventaId: input.ventaId,
        documentoId: input.ventaId,
      },
      usuarioId: input.usuarioId,
      idempotencyKey: input.idempotencyKey,
      lineas: input.lineas.map((l) => ({
        productoId: l.productoId,
        almacenId: input.almacenId,
        cantidad: l.cantidad,
        sentido: 'entrada' as const,
      })),
    }
  }
}
