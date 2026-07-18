import { describe, expect, it } from 'vitest'
import { CreateConteoHandler } from '../handlers/CreateConteoHandler'
import { ConteoApplicationService } from '../services/ConteoApplicationService'
import {
  FakeAlmacenRepository,
  FakeClock,
  FakeConteoRepository,
  FakeExistenciaRepository,
  FakeIdGenerator,
  FakeOutbox,
  FakeUnitOfWork,
} from '../testing/fakes'

describe('CreateConteoHandler', () => {
  it('crea conteo en borrador con productos de alcance sin mover stock', async () => {
    const uow = new FakeUnitOfWork()
    const conteos = new FakeConteoRepository()
    const almacenes = new FakeAlmacenRepository()
    almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
    const service = new ConteoApplicationService({
      uow,
      conteos,
      existencias: new FakeExistenciaRepository(),
      almacenes,
      outbox: new FakeOutbox(),
      clock: new FakeClock(),
      ids: new FakeIdGenerator(),
    })
    const handler = new CreateConteoHandler(service)

    const result = await handler.execute({
      nombre: 'Conteo parcial Literatura',
      tipoConteo: 'parcial',
      sucursalId: 'suc-1',
      almacenId: 'alm-a',
      alcanceTipo: 'categoria',
      alcanceValor: 'Literatura',
      responsableId: 'user-1',
      responsableNombre: 'Operador',
      bloquearAlmacenAlAbrir: true,
      permitirReconteo: true,
      diferenciaMinimaReconteo: 1,
      productos: [
        {
          productoId: 'P-001',
          titulo: '1984',
          existenciaActual: 3,
          stockMinimo: 10,
        },
      ],
      createdBy: 'user-1',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.estado).toBe('borrador')
    expect(result.value.fase).toBe('Crear')
    expect(result.value.productosAlcance).toBe(1)
    expect(uow.committed).toBe(true)

    const meta = await conteos.getCreateMetadata(result.value.id)
    expect(meta?.productos).toHaveLength(1)
    expect(meta?.nombre).toBe('Conteo parcial Literatura')
  })

  it('rechaza creación sin productos', async () => {
    const almacenes = new FakeAlmacenRepository()
    almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
    const handler = new CreateConteoHandler(
      new ConteoApplicationService({
        uow: new FakeUnitOfWork(),
        conteos: new FakeConteoRepository(),
        existencias: new FakeExistenciaRepository(),
        almacenes,
        outbox: new FakeOutbox(),
        clock: new FakeClock(),
        ids: new FakeIdGenerator(),
      }),
    )

    const result = await handler.execute({
      nombre: 'Vacío',
      tipoConteo: 'general',
      sucursalId: 'suc-1',
      almacenId: 'alm-a',
      alcanceTipo: 'todo_almacen',
      responsableId: 'user-1',
      bloquearAlmacenAlAbrir: true,
      permitirReconteo: true,
      diferenciaMinimaReconteo: 1,
      productos: [],
      createdBy: 'user-1',
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('VALIDATION')
  })
})
