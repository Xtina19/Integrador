import { Descarte } from '../../domain/aggregates/Descarte'
import { CreateDescarteCommand } from '../commands/CreateDescarteCommand'
import { DescarteCreateMetadata } from '../models/DescarteCreateMetadata'
import {
  ApplicationResult,
  fail,
  mapDomainError,
  ok,
  withUnitOfWork,
} from '../results/ApplicationResult'
import {
  IAlmacenRepository,
  IClock,
  IDescarteRepository,
  IExistenciaRepository,
  IIdGenerator,
  IOutbox,
  IUnitOfWork,
  publishApplicationEvent,
} from '../ports/outbound'
import { IDescarteCreateStore } from '../ports/descarteCreateStore'

export interface CreateDescarteHandlerDeps {
  uow: IUnitOfWork
  descartes: IDescarteRepository
  store: IDescarteCreateStore
  almacenes: IAlmacenRepository
  existencias: IExistenciaRepository
  outbox: IOutbox
  clock: IClock
  ids: IIdGenerator
}

const MOTIVOS_VALIDOS = new Set([
  'DANO_FISICO',
  'DONACION',
  'PERDIDA',
  'ROBO',
  'ERROR_RECEPCION',
  'PRODUCTO_DEFECTUOSO',
  'CADUCIDAD',
  'OTRO',
])

/**
 * Handler del caso de uso Crear Descarte.
 * Orquesta puertos + agrega dominio. NO modifica DescarteApplicationService.
 * NO llama al Inventory Engine.
 */
export class CreateDescarteHandler {
  constructor(private readonly deps: CreateDescarteHandlerDeps) {}

  async execute(
    cmd: CreateDescarteCommand,
  ): Promise<
    ApplicationResult<{
      id: string
      codigo: string
      estado: string
      version: number
      motivoCodigo: string
      lineas: number
    }>
  > {
    return withUnitOfWork(this.deps.uow, async () => {
      try {
        if (!cmd.sucursalId?.trim()) {
          return fail('VALIDATION', 'La sucursal es obligatoria.')
        }
        if (!cmd.almacenId?.trim()) {
          return fail('VALIDATION', 'El almacén es obligatorio.')
        }
        if (!cmd.responsableId?.trim()) {
          return fail('VALIDATION', 'El responsable es obligatorio.')
        }
        if (!cmd.motivoCodigo || !MOTIVOS_VALIDOS.has(cmd.motivoCodigo)) {
          return fail('VALIDATION', 'El motivo del descarte es obligatorio.')
        }
        if (cmd.motivoCodigo === 'OTRO' && !cmd.motivoDescripcion?.trim()) {
          return fail('VALIDATION', 'Debe describir el motivo cuando selecciona Otro.')
        }
        if (!cmd.lineas?.length) {
          return fail('VALIDATION', 'Debe agregar al menos un producto.')
        }

        for (let i = 0; i < cmd.lineas.length; i++) {
          const linea = cmd.lineas[i]
          if (!linea.productoId?.trim()) {
            return fail('VALIDATION', `Línea ${i + 1}: producto obligatorio.`)
          }
          if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
            return fail('VALIDATION', `Línea ${i + 1}: cantidad inválida.`)
          }
          if (linea.cantidad > linea.existenciaActual) {
            return fail(
              'VALIDATION',
              `Línea ${i + 1}: no se puede descartar más unidades que la existencia actual (${linea.existenciaActual}).`,
            )
          }
          const existencia = await this.deps.existencias.get(
            linea.productoId,
            cmd.almacenId,
          )
          if (existencia && linea.cantidad > existencia.saldo.value) {
            return fail(
              'VALIDATION',
              `Línea ${i + 1}: stock insuficiente en almacén (${existencia.saldo.value}).`,
            )
          }
        }

        const almacen = await this.deps.almacenes.getById(cmd.almacenId)
        if (!almacen) {
          return fail('NOT_FOUND', 'Almacén no encontrado.')
        }

        const codigo =
          cmd.codigo?.trim() ||
          `DSC-${this.deps.clock.now().toISOString().slice(0, 10).replace(/-/g, '')}-${this.deps.ids.generate().slice(0, 6).toUpperCase()}`

        const lineasDominio = cmd.lineas.map((l) => ({
          id: this.deps.ids.generate(),
          productoId: l.productoId,
          cantidad: l.cantidad,
          motivoCodigo: cmd.motivoCodigo,
          observacion: [l.motivoEspecifico, l.observacion].filter(Boolean).join(' · ') || undefined,
        }))

        const descarte = Descarte.crear({
          id: this.deps.ids.generate(),
          codigo,
          almacenId: cmd.almacenId,
          solicitanteId: cmd.responsableId,
          lineas: lineasDominio,
          observacion: [
            cmd.motivoDescripcion ? `Motivo: ${cmd.motivoDescripcion}` : null,
            cmd.observaciones,
          ]
            .filter(Boolean)
            .join('\n') || undefined,
          solicitar: false,
        })

        const now = this.deps.clock.now().toISOString()
        const meta: DescarteCreateMetadata = {
          descarteId: descarte.id,
          codigo: descarte.codigo,
          fecha: cmd.fecha,
          sucursalId: cmd.sucursalId.trim(),
          almacenId: cmd.almacenId.trim(),
          responsableId: cmd.responsableId.trim(),
          responsableNombre: cmd.responsableNombre,
          motivoCodigo: cmd.motivoCodigo,
          motivoDescripcion: cmd.motivoDescripcion?.trim(),
          observaciones: cmd.observaciones?.trim(),
          lineas: cmd.lineas.map((l) => ({ ...l })),
          evidencias: (cmd.evidencias ?? []).map((e) => ({
            ...e,
            id: this.deps.ids.generate(),
          })),
          requiereAprobacion: cmd.requiereAprobacion !== false,
          aprobacion: {
            solicitanteId: cmd.responsableId,
            solicitanteNombre: cmd.responsableNombre,
            supervisorId: cmd.supervisorId,
            supervisorNombre: cmd.supervisorNombre,
            estado: 'borrador',
          },
          createdBy: cmd.createdBy,
          createdAt: now,
          updatedAt: now,
        }

        await this.deps.descartes.save(descarte)
        await this.deps.store.saveAggregate(descarte)
        await this.deps.store.saveMetadata(meta)

        await publishApplicationEvent(this.deps.outbox, this.deps.ids, this.deps.clock, {
          eventName: 'DescarteCreado',
          aggregateType: 'Descarte',
          aggregateId: descarte.id,
          payload: {
            codigo: descarte.codigo,
            estado: descarte.estado,
            motivo: cmd.motivoCodigo,
            lineas: cmd.lineas.length,
          },
        })

        return ok({
          id: descarte.id,
          codigo: descarte.codigo,
          estado: descarte.estado,
          version: descarte.version,
          motivoCodigo: cmd.motivoCodigo,
          lineas: cmd.lineas.length,
        })
      } catch (error) {
        return mapDomainError(error)
      }
    })
  }
}
