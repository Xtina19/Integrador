import { CreateConteoCommand } from '../commands/CreateConteoCommand'
import { ConteoApplicationService } from '../services/ConteoApplicationService'
import { ApplicationResult } from '../results/ApplicationResult'

export interface CreateConteoResult {
  id: string
  codigo: string
  estado: string
  version: number
  nombre: string
  fase: string
  productosAlcance: number
}

/**
 * Handler del caso de uso Crear Conteo.
 * Orquesta validaciones de aplicación y delega en ConteoApplicationService.
 * No modifica el agregado de dominio ni el Engine.
 */
export class CreateConteoHandler {
  constructor(private readonly conteoService: ConteoApplicationService) {}

  async execute(
    command: CreateConteoCommand,
  ): Promise<ApplicationResult<CreateConteoResult>> {
    return this.conteoService.crearConteoCompleto(command)
  }
}
