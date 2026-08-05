import {
  AlmacenSnapshot,
  IAlmacenRepository,
  IAjusteRepository,
  IAuditoriaInventarioRepository,
  IConteoFisicoRepository,
  IDescarteRepository,
  IExistenciaRepository,
  IIdempotencyRepository,
  IKardexRepository,
  IMovimientoInventarioRepository,
  IOutbox,
  IProductoReadPort,
  ITransferenciaRepository,
  IdempotencyRecord,
  OutboxMessage,
  ProductoSnapshot,
} from '../../application/ports/outbound'
import { Ajuste } from '../../domain/aggregates/Ajuste'
import { ConteoFisico } from '../../domain/aggregates/ConteoFisico'
import { Descarte } from '../../domain/aggregates/Descarte'
import { Transferencia } from '../../domain/aggregates/Transferencia'
import type { ConteoCreateMetadata } from '../../application/models/ConteoCreateMetadata'
import { AuditoriaMovimiento } from '../../domain/entities/AuditoriaMovimiento'
import { Existencia } from '../../domain/entities/Existencia'
import { Kardex } from '../../domain/entities/Kardex'
import { MovimientoInventario } from '../../domain/entities/MovimientoInventario'
import { DocumentoOrigenRef } from '../../domain/value-objects/DocumentoOrigenRef'
import { IdempotencyKey } from '../../domain/value-objects/IdempotencyKey'
import { Cantidad } from '../../domain/value-objects/Cantidad'
import { Saldo } from '../../domain/value-objects/Saldo'
import { TipoMovimiento } from '../../domain/value-objects/TipoMovimiento'
import { InMemoryDatabaseAdapter, JsonRecord } from './InMemoryDatabaseAdapter'

export class DbTransferenciaRepository implements ITransferenciaRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<Transferencia | null> {
    const row = this.db.tables.transferencias.get(id)
    if (!row) return null
    return Transferencia.rehidratar(row as unknown as ReturnType<Transferencia['toProps']>)
  }

  async save(transferencia: Transferencia): Promise<void> {
    this.db.tables.transferencias.set(transferencia.id, transferencia.toProps() as unknown as Record<string, unknown>)
  }

  async listAll(): Promise<Transferencia[]> {
    const items: Transferencia[] = []
    for (const row of this.db.tables.transferencias.values()) {
      items.push(Transferencia.rehidratar(row as unknown as ReturnType<Transferencia['toProps']>))
    }
    return items
  }
}

export class DbDescarteRepository implements IDescarteRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<Descarte | null> {
    const row = this.db.tables.descartes.get(id)
    if (!row) return null
    return Descarte.rehidratar(row as unknown as ReturnType<Descarte['toProps']>)
  }

  async save(descarte: Descarte): Promise<void> {
    this.db.tables.descartes.set(descarte.id, descarte.toProps() as unknown as Record<string, unknown>)
  }

  async listAll(): Promise<Descarte[]> {
    const items: Descarte[] = []
    for (const row of this.db.tables.descartes.values()) {
      items.push(Descarte.rehidratar(row as unknown as ReturnType<Descarte['toProps']>))
    }
    return items
  }
}

export class DbAjusteRepository implements IAjusteRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<Ajuste | null> {
    const row = this.db.tables.ajustes.get(id)
    if (!row) return null
    return Ajuste.rehidratar(row as unknown as ReturnType<Ajuste['toProps']>)
  }

  async save(ajuste: Ajuste): Promise<void> {
    this.db.tables.ajustes.set(ajuste.id, ajuste.toProps() as unknown as Record<string, unknown>)
  }

  async listAll(): Promise<Ajuste[]> {
    const items: Ajuste[] = []
    for (const row of this.db.tables.ajustes.values()) {
      items.push(Ajuste.rehidratar(row as unknown as ReturnType<Ajuste['toProps']>))
    }
    return items
  }
}

export class DbConteoRepository implements IConteoFisicoRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<ConteoFisico | null> {
    const row = this.db.tables.conteos.get(id)
    if (!row) return null
    return ConteoFisico.rehidratar(row as unknown as ReturnType<ConteoFisico['toProps']>)
  }

  async listAll(): Promise<ConteoFisico[]> {
    const items: ConteoFisico[] = []
    for (const row of this.db.tables.conteos.values()) {
      items.push(ConteoFisico.rehidratar(row as unknown as ReturnType<ConteoFisico['toProps']>))
    }
    return items
  }

  async existsSesionActivaConflictiva(
    almacenId: string,
    excludeId?: string,
  ): Promise<boolean> {
    for (const row of this.db.tables.conteos.values()) {
      if (String(row.id) === excludeId) continue
      if (String(row.almacenId) !== almacenId) continue
      const estado = String(row.estado)
      if (estado === 'abierto' || estado === 'en_conteo' || estado === 'en_revision') {
        return true
      }
    }
    return false
  }

  async save(conteo: ConteoFisico): Promise<void> {
    this.db.tables.conteos.set(conteo.id, conteo.toProps() as unknown as Record<string, unknown>)
  }

  async saveCreateMetadata(meta: ConteoCreateMetadata): Promise<void> {
    this.db.tables.conteoMetadata.set(meta.conteoId, { ...meta } as unknown as Record<string, unknown>)
  }

  async getCreateMetadata(conteoId: string): Promise<ConteoCreateMetadata | null> {
    const row = this.db.tables.conteoMetadata.get(conteoId)
    if (!row) return null
    return row as unknown as ConteoCreateMetadata
  }

  async listCreateMetadata(): Promise<ConteoCreateMetadata[]> {
    return [...this.db.tables.conteoMetadata.values()].map((r) => r as unknown as ConteoCreateMetadata)
  }

  async appendAuditoria(entry: {
    id: string
    conteoId: string
    accion: string
    usuarioId: string
    resultado: 'OK' | 'RECHAZADO' | 'ERROR'
    detalle?: string
  }): Promise<void> {
    this.db.tables.conteoAuditoria.set(entry.id, {
      ...entry,
      createdAt: new Date().toISOString(),
    })
  }
}

export class DbExistenciaRepository implements IExistenciaRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  private key(productoId: string, almacenId: string): string {
    return `${productoId}::${almacenId}`
  }

  async get(productoId: string, almacenId: string): Promise<Existencia | null> {
    const row = this.db.tables.existencias.get(this.key(productoId, almacenId))
    if (!row) return null
    return Existencia.crear({
      id: String(row.id),
      productoId: String(row.productoId),
      almacenId: String(row.almacenId),
      saldo: Number(row.saldo),
      version: Number(row.version),
    })
  }

  async listByAlmacen(almacenId: string): Promise<Existencia[]> {
    const result: Existencia[] = []
    for (const row of this.db.tables.existencias.values()) {
      if (String(row.almacenId) !== almacenId) continue
      result.push(
        Existencia.crear({
          id: String(row.id),
          productoId: String(row.productoId),
          almacenId: String(row.almacenId),
          saldo: Number(row.saldo),
          version: Number(row.version),
        }),
      )
    }
    return result
  }

  async save(existencia: Existencia): Promise<void> {
    const snap = existencia.toSnapshot()
    this.db.tables.existencias.set(this.key(snap.productoId, snap.almacenId), {
      ...snap,
    })
  }
}

export class DbMovimientoRepository implements IMovimientoInventarioRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async add(movimiento: MovimientoInventario): Promise<void> {
    const props = movimiento.toProps()
    this.db.tables.movimientos.set(props.id, {
      ...props,
      documentoTipo: props.documento.tipo,
      documentoId: props.documento.id,
      documentoLineaId: props.documento.lineaId,
      fechaMovimiento: props.fechaMovimiento.toISOString(),
    })
  }

  async listAll(): Promise<MovimientoInventario[]> {
    const items: MovimientoInventario[] = []
    for (const row of this.db.tables.movimientos.values()) {
      items.push(rehydrateMovimiento(row))
    }
    return items
  }
}

function rehydrateMovimiento(row: Record<string, unknown>): MovimientoInventario {
  return MovimientoInventario.registrar({
    id: String(row.id),
    tipoMovimiento: row.tipoMovimiento as TipoMovimiento,
    productoId: String(row.productoId),
    almacenId: String(row.almacenId),
    cantidad: Cantidad.positive(Number(row.cantidad)),
    saldoAnterior: Saldo.of(Number(row.saldoAnterior)),
    saldoPosterior: Saldo.of(Number(row.saldoPosterior)),
    documento: DocumentoOrigenRef.of(
      row.documentoTipo as 'transferencia',
      String(row.documentoId),
      row.documentoLineaId ? String(row.documentoLineaId) : undefined,
    ),
    usuarioId: String(row.usuarioId),
    fechaMovimiento: new Date(String(row.fechaMovimiento)),
    idempotencyKey: IdempotencyKey.of(String(row.idempotencyKey)),
    motivoCodigo: row.motivoCodigo ? String(row.motivoCodigo) : undefined,
    observacion: row.observacion ? String(row.observacion) : undefined,
    movimientoCompensaId: row.movimientoCompensaId
      ? String(row.movimientoCompensaId)
      : undefined,
  })
}

export class DbKardexRepository implements IKardexRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async add(kardex: Kardex): Promise<void> {
    this.db.tables.kardex.set(kardex.id, {
      id: kardex.id,
      movimientoId: kardex.movimientoId,
      productoId: kardex.productoId,
      almacenId: kardex.almacenId,
      tipoMovimiento: kardex.tipoMovimiento,
      cantidad: kardex.cantidad,
      saldoAnterior: kardex.saldoAnterior,
      saldoPosterior: kardex.saldoPosterior,
      documentoTipo: kardex.documentoTipo,
      documentoId: kardex.documentoId,
      usuarioId: kardex.usuarioId,
      fechaMovimiento: kardex.fechaMovimiento.toISOString(),
      motivoCodigo: kardex.motivoCodigo,
      observacion: kardex.observacion,
    })
  }

  async listAll(): Promise<JsonRecord[]> {
    return [...this.db.tables.kardex.values()]
  }
}

export class DbAuditoriaRepository implements IAuditoriaInventarioRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async add(auditoria: AuditoriaMovimiento): Promise<void> {
    this.db.tables.auditorias.set(auditoria.id, {
      id: auditoria.id,
      tipoAccion: auditoria.tipoAccion,
      usuarioId: auditoria.usuarioId,
      fecha: auditoria.fecha.toISOString(),
      resultado: auditoria.resultado,
      movimientoId: auditoria.movimientoId,
      documentoTipo: auditoria.documentoTipo,
      documentoId: auditoria.documentoId,
      productoId: auditoria.productoId,
      almacenId: auditoria.almacenId,
      valorAntes: auditoria.valorAntes,
      valorDespues: auditoria.valorDespues,
      detalle: auditoria.detalle,
      idempotencyKey: auditoria.idempotencyKey,
    })
  }

  async listAll(): Promise<JsonRecord[]> {
    return [...this.db.tables.auditorias.values()]
  }
}

export class DbIdempotencyRepository implements IIdempotencyRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async get(key: string): Promise<IdempotencyRecord | null> {
    const row = this.db.tables.idempotency.get(key)
    if (!row) return null
    return {
      key: String(row.key),
      tipoOperacion: String(row.tipoOperacion),
      documentoTipo: String(row.documentoTipo),
      documentoId: String(row.documentoId),
      resultado: row.resultado,
      fechaRegistro: new Date(String(row.fechaRegistro)),
    }
  }

  async save(record: IdempotencyRecord): Promise<void> {
    this.db.tables.idempotency.set(record.key, {
      key: record.key,
      tipoOperacion: record.tipoOperacion,
      documentoTipo: record.documentoTipo,
      documentoId: record.documentoId,
      resultado: structuredClone(record.resultado),
      fechaRegistro: record.fechaRegistro.toISOString(),
    })
  }
}

export class DbOutboxRepository implements IOutbox {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async add(message: OutboxMessage): Promise<void> {
    this.db.tables.outbox.set(message.id, {
      id: message.id,
      eventName: message.eventName,
      aggregateType: message.aggregateType,
      aggregateId: message.aggregateId,
      payload: structuredClone(message.payload),
      occurredAt: message.occurredAt.toISOString(),
      estadoPublicacion: 'pendiente',
      intentosPublicacion: 0,
    })
  }

  async listPending(limit = 50): Promise<OutboxMessage[]> {
    const pending: OutboxMessage[] = []
    for (const row of this.db.tables.outbox.values()) {
      if (String(row.estadoPublicacion) !== 'pendiente') continue
      pending.push({
        id: String(row.id),
        eventName: String(row.eventName),
        aggregateType: String(row.aggregateType),
        aggregateId: String(row.aggregateId),
        payload: row.payload as Record<string, unknown>,
        occurredAt: new Date(String(row.occurredAt)),
      })
      if (pending.length >= limit) break
    }
    return pending
  }

  async markPublished(id: string): Promise<void> {
    const row = this.db.tables.outbox.get(id)
    if (!row) return
    row.estadoPublicacion = 'publicado'
  }

  async markError(id: string, error: string): Promise<void> {
    const row = this.db.tables.outbox.get(id)
    if (!row) return
    row.estadoPublicacion = 'error'
    row.ultimoError = error
    row.intentosPublicacion = Number(row.intentosPublicacion ?? 0) + 1
  }
}

export class DbAlmacenRepository implements IAlmacenRepository {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<AlmacenSnapshot | null> {
    const row = this.db.tables.almacenes.get(id)
    if (!row) return null
    return {
      id: String(row.id),
      bloqueadoPorConteo: Boolean(row.bloqueadoPorConteo),
      conteoBloqueanteId: row.conteoBloqueanteId
        ? String(row.conteoBloqueanteId)
        : undefined,
    }
  }

  async updateBloqueo(
    almacenId: string,
    bloqueado: boolean,
    conteoBloqueanteId?: string,
  ): Promise<void> {
    const row = this.db.tables.almacenes.get(almacenId)
    if (!row) return
    row.bloqueadoPorConteo = bloqueado
    row.conteoBloqueanteId = bloqueado ? conteoBloqueanteId : undefined
  }
}

export class DbProductoReadAdapter implements IProductoReadPort {
  constructor(private readonly db: InMemoryDatabaseAdapter) {}

  async getById(id: string): Promise<ProductoSnapshot | null> {
    const row = this.db.tables.productos.get(id)
    if (!row) return null
    return {
      id: String(row.id),
      activo: Boolean(row.activo),
      costoReferencia: row.costoReferencia !== undefined
        ? Number(row.costoReferencia)
        : undefined,
    }
  }

  async listAll(): Promise<JsonRecord[]> {
    return [...this.db.tables.productos.values()]
  }
}
