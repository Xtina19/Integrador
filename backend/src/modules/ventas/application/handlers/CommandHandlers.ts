import type { VentaApplicationService } from '../services/VentaApplicationService'
import type {
  AnularNotaCreditoCommand,
  AnularVentaCommand,
  EmitirNotaCreditoCommand,
  EmitirVentaCommand,
  RegistrarCambioCommand,
  ReimprimirVentaCommand,
  RevertirAplicacionesNotaCreditoCommand,
} from '../commands/VentaCommands'
import type { ApplicationResult } from '../results/ApplicationResult'
import type { VentaDto } from '../dto/VentaDtos'

/** CU-VEN-01 / 02 / 03 / 09 / 10 */
export class EmitirVentaHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: EmitirVentaCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.emitirVenta(command)
  }
}

/** CU-VEN-11 */
export class RegistrarCambioHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: RegistrarCambioCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.registrarCambio(command)
  }
}

/** CU-VEN-13 */
export class EmitirNotaCreditoHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: EmitirNotaCreditoCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.emitirNotaCredito(command)
  }
}

export class AnularNotaCreditoHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: AnularNotaCreditoCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.anularNotaCredito(command)
  }
}

export class RevertirAplicacionesNotaCreditoHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: RevertirAplicacionesNotaCreditoCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.revertirAplicacionesNotaCredito(command)
  }
}

/** CU-VEN-14 */
export class AnularVentaHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: AnularVentaCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.anularVenta(command)
  }
}

/** CU-VEN-06 */
export class ReimprimirVentaHandler {
  constructor(private readonly service: VentaApplicationService) {}
  execute(command: ReimprimirVentaCommand): Promise<ApplicationResult<VentaDto>> {
    return this.service.reimprimir(command)
  }
}
