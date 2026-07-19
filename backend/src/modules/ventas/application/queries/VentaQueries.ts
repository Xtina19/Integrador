export interface GetVentaQuery {
  ventaId?: string
  numeroFactura?: string
}

export interface ListVentasQuery {
  sucursalId?: string
  estado?: 'emitida' | 'anulada'
  clienteId?: string
  desde?: string
  hasta?: string
  numeroFactura?: string
  limit?: number
  offset?: number
}

export interface GetHistorialVentaQuery {
  ventaId: string
}

export interface BuscarClienteQuery {
  texto: string
}

export interface ListarNotasCreditoDisponiblesQuery {
  clienteId: string
}

/** Listado administrativo de NC (consulta; no emisión). */
export interface ListarNotasCreditoQuery {
  estado?: string
  clienteId?: string
  sucursalId?: string
  desde?: string
  hasta?: string
  /** Texto libre: número NC, número factura o clienteId */
  texto?: string
  numeroFactura?: string
  limit?: number
  offset?: number
}
