import { AuditoriaMovimiento } from '../entities/AuditoriaMovimiento'
import { Existencia } from '../entities/Existencia'
import { Kardex } from '../entities/Kardex'
import { MovimientoInventario } from '../entities/MovimientoInventario'
import { InventoryDomainError } from '../errors/InventoryDomainError'
import {
  InventoryDomainEvent,
  MovimientoRegistradoEvent,
  StockActualizadoEvent,
} from '../events/InventoryDomainEvents'
import { Cantidad } from '../value-objects/Cantidad'
import { DocumentoOrigenRef } from '../value-objects/DocumentoOrigenRef'
import { IdempotencyKey } from '../value-objects/IdempotencyKey'
import {
  SentidoMovimiento,
  TipoMovimiento,
  sentidoDe,
} from '../value-objects/TipoMovimiento'
import { Version } from '../value-objects/Version'

export interface EngineResult {
  readonly replayed: boolean
  readonly movimiento: MovimientoInventario
  readonly kardex: Kardex
  readonly auditoria: AuditoriaMovimiento
  readonly existencia: Existencia
  readonly events: readonly InventoryDomainEvent[]
}

export interface EngineContext {
  readonly now: Date
  readonly generateId: () => string
  /**
   * Resultado previo para la misma IdempotencyKey.
   * Si está presente, el Engine no muta y lo reexpone (replay).
   */
  readonly previousResultForKey?: EngineResult
  /** Bloqueo de conteo en el almacén (Application decide excepciones de regularización). */
  readonly almacenBloqueado?: boolean
  /** Default true si se omite. */
  readonly productoActivo?: boolean
}

interface MovimientoBaseCommand {
  readonly existencia: Existencia
  readonly expectedVersion: number
  readonly cantidad: number
  readonly documento: DocumentoOrigenRef
  readonly usuarioId: string
  readonly idempotencyKey: string
  readonly motivoCodigo?: string
  readonly observacion?: string
}

export interface RegistrarEntradaCommand extends MovimientoBaseCommand {
  readonly tipoMovimiento:
    | 'transferencia_entrada'
    | 'recepcion'
    | 'devolucion_entrada'
}

export interface RegistrarSalidaCommand extends MovimientoBaseCommand {
  readonly tipoMovimiento: 'transferencia_salida' | 'venta'
}

export interface AplicarDescarteCommand extends MovimientoBaseCommand {
  readonly motivoCodigo: string
}

export interface AplicarAjusteCommand {
  readonly existencia: Existencia
  readonly expectedVersion: number
  readonly documento: DocumentoOrigenRef
  readonly usuarioId: string
  readonly idempotencyKey: string
  /** Saldo objetivo tras el ajuste. Mutuamente excluyente con `diferencia`. */
  readonly cantidadObjetivo?: number
  /** Delta con signo: positivo = entrada, negativo = salida. */
  readonly diferencia?: number
  readonly motivoCodigo?: string
  readonly observacion?: string
}

export interface RegistrarCompensacionCommand {
  readonly existencia: Existencia
  readonly expectedVersion: number
  readonly movimientoOriginal: MovimientoInventario
  readonly documento: DocumentoOrigenRef
  readonly usuarioId: string
  readonly idempotencyKey: string
  readonly observacion?: string
}

/**
 * Inventory Engine — único servicio de dominio autorizado a mutar Existencia.
 *
 * Responsabilidades:
 * - Validar stock, versión, documento, actor e idempotencia
 * - Aplicar delta atómico sobre Existencia
 * - Generar MovimientoInventario + Kardex + Auditoría + eventos
 *
 * No conoce persistencia, HTTP ni frameworks.
 */
export class InventoryEngine {
  /**
   * Entrada genérica (recepción, transferencia_entrada, devolución).
   */
  registrarEntrada(
    command: RegistrarEntradaCommand,
    context: EngineContext,
  ): EngineResult {
    this.assertSentidoEntrada(command.tipoMovimiento)
    return this.ejecutarMovimiento(
      {
        ...command,
        tipoMovimiento: command.tipoMovimiento,
        sentido: 'entrada',
      },
      context,
    )
  }

  /**
   * Salida genérica (transferencia_salida, venta).
   */
  registrarSalida(
    command: RegistrarSalidaCommand,
    context: EngineContext,
  ): EngineResult {
    return this.ejecutarMovimiento(
      {
        ...command,
        tipoMovimiento: command.tipoMovimiento,
        sentido: 'salida',
      },
      context,
    )
  }

  /**
   * Baja tipificada. Siempre reduce stock.
   */
  aplicarDescarte(
    command: AplicarDescarteCommand,
    context: EngineContext,
  ): EngineResult {
    if (!command.motivoCodigo?.trim()) {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'El descarte requiere motivo tipificado.',
      )
    }
    return this.ejecutarMovimiento(
      {
        ...command,
        tipoMovimiento: 'descarte',
        sentido: 'salida',
        motivoCodigo: command.motivoCodigo.trim(),
      },
      context,
    )
  }

  /**
   * Regularización a saldo objetivo o por diferencia neta.
   * Modelo canónico: objetivo → diferencia.
   */
  aplicarAjuste(
    command: AplicarAjusteCommand,
    context: EngineContext,
  ): EngineResult {
    const diferencia = this.resolverDiferenciaAjuste(command)
    if (diferencia === 0) {
      throw new InventoryDomainError(
        'INVALID_ADJUSTMENT',
        'El ajuste requiere una diferencia distinta de cero.',
        {
          saldoActual: command.existencia.saldo.value,
          cantidadObjetivo: command.cantidadObjetivo,
          diferencia: command.diferencia,
        },
      )
    }

    const sentido: SentidoMovimiento = diferencia > 0 ? 'entrada' : 'salida'
    const cantidad = Math.abs(diferencia)

    return this.ejecutarMovimiento(
      {
        existencia: command.existencia,
        expectedVersion: command.expectedVersion,
        cantidad,
        documento: command.documento,
        usuarioId: command.usuarioId,
        idempotencyKey: command.idempotencyKey,
        tipoMovimiento: 'ajuste',
        sentido,
        motivoCodigo: command.motivoCodigo,
        observacion: command.observacion,
      },
      context,
    )
  }

  /**
   * Movimiento compensatorio que invierte el efecto de un movimiento previo.
   * No edita el asiento original.
   */
  registrarCompensacion(
    command: RegistrarCompensacionCommand,
    context: EngineContext,
  ): EngineResult {
    const original = command.movimientoOriginal
    if (
      original.productoId !== command.existencia.productoId ||
      original.almacenId !== command.existencia.almacenId
    ) {
      throw new InventoryDomainError(
        'INVALID_COMPENSATION',
        'La compensación debe aplicarse sobre la misma existencia del movimiento original.',
        {
          productoEsperado: original.productoId,
          almacenEsperado: original.almacenId,
          productoActual: command.existencia.productoId,
          almacenActual: command.existencia.almacenId,
        },
      )
    }

    const sentidoOriginal = this.inferirSentidoHistorico(original)
    const sentido: SentidoMovimiento =
      sentidoOriginal === 'entrada' ? 'salida' : 'entrada'

    return this.ejecutarMovimiento(
      {
        existencia: command.existencia,
        expectedVersion: command.expectedVersion,
        cantidad: original.cantidad.value,
        documento: command.documento,
        usuarioId: command.usuarioId,
        idempotencyKey: command.idempotencyKey,
        tipoMovimiento: 'compensacion',
        sentido,
        observacion: command.observacion,
        movimientoCompensaId: original.id,
      },
      context,
    )
  }

  // ---------------------------------------------------------------------------
  // Núcleo interno
  // ---------------------------------------------------------------------------

  private ejecutarMovimiento(
    command: {
      existencia: Existencia
      expectedVersion: number
      cantidad: number
      documento: DocumentoOrigenRef
      usuarioId: string
      idempotencyKey: string
      tipoMovimiento: TipoMovimiento
      sentido: SentidoMovimiento
      motivoCodigo?: string
      observacion?: string
      movimientoCompensaId?: string
    },
    context: EngineContext,
  ): EngineResult {
    const key = IdempotencyKey.of(command.idempotencyKey)

    if (context.previousResultForKey) {
      this.assertReplayCompatible(context.previousResultForKey, key)
      return {
        ...context.previousResultForKey,
        replayed: true,
      }
    }

    this.validarContexto(command, context)

    const cantidad = Cantidad.positive(command.cantidad)
    const expectedVersion = Version.of(command.expectedVersion)
    const existencia = command.existencia

    const { saldoAnterior, saldoPosterior } =
      command.sentido === 'entrada'
        ? existencia.incrementar(cantidad, expectedVersion)
        : existencia.decrementar(cantidad, expectedVersion)

    if (saldoPosterior.value < 0) {
      throw new InventoryDomainError(
        'NEGATIVE_STOCK',
        'La operación produciría stock negativo.',
      )
    }

    const movimiento = MovimientoInventario.registrar({
      id: context.generateId(),
      tipoMovimiento: command.tipoMovimiento,
      productoId: existencia.productoId,
      almacenId: existencia.almacenId,
      cantidad,
      saldoAnterior,
      saldoPosterior,
      documento: command.documento,
      usuarioId: command.usuarioId.trim(),
      fechaMovimiento: context.now,
      idempotencyKey: key,
      motivoCodigo: command.motivoCodigo,
      observacion: command.observacion,
      movimientoCompensaId: command.movimientoCompensaId,
    })

    const kardex = Kardex.desdeMovimiento(context.generateId(), movimiento)

    const auditoria = AuditoriaMovimiento.deMovimiento({
      id: context.generateId(),
      usuarioId: movimiento.usuarioId,
      fecha: context.now,
      movimientoId: movimiento.id,
      documentoTipo: movimiento.documento.tipo,
      documentoId: movimiento.documento.id,
      productoId: movimiento.productoId,
      almacenId: movimiento.almacenId,
      valorAntes: {
        saldo: saldoAnterior.value,
        version: expectedVersion.value,
      },
      valorDespues: {
        saldo: saldoPosterior.value,
        version: existencia.version.value,
      },
      idempotencyKey: key.value,
      detalle: `Movimiento ${command.tipoMovimiento} (${command.sentido})`,
    })

    const events = this.crearEventos(context, movimiento, existencia)

    return {
      replayed: false,
      movimiento,
      kardex,
      auditoria,
      existencia,
      events,
    }
  }

  private validarContexto(
    command: {
      usuarioId: string
      documento: DocumentoOrigenRef
    },
    context: EngineContext,
  ): void {
    if (!command.usuarioId?.trim()) {
      throw new InventoryDomainError(
        'MISSING_ACTOR',
        'El movimiento requiere un usuario actor.',
      )
    }
    if (!command.documento) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'Todo movimiento requiere documento origen.',
      )
    }
    if (context.productoActivo === false) {
      throw new InventoryDomainError(
        'PRODUCTO_INACTIVO',
        'No se permiten movimientos sobre productos inactivos.',
      )
    }
    if (context.almacenBloqueado === true) {
      throw new InventoryDomainError(
        'ALMACEN_BLOQUEADO',
        'El almacén está bloqueado por un conteo físico activo.',
      )
    }
  }

  private resolverDiferenciaAjuste(command: AplicarAjusteCommand): number {
    const hasObjetivo = command.cantidadObjetivo !== undefined
    const hasDiferencia = command.diferencia !== undefined

    if (hasObjetivo === hasDiferencia) {
      throw new InventoryDomainError(
        'INVALID_ADJUSTMENT',
        'El ajuste debe indicar exactamente cantidadObjetivo o diferencia.',
      )
    }

    if (hasObjetivo) {
      const objetivo = command.cantidadObjetivo as number
      if (!Number.isInteger(objetivo) || objetivo < 0) {
        throw new InventoryDomainError(
          'INVALID_ADJUSTMENT',
          'La cantidad objetivo debe ser un entero >= 0.',
          { cantidadObjetivo: objetivo },
        )
      }
      return objetivo - command.existencia.saldo.value
    }

    const diferencia = command.diferencia as number
    if (!Number.isInteger(diferencia) || diferencia === 0) {
      throw new InventoryDomainError(
        'INVALID_ADJUSTMENT',
        'La diferencia debe ser un entero distinto de cero.',
        { diferencia },
      )
    }
    return diferencia
  }

  private assertSentidoEntrada(
    tipo: RegistrarEntradaCommand['tipoMovimiento'],
  ): void {
    if (sentidoDe(tipo) !== 'entrada') {
      throw new InventoryDomainError(
        'INVALID_MOVEMENT_TYPE',
        'Tipo de movimiento incompatible con registrarEntrada.',
        { tipo },
      )
    }
  }

  private inferirSentidoHistorico(
    movimiento: MovimientoInventario,
  ): SentidoMovimiento {
    if (movimiento.saldoPosterior.value > movimiento.saldoAnterior.value) {
      return 'entrada'
    }
    if (movimiento.saldoPosterior.value < movimiento.saldoAnterior.value) {
      return 'salida'
    }
    throw new InventoryDomainError(
      'INVALID_COMPENSATION',
      'No se puede compensar un movimiento con efecto nulo.',
      { movimientoId: movimiento.id },
    )
  }

  private assertReplayCompatible(
    previous: EngineResult,
    key: IdempotencyKey,
  ): void {
    if (!previous.movimiento.idempotencyKey.equals(key)) {
      throw new InventoryDomainError(
        'IDEMPOTENCY_CONFLICT',
        'El resultado previo no corresponde a la clave de idempotencia indicada.',
      )
    }
  }

  private crearEventos(
    context: EngineContext,
    movimiento: MovimientoInventario,
    existencia: Existencia,
  ): InventoryDomainEvent[] {
    const movimientoEvent: MovimientoRegistradoEvent = {
      eventId: context.generateId(),
      name: 'MovimientoRegistrado',
      occurredAt: context.now,
      aggregateType: 'MovimientoInventario',
      aggregateId: movimiento.id,
      payload: {
        movimientoId: movimiento.id,
        tipoMovimiento: movimiento.tipoMovimiento,
        productoId: movimiento.productoId,
        almacenId: movimiento.almacenId,
        cantidad: movimiento.cantidad.value,
        saldoAnterior: movimiento.saldoAnterior.value,
        saldoPosterior: movimiento.saldoPosterior.value,
        documentoTipo: movimiento.documento.tipo,
        documentoId: movimiento.documento.id,
        idempotencyKey: movimiento.idempotencyKey.value,
      },
    }

    const stockEvent: StockActualizadoEvent = {
      eventId: context.generateId(),
      name: 'StockActualizado',
      occurredAt: context.now,
      aggregateType: 'Existencia',
      aggregateId: existencia.id,
      payload: {
        existenciaId: existencia.id,
        productoId: existencia.productoId,
        almacenId: existencia.almacenId,
        saldoNuevo: existencia.saldo.value,
        version: existencia.version.value,
      },
    }

    return [movimientoEvent, stockEvent]
  }
}
