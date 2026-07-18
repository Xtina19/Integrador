import { describe, expect, it } from 'vitest'
import { Transferencia } from '../../domain/aggregates/Transferencia'
import { InventoryEngine } from '../../domain/services/InventoryEngine'
import { DocumentoOrigenRef } from '../../domain/value-objects/DocumentoOrigenRef'
import {
  createInventarioComposition,
  seedInventarioBasico,
} from '../composition/createInventarioComposition'
import { InMemoryDatabaseAdapter } from '../persistence/InMemoryDatabaseAdapter'
import { InMemoryUnitOfWork } from '../persistence/InMemoryUnitOfWork'
import {
  DbIdempotencyRepository,
  DbTransferenciaRepository,
} from '../persistence/repositories'

describe('Persistencia — repositorios y UnitOfWork', () => {
  it('hace commit de cambios dentro de la UoW', async () => {
    const db = new InMemoryDatabaseAdapter()
    const uow = new InMemoryUnitOfWork(db)
    const repo = new DbTransferenciaRepository(db)

    await uow.begin()
    const transferencia = Transferencia.crear({
      id: 'tr-1',
      codigo: 'TR-1',
      almacenOrigenId: 'a',
      almacenDestinoId: 'b',
      solicitanteId: 'u1',
      lineas: [{ id: 'l1', productoId: 'p1', cantidadSolicitada: 2 }],
    })
    await repo.save(transferencia)
    await uow.commit()

    const loaded = await repo.getById('tr-1')
    expect(loaded?.codigo).toBe('TR-1')
  })

  it('hace rollback y descarta escrituras', async () => {
    const db = new InMemoryDatabaseAdapter()
    const uow = new InMemoryUnitOfWork(db)
    const repo = new DbTransferenciaRepository(db)

    await uow.begin()
    await repo.save(
      Transferencia.crear({
        id: 'tr-2',
        codigo: 'TR-2',
        almacenOrigenId: 'a',
        almacenDestinoId: 'b',
        solicitanteId: 'u1',
        lineas: [{ id: 'l1', productoId: 'p1', cantidadSolicitada: 1 }],
      }),
    )
    await uow.rollback()

    expect(await repo.getById('tr-2')).toBeNull()
  })

  it('persiste existencias y respeta versionado tras Engine', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    const existencias = composition.existencias
    const engine = new InventoryEngine()

    await composition.uow.begin()
    const existencia = await existencias.get('prod-1', 'alm-a')
    expect(existencia).not.toBeNull()
    const result = engine.registrarSalida(
      {
        existencia: existencia!,
        expectedVersion: 1,
        cantidad: 3,
        tipoMovimiento: 'venta',
        documento: DocumentoOrigenRef.of('venta', 'V-1'),
        usuarioId: 'user-1',
        idempotencyKey: 'k-1',
      },
      {
        now: new Date('2026-07-18T16:00:00.000Z'),
        generateId: () => 'mov-1',
      },
    )
    await existencias.save(result.existencia)
    await composition.uow.commit()

    const reloaded = await existencias.get('prod-1', 'alm-a')
    expect(reloaded?.saldo.value).toBe(17)
    expect(reloaded?.version.value).toBe(2)
  })

  it('persiste claves de idempotencia', async () => {
    const db = new InMemoryDatabaseAdapter()
    const repo = new DbIdempotencyRepository(db)
    await repo.save({
      key: 'idem-1',
      tipoOperacion: 'aplicar_descarte',
      documentoTipo: 'descarte',
      documentoId: 'd1',
      resultado: { id: 'd1', estado: 'aplicado' },
      fechaRegistro: new Date(),
    })
    const loaded = await repo.get('idem-1')
    expect(loaded?.documentoId).toBe('d1')
  })
})

describe('Outbox completo', () => {
  it('agrega, publica y marca eventos como publicados', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    const outbox = composition.outbox

    await outbox.add({
      id: 'evt-1',
      eventName: 'TransferenciaDespachada',
      aggregateType: 'Transferencia',
      aggregateId: 'tr-1',
      payload: { estado: 'en_transito' },
      occurredAt: new Date(),
    })

    const pendingBefore = await outbox.listPending()
    expect(pendingBefore).toHaveLength(1)

    const processed = await composition.outboxProcessor.processPending()
    expect(processed.published).toBe(1)
    expect(composition.publisher.published).toHaveLength(1)
    expect(composition.publisher.published[0]?.message.eventName).toBe(
      'TransferenciaDespachada',
    )

    const pendingAfter = await outbox.listPending()
    expect(pendingAfter).toHaveLength(0)
  })

  it('marca error cuando el publisher falla', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    await composition.outbox.add({
      id: 'evt-fail',
      eventName: 'AjusteAplicado',
      aggregateType: 'Ajuste',
      aggregateId: 'aj-1',
      payload: {},
      occurredAt: new Date(),
    })

    composition.publisher.publish = async () => {
      throw new Error('broker down')
    }

    const processed = await composition.outboxProcessor.processPending()
    expect(processed.failed).toBe(1)
    expect(composition.db.tables.outbox.get('evt-fail')?.estadoPublicacion).toBe(
      'error',
    )
  })
})

describe('Integración application + infraestructura', () => {
  it('despacha transferencia persistiendo movimiento y outbox', async () => {
    const composition = createInventarioComposition({ sequentialIds: true })
    seedInventarioBasico(composition.db)
    composition.auth.grant('user-1', '*')

    const creada = await composition.transferenciaService.crearTransferencia({
      codigo: 'TR-INT-1',
      almacenOrigenId: 'alm-a',
      almacenDestinoId: 'alm-b',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidadSolicitada: 4 }],
    })
    expect(creada.ok).toBe(true)
    if (!creada.ok) return

    const despachada = await composition.transferenciaService.despacharTransferencia({
      transferenciaId: creada.value.id,
      actorId: 'user-1',
      expectedVersion: creada.value.version,
      idempotencyKey: 'despachar-int-1',
    })
    expect(despachada.ok).toBe(true)
    if (!despachada.ok) return

    const existencia = await composition.existencias.get('prod-1', 'alm-a')
    expect(existencia?.saldo.value).toBe(16)

    const movimientos = await composition.movimientos.listAll()
    expect(movimientos.some((m) => m.tipoMovimiento === 'transferencia_salida')).toBe(
      true,
    )

    const pending = await composition.outbox.listPending()
    expect(pending.length).toBeGreaterThan(0)

    await composition.outboxProcessor.processPending()
    expect(composition.publisher.published.length).toBeGreaterThan(0)
  })
})
