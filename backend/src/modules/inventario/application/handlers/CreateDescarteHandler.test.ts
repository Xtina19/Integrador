import { describe, expect, it } from 'vitest'
import { CreateDescarteHandler } from '../handlers/CreateDescarteHandler'
import { InMemoryDescarteCreateStore } from '../testing/InMemoryDescarteCreateStore'
import {
  FakeAlmacenRepository,
  FakeClock,
  FakeDescarteRepository,
  FakeExistenciaRepository,
  FakeIdGenerator,
  FakeOutbox,
  FakeUnitOfWork,
} from '../testing/fakes'
import { Existencia } from '../../domain/entities/Existencia'

describe('CreateDescarteHandler', () => {
  it('crea descarte en borrador sin mover stock', async () => {
    const uow = new FakeUnitOfWork()
    const descartes = new FakeDescarteRepository()
    const store = new InMemoryDescarteCreateStore()
    const almacenes = new FakeAlmacenRepository()
    almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
    const existencias = new FakeExistenciaRepository()
    existencias.seed(
      Existencia.crear({
        id: 'ex-1',
        productoId: 'P-001',
        almacenId: 'alm-a',
        saldo: 10,
        version: 1,
      }),
    )

    const handler = new CreateDescarteHandler({
      uow,
      descartes,
      store,
      almacenes,
      existencias,
      outbox: new FakeOutbox(),
      clock: new FakeClock(),
      ids: new FakeIdGenerator(),
    })

    const result = await handler.execute({
      fecha: '2026-07-18',
      sucursalId: 'suc-1',
      almacenId: 'alm-a',
      responsableId: 'user-1',
      responsableNombre: 'Operador',
      motivoCodigo: 'DANO_FISICO',
      lineas: [
        {
          productoId: 'P-001',
          titulo: '1984',
          existenciaActual: 10,
          cantidad: 2,
          costo: 15,
        },
      ],
      evidencias: [
        { tipo: 'fotografia', nombreArchivo: 'dano.jpg', comentario: 'Caja mojada' },
      ],
      requiereAprobacion: true,
      supervisorNombre: 'Supervisor',
      createdBy: 'user-1',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.estado).toBe('borrador')
    expect(result.value.lineas).toBe(1)
    expect(uow.committed).toBe(true)

    const meta = await store.getMetadata(result.value.id)
    expect(meta?.evidencias).toHaveLength(1)
    expect(meta?.aprobacion.estado).toBe('borrador')

    const stock = await existencias.get('P-001', 'alm-a')
    expect(stock?.saldo.value).toBe(10)
  })

  it('rechaza cantidad mayor al stock', async () => {
    const almacenes = new FakeAlmacenRepository()
    almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
    const handler = new CreateDescarteHandler({
      uow: new FakeUnitOfWork(),
      descartes: new FakeDescarteRepository(),
      store: new InMemoryDescarteCreateStore(),
      almacenes,
      existencias: new FakeExistenciaRepository(),
      outbox: new FakeOutbox(),
      clock: new FakeClock(),
      ids: new FakeIdGenerator(),
    })

    const result = await handler.execute({
      fecha: '2026-07-18',
      sucursalId: 'suc-1',
      almacenId: 'alm-a',
      responsableId: 'user-1',
      motivoCodigo: 'PERDIDA',
      lineas: [
        {
          productoId: 'P-001',
          existenciaActual: 3,
          cantidad: 5,
          costo: 10,
        },
      ],
      evidencias: [],
      requiereAprobacion: true,
      createdBy: 'user-1',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION')
  })

  it('exige descripción cuando motivo es OTRO', async () => {
    const almacenes = new FakeAlmacenRepository()
    almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
    const handler = new CreateDescarteHandler({
      uow: new FakeUnitOfWork(),
      descartes: new FakeDescarteRepository(),
      store: new InMemoryDescarteCreateStore(),
      almacenes,
      existencias: new FakeExistenciaRepository(),
      outbox: new FakeOutbox(),
      clock: new FakeClock(),
      ids: new FakeIdGenerator(),
    })

    const result = await handler.execute({
      fecha: '2026-07-18',
      sucursalId: 'suc-1',
      almacenId: 'alm-a',
      responsableId: 'user-1',
      motivoCodigo: 'OTRO',
      lineas: [
        { productoId: 'P-001', existenciaActual: 5, cantidad: 1, costo: 10 },
      ],
      evidencias: [],
      requiereAprobacion: false,
      createdBy: 'user-1',
    })

    expect(result.ok).toBe(false)
  })
})
