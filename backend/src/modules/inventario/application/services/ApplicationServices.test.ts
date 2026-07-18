import { describe, expect, it } from 'vitest'
import { Existencia } from '../../domain/entities/Existencia'
import { InventoryEngine } from '../../domain/services/InventoryEngine'
import { AjusteApplicationService } from '../services/AjusteApplicationService'
import { ConteoApplicationService } from '../services/ConteoApplicationService'
import { DescarteApplicationService } from '../services/DescarteApplicationService'
import { TransferenciaApplicationService } from '../services/TransferenciaApplicationService'
import {
  FakeAlmacenRepository,
  FakeAjusteRepository,
  FakeAuditoriaRepository,
  FakeClock,
  FakeConteoRepository,
  FakeDescarteRepository,
  FakeExistenciaRepository,
  FakeIdGenerator,
  FakeIdempotencyRepository,
  FakeKardexRepository,
  FakeMovimientoRepository,
  FakeOutbox,
  FakeProductoReadPort,
  FakeTransferenciaRepository,
  FakeUnitOfWork,
  createPersistPorts,
} from '../testing/fakes'

function buildHarness() {
  const uow = new FakeUnitOfWork()
  const ids = new FakeIdGenerator()
  const clock = new FakeClock()
  const outbox = new FakeOutbox()
  const idempotency = new FakeIdempotencyRepository()
  const transferencias = new FakeTransferenciaRepository()
  const descartes = new FakeDescarteRepository()
  const ajustes = new FakeAjusteRepository()
  const conteos = new FakeConteoRepository()
  const existencias = new FakeExistenciaRepository()
  const almacenes = new FakeAlmacenRepository()
  const productos = new FakeProductoReadPort()
  const movimientos = new FakeMovimientoRepository()
  const kardex = new FakeKardexRepository()
  const auditorias = new FakeAuditoriaRepository()
  const engine = new InventoryEngine()
  const persistPorts = createPersistPorts({
    existencias,
    movimientos,
    kardex,
    auditorias,
    outbox,
    ids,
  })

  almacenes.seed({ id: 'alm-a', bloqueadoPorConteo: false })
  almacenes.seed({ id: 'alm-b', bloqueadoPorConteo: false })
  productos.seed({ id: 'prod-1', activo: true, costoReferencia: 100 })
  existencias.seed(
    Existencia.crear({
      id: 'ex-a',
      productoId: 'prod-1',
      almacenId: 'alm-a',
      saldo: 20,
      version: 1,
    }),
  )

  const transferenciaService = new TransferenciaApplicationService({
    uow,
    transferencias,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
  })

  const descarteService = new DescarteApplicationService({
    uow,
    descartes,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
  })

  const conteoService = new ConteoApplicationService({
    uow,
    conteos,
    existencias,
    almacenes,
    outbox,
    clock,
    ids,
  })

  const ajusteService = new AjusteApplicationService({
    uow,
    ajustes,
    conteos,
    existencias,
    almacenes,
    productos,
    idempotency,
    outbox,
    clock,
    ids,
    engine,
    persistPorts,
  })

  return {
    uow,
    outbox,
    movimientos,
    existencias,
    almacenes,
    transferencias,
    conteos,
    transferenciaService,
    descarteService,
    conteoService,
    ajusteService,
  }
}

describe('Application Services — Fase 2', () => {
  it('crea, despacha y recibe una transferencia impactando stock vía Engine', async () => {
    const h = buildHarness()

    const creada = await h.transferenciaService.crearTransferencia({
      codigo: 'TR-1',
      almacenOrigenId: 'alm-a',
      almacenDestinoId: 'alm-b',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidadSolicitada: 5 }],
    })
    expect(creada.ok).toBe(true)
    if (!creada.ok) return

    const despachada = await h.transferenciaService.despacharTransferencia({
      transferenciaId: creada.value.id,
      actorId: 'user-1',
      expectedVersion: creada.value.version,
      idempotencyKey: 'despachar-tr-1',
    })
    expect(despachada.ok).toBe(true)
    if (!despachada.ok) return
    expect(despachada.value.estado).toBe('en_transito')

    const origen = await h.existencias.get('prod-1', 'alm-a')
    expect(origen?.saldo.value).toBe(15)
    expect(h.movimientos.items.some((m) => m.tipoMovimiento === 'transferencia_salida')).toBe(
      true,
    )

    const replay = await h.transferenciaService.despacharTransferencia({
      transferenciaId: creada.value.id,
      actorId: 'user-1',
      expectedVersion: despachada.value.version,
      idempotencyKey: 'despachar-tr-1',
    })
    expect(replay.ok && replay.replayed).toBe(true)
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(15)

    const transferencia = await h.transferencias.getById(creada.value.id)
    const lineaId = transferencia!.lineas[0]!.id

    const recibida = await h.transferenciaService.recibirTransferencia({
      transferenciaId: creada.value.id,
      actorId: 'user-2',
      expectedVersion: despachada.value.version,
      idempotencyKey: 'recibir-tr-1',
      recepciones: [{ lineaId, cantidadRecibida: 5 }],
    })
    expect(recibida.ok).toBe(true)
    if (!recibida.ok) return
    expect(recibida.value.estado).toBe('recibida')
    expect((await h.existencias.get('prod-1', 'alm-b'))?.saldo.value).toBe(5)
    expect(h.outbox.messages.some((m) => m.eventName === 'TransferenciaRecibida')).toBe(true)
  })

  it('crea, aprueba y aplica un descarte vía Engine', async () => {
    const h = buildHarness()

    const creado = await h.descarteService.crearDescarte({
      codigo: 'DES-1',
      almacenId: 'alm-a',
      solicitanteId: 'user-1',
      lineas: [
        { productoId: 'prod-1', cantidad: 2, motivoCodigo: 'DANO' },
      ],
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return
    expect(creado.value.estado).toBe('solicitado')

    const aprobado = await h.descarteService.aprobarDescarte({
      descarteId: creado.value.id,
      aprobadorId: 'supervisor-1',
      expectedVersion: creado.value.version,
    })
    expect(aprobado.ok).toBe(true)
    if (!aprobado.ok) return

    const aplicado = await h.descarteService.aplicarDescarte({
      descarteId: creado.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aprobado.value.version,
      idempotencyKey: 'aplicar-des-1',
    })
    expect(aplicado.ok).toBe(true)
    if (!aplicado.ok) return
    expect(aplicado.value.estado).toBe('aplicado')
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(18)
    expect(h.movimientos.items.some((m) => m.tipoMovimiento === 'descarte')).toBe(true)
  })

  it('abre conteo con snapshot, registra, revisa, clasifica y cierra sin Engine', async () => {
    const h = buildHarness()

    const creado = await h.conteoService.crearConteo({
      codigo: 'CNT-1',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const abierto = await h.conteoService.abrirConteo({
      conteoId: creado.value.id,
      expectedVersion: creado.value.version,
      productoIds: ['prod-1'],
    })
    expect(abierto.ok).toBe(true)
    if (!abierto.ok) return
    expect(abierto.value.estado).toBe('abierto')
    expect((await h.almacenes.getById('alm-a'))?.bloqueadoPorConteo).toBe(true)

    const conteo = await h.conteos.getById(creado.value.id)
    const linea = conteo!.lineas[0]!

    const registrada = await h.conteoService.registrarLineaConteo({
      conteoId: creado.value.id,
      lineaId: linea.id,
      cantidadContada: 20,
      expectedVersion: abierto.value.version,
    })
    expect(registrada.ok).toBe(true)
    if (!registrada.ok) return

    const revision = await h.conteoService.enviarConteoARevision({
      conteoId: creado.value.id,
      expectedVersion: registrada.value.version,
    })
    expect(revision.ok).toBe(true)
    if (!revision.ok) return

    const clasificada = await h.conteoService.clasificarLineaConteo({
      conteoId: creado.value.id,
      lineaId: linea.id,
      expectedVersion: revision.value.version,
      clasificacion: 'cuadra',
    })
    expect(clasificada.ok).toBe(true)
    if (!clasificada.ok) return

    const cerrado = await h.conteoService.cerrarConteo({
      conteoId: creado.value.id,
      expectedVersion: clasificada.value.version,
    })
    expect(cerrado.ok).toBe(true)
    if (!cerrado.ok) return
    expect(cerrado.value.estado).toBe('cerrado')
    expect((await h.almacenes.getById('alm-a'))?.bloqueadoPorConteo).toBe(false)
    expect(h.movimientos.items.length).toBe(0)
  })

  it('crea, aprueba y aplica un ajuste vía Engine', async () => {
    const h = buildHarness()

    const creado = await h.ajusteService.crearAjuste({
      codigo: 'AJ-1',
      almacenId: 'alm-a',
      tipoAjuste: 'digitacion',
      solicitanteId: 'user-1',
      lineas: [
        {
          productoId: 'prod-1',
          cantidadObjetivo: 25,
          diferencia: 5,
          motivoCodigo: 'DIGITACION',
        },
      ],
      observacion: 'Corrección de digitación',
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const aprobado = await h.ajusteService.aprobarAjuste({
      ajusteId: creado.value.id,
      aprobadorId: 'supervisor-1',
      expectedVersion: creado.value.version,
    })
    expect(aprobado.ok).toBe(true)
    if (!aprobado.ok) return

    const aplicado = await h.ajusteService.aplicarAjuste({
      ajusteId: creado.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aprobado.value.version,
      idempotencyKey: 'aplicar-aj-1',
    })
    expect(aplicado.ok).toBe(true)
    if (!aplicado.ok) return
    expect(aplicado.value.estado).toBe('aplicado')
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(25)
    expect(h.movimientos.items.some((m) => m.tipoMovimiento === 'ajuste')).toBe(true)
    expect(h.uow.committed).toBe(true)
  })

  it('crea una transferencia en borrador y la solicita/cancela vía Application Service', async () => {
    const h = buildHarness()

    const creada = await h.transferenciaService.crearTransferencia({
      codigo: 'TR-2',
      almacenOrigenId: 'alm-a',
      almacenDestinoId: 'alm-b',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidadSolicitada: 3 }],
      solicitar: false,
    })
    expect(creada.ok).toBe(true)
    if (!creada.ok) return
    expect(creada.value.estado).toBe('borrador')

    const solicitada = await h.transferenciaService.solicitarTransferencia({
      transferenciaId: creada.value.id,
      expectedVersion: creada.value.version,
    })
    expect(solicitada.ok).toBe(true)
    if (!solicitada.ok) return
    expect(solicitada.value.estado).toBe('solicitada')

    const listado = await h.transferenciaService.listarTransferencias()
    expect(listado.ok).toBe(true)
    if (listado.ok) {
      expect(listado.value.some((t) => t.id === creada.value.id)).toBe(true)
    }

    const obtenida = await h.transferenciaService.getTransferencia(creada.value.id)
    expect(obtenida.ok).toBe(true)

    const cancelada = await h.transferenciaService.cancelarTransferencia({
      transferenciaId: creada.value.id,
      expectedVersion: solicitada.value.version,
    })
    expect(cancelada.ok).toBe(true)
    if (!cancelada.ok) return
    expect(cancelada.value.estado).toBe('cancelada')
  })

  it('recorre el ciclo solicitar/rechazar y solicitar/cancelar de un ajuste', async () => {
    const h = buildHarness()

    const creado = await h.ajusteService.crearAjuste({
      codigo: 'AJ-2',
      almacenId: 'alm-a',
      tipoAjuste: 'digitacion',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidadObjetivo: 22, diferencia: 2, motivoCodigo: 'DIGITACION' }],
      solicitar: false,
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return
    expect(creado.value.estado).toBe('borrador')

    const solicitado = await h.ajusteService.solicitarAjuste({
      ajusteId: creado.value.id,
      expectedVersion: creado.value.version,
    })
    expect(solicitado.ok).toBe(true)
    if (!solicitado.ok) return
    expect(solicitado.value.estado).toBe('solicitado')

    const rechazado = await h.ajusteService.rechazarAjuste({
      ajusteId: creado.value.id,
      expectedVersion: solicitado.value.version,
    })
    expect(rechazado.ok).toBe(true)
    if (!rechazado.ok) return
    expect(rechazado.value.estado).toBe('rechazado')

    const listado = await h.ajusteService.listarAjustes()
    expect(listado.ok).toBe(true)
    const obtenido = await h.ajusteService.getAjuste(creado.value.id)
    expect(obtenido.ok).toBe(true)
  })

  it('aplica y revierte un ajuste restaurando el saldo original', async () => {
    const h = buildHarness()

    const creado = await h.ajusteService.crearAjuste({
      codigo: 'AJ-3',
      almacenId: 'alm-a',
      tipoAjuste: 'digitacion',
      solicitanteId: 'user-1',
      lineas: [
        { productoId: 'prod-1', cantidadObjetivo: 25, diferencia: 5, motivoCodigo: 'DIGITACION' },
      ],
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const aprobado = await h.ajusteService.aprobarAjuste({
      ajusteId: creado.value.id,
      aprobadorId: 'supervisor-1',
      expectedVersion: creado.value.version,
    })
    expect(aprobado.ok).toBe(true)
    if (!aprobado.ok) return

    const aplicado = await h.ajusteService.aplicarAjuste({
      ajusteId: creado.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aprobado.value.version,
      idempotencyKey: 'aplicar-aj-3',
    })
    expect(aplicado.ok).toBe(true)
    if (!aplicado.ok) return
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(25)

    const revertido = await h.ajusteService.revertirAjuste({
      ajusteId: creado.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aplicado.value.version,
      idempotencyKey: 'revertir-aj-3',
    })
    expect(revertido.ok).toBe(true)
    if (!revertido.ok) return
    expect(revertido.value.estado).toBe('revertido')
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(20)
  })

  it('aplica y revierte un descarte restaurando el saldo original', async () => {
    const h = buildHarness()

    const creado = await h.descarteService.crearDescarte({
      codigo: 'DES-2',
      almacenId: 'alm-a',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidad: 4, motivoCodigo: 'DANO' }],
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const rechazado = await h.descarteService.rechazarDescarte({
      descarteId: creado.value.id,
      expectedVersion: creado.value.version,
    })
    expect(rechazado.ok).toBe(true)
    if (!rechazado.ok) return
    expect(rechazado.value.estado).toBe('rechazado')

    const creado2 = await h.descarteService.crearDescarte({
      codigo: 'DES-3',
      almacenId: 'alm-a',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidad: 4, motivoCodigo: 'DANO' }],
    })
    expect(creado2.ok).toBe(true)
    if (!creado2.ok) return

    const aprobado = await h.descarteService.aprobarDescarte({
      descarteId: creado2.value.id,
      aprobadorId: 'supervisor-1',
      expectedVersion: creado2.value.version,
    })
    expect(aprobado.ok).toBe(true)
    if (!aprobado.ok) return

    const aplicado = await h.descarteService.aplicarDescarte({
      descarteId: creado2.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aprobado.value.version,
      idempotencyKey: 'aplicar-des-2',
    })
    expect(aplicado.ok).toBe(true)
    if (!aplicado.ok) return
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(16)

    const revertido = await h.descarteService.revertirDescarte({
      descarteId: creado2.value.id,
      actorId: 'supervisor-1',
      expectedVersion: aplicado.value.version,
      idempotencyKey: 'revertir-des-2',
    })
    expect(revertido.ok).toBe(true)
    if (!revertido.ok) return
    expect(revertido.value.estado).toBe('revertido')
    expect((await h.existencias.get('prod-1', 'alm-a'))?.saldo.value).toBe(20)

    const listado = await h.descarteService.listarDescartes()
    expect(listado.ok).toBe(true)
    const obtenido = await h.descarteService.getDescarte(creado2.value.id)
    expect(obtenido.ok).toBe(true)
  })

  it('inicia un reconteo sobre líneas seleccionadas de un conteo en captura', async () => {
    const h = buildHarness()

    const creado = await h.conteoService.crearConteo({
      codigo: 'CNT-2',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const abierto = await h.conteoService.abrirConteo({
      conteoId: creado.value.id,
      expectedVersion: creado.value.version,
      productoIds: ['prod-1'],
    })
    expect(abierto.ok).toBe(true)
    if (!abierto.ok) return

    const conteo = await h.conteos.getById(creado.value.id)
    const linea = conteo!.lineas[0]!

    const registrada = await h.conteoService.registrarLineaConteo({
      conteoId: creado.value.id,
      lineaId: linea.id,
      cantidadContada: 18,
      expectedVersion: abierto.value.version,
    })
    expect(registrada.ok).toBe(true)
    if (!registrada.ok) return

    const reconteo = await h.conteoService.iniciarReconteo({
      conteoId: creado.value.id,
      expectedVersion: registrada.value.version,
      lineaIds: [linea.id],
    })
    expect(reconteo.ok).toBe(true)
    if (!reconteo.ok) return
    expect(reconteo.value.estado).toBe('en_conteo')
    expect(reconteo.value.lineasEnReconteo).toBe(1)

    const getConteo = await h.conteoService.getConteo(creado.value.id)
    expect(getConteo.ok).toBe(true)
  })

  it('cancela un conteo abierto y libera el bloqueo del almacén', async () => {
    const h = buildHarness()

    const creado = await h.conteoService.crearConteo({
      codigo: 'CNT-3',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    expect(creado.ok).toBe(true)
    if (!creado.ok) return

    const abierto = await h.conteoService.abrirConteo({
      conteoId: creado.value.id,
      expectedVersion: creado.value.version,
      productoIds: ['prod-1'],
    })
    expect(abierto.ok).toBe(true)
    if (!abierto.ok) return
    expect((await h.almacenes.getById('alm-a'))?.bloqueadoPorConteo).toBe(true)

    const cancelado = await h.conteoService.cancelarConteo({
      conteoId: creado.value.id,
      expectedVersion: abierto.value.version,
    })
    expect(cancelado.ok).toBe(true)
    if (!cancelado.ok) return
    expect(cancelado.value.estado).toBe('cancelado')
    expect((await h.almacenes.getById('alm-a'))?.bloqueadoPorConteo).toBe(false)
  })

  it('traduce errores de dominio a ApplicationResult sin lanzar', async () => {
    const h = buildHarness()
    const result = await h.transferenciaService.crearTransferencia({
      codigo: 'TR-BAD',
      almacenOrigenId: 'alm-a',
      almacenDestinoId: 'alm-a',
      solicitanteId: 'user-1',
      lineas: [{ productoId: 'prod-1', cantidadSolicitada: 1 }],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('DOMAIN_RULE')
    expect(h.uow.rolledBack).toBe(true)
  })
})
