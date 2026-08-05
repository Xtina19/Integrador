import type { VentaApplicationService } from '../services/VentaApplicationService'
import type {
  BuscarClienteQuery,
  GetHistorialVentaQuery,
  GetVentaQuery,
  ListarNotasCreditoDisponiblesQuery,
  ListarNotasCreditoQuery,
  ListVentasQuery,
} from '../queries/VentaQueries'
import type { ApplicationResult } from '../results/ApplicationResult'
import type { HistorialVentaDto, VentaDto, VentaResumenDto } from '../dto/VentaDtos'
import type {
  NotaCreditoAdminDto,
  NotaCreditoDisponibleDto,
} from '../services/VentaApplicationService'

/** CU-VEN-04 */
export class ListarVentasHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(query: ListVentasQuery): Promise<ApplicationResult<VentaResumenDto[]>> {
    return this.service.listarVentas(query)
  }
}

/** CU-VEN-05 */
export class ObtenerVentaHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(query: GetVentaQuery): Promise<ApplicationResult<VentaDto>> {
    return this.service.obtenerVenta(query)
  }
}

/** CU-VEN-07 */
export class ObtenerHistorialVentaHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(query: GetHistorialVentaQuery): Promise<ApplicationResult<HistorialVentaDto[]>> {
    return this.service.obtenerHistorial(query)
  }
}

/** CU-VEN-08 */
export class BuscarClienteHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(
    query: BuscarClienteQuery,
  ): Promise<ApplicationResult<Array<{ id: string; nombre: string; activo: boolean }>>> {
    return this.service.buscarCliente(query)
  }
}

export class ListarNotasCreditoDisponiblesHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(
    query: ListarNotasCreditoDisponiblesQuery,
  ): Promise<ApplicationResult<NotaCreditoDisponibleDto[]>> {
    return this.service.listarNotasCreditoDisponibles(query)
  }
}

/** Listado administrativo de NC (consulta; sin emisión). */
export class ListarNotasCreditoHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(query: ListarNotasCreditoQuery): Promise<ApplicationResult<NotaCreditoAdminDto[]>> {
    return this.service.listarNotasCredito(query)
  }
}
