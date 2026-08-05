import { describe, expect, it } from 'vitest'
import { InventoryDomainError } from '../errors/InventoryDomainError'
import { Transferencia } from './Transferencia'
import { Ajuste } from './Ajuste'
import { Descarte } from './Descarte'
import { ConteoFisico } from './ConteoFisico'

function crearTransferenciaBorrador(): Transferencia {
  return Transferencia.crear({
    id: 'tr-1',
    codigo: 'TR-1',
    almacenOrigenId: 'alm-a',
    almacenDestinoId: 'alm-b',
    solicitanteId: 'user-1',
    lineas: [{ id: 'l1', productoId: 'prod-1', cantidadSolicitada: 5 }],
    solicitar: false,
  })
}

function crearAjusteBorrador(): Ajuste {
  return Ajuste.crear({
    id: 'aj-1',
    codigo: 'AJ-1',
    almacenId: 'alm-a',
    tipoAjuste: 'digitacion',
    solicitanteId: 'user-1',
    lineas: [{ id: 'l1', productoId: 'prod-1', cantidadObjetivo: 20, diferencia: 5 }],
    solicitar: false,
  })
}

function crearDescarteBorrador(): Descarte {
  return Descarte.crear({
    id: 'des-1',
    codigo: 'DES-1',
    almacenId: 'alm-a',
    solicitanteId: 'user-1',
    lineas: [{ id: 'l1', productoId: 'prod-1', cantidad: 3, motivoCodigo: 'DANO' }],
    solicitar: false,
  })
}

describe('Transferencia — transiciones', () => {
  it('crea en borrador cuando solicitar=false y permite solicitar', () => {
    const t = crearTransferenciaBorrador()
    expect(t.estado).toBe('borrador')
    t.solicitar(t.version)
    expect(t.estado).toBe('solicitada')
    expect(t.version).toBe(2)
  })

  it('crea en solicitada por defecto', () => {
    const t = Transferencia.crear({
      id: 'tr-2',
      codigo: 'TR-2',
      almacenOrigenId: 'alm-a',
      almacenDestinoId: 'alm-b',
      solicitanteId: 'user-1',
      lineas: [{ id: 'l1', productoId: 'prod-1', cantidadSolicitada: 5 }],
    })
    expect(t.estado).toBe('solicitada')
  })

  it('cancela desde borrador o solicitada', () => {
    const t = crearTransferenciaBorrador()
    t.cancelar(t.version)
    expect(t.estado).toBe('cancelada')

    const t2 = crearTransferenciaBorrador()
    t2.solicitar(t2.version)
    t2.cancelar(t2.version)
    expect(t2.estado).toBe('cancelada')
  })

  it('rechaza solicitar fuera de borrador', () => {
    const t = crearTransferenciaBorrador()
    t.solicitar(t.version)
    expect(() => t.solicitar(t.version)).toThrow(InventoryDomainError)
  })

  it('rechaza cancelar desde en_transito', () => {
    const t = crearTransferenciaBorrador()
    t.solicitar(t.version)
    t.despachar(t.version)
    expect(() => t.cancelar(t.version)).toThrow(InventoryDomainError)
  })
})

describe('Ajuste — transiciones', () => {
  it('recorre solicitar → rechazar', () => {
    const a = crearAjusteBorrador()
    expect(a.estado).toBe('borrador')
    a.solicitar(a.version)
    expect(a.estado).toBe('solicitado')
    a.rechazar(a.version)
    expect(a.estado).toBe('rechazado')
  })

  it('cancela desde borrador o solicitado', () => {
    const a = crearAjusteBorrador()
    a.cancelar(a.version)
    expect(a.estado).toBe('cancelado')

    const a2 = crearAjusteBorrador()
    a2.solicitar(a2.version)
    a2.cancelar(a2.version)
    expect(a2.estado).toBe('cancelado')
  })

  it('marca revertido solo desde aplicado', () => {
    const a = crearAjusteBorrador()
    expect(() => a.marcarRevertido(a.version)).toThrow(InventoryDomainError)

    a.solicitar(a.version)
    a.aprobar('sup-1', a.version)
    a.marcarAplicado(a.version)
    a.marcarRevertido(a.version)
    expect(a.estado).toBe('revertido')
  })
})

describe('Descarte — transiciones', () => {
  it('recorre solicitar → rechazar y solicitar → cancelar', () => {
    const d = crearDescarteBorrador()
    expect(d.estado).toBe('borrador')
    d.solicitar(d.version)
    expect(d.estado).toBe('solicitado')
    d.rechazar(d.version)
    expect(d.estado).toBe('rechazado')

    const d2 = crearDescarteBorrador()
    d2.cancelar(d2.version)
    expect(d2.estado).toBe('cancelado')
  })

  it('marca revertido solo desde aplicado', () => {
    const d = crearDescarteBorrador()
    d.solicitar(d.version)
    d.aprobar('sup-1', d.version)
    d.marcarAplicado(d.version)
    d.marcarRevertido(d.version)
    expect(d.estado).toBe('revertido')
  })
})

describe('ConteoFisico — transiciones', () => {
  function crearConteoAbierto(): ConteoFisico {
    const c = ConteoFisico.crear({
      id: 'cnt-1',
      codigo: 'CNT-1',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    c.abrir(
      c.version,
      [{ id: 'sn-1', productoId: 'prod-1', cantidadTeorica: 20 }],
      ['l1'],
    )
    return c
  }

  it('inicia reconteo sobre líneas explícitas desde en_conteo', () => {
    const c = crearConteoAbierto()
    const linea = c.lineas[0]!
    c.registrarLinea(c.version, linea.id, 15)
    expect(c.estado).toBe('en_conteo')

    c.iniciarReconteo(c.version, [linea.id])
    expect(c.estado).toBe('en_conteo')
    expect(c.lineas.find((l) => l.id === linea.id)?.estadoLinea).toBe('en_reconteo')
  })

  it('inicia reconteo automáticamente sobre líneas con diferencia si no se especifican', () => {
    const c = crearConteoAbierto()
    const linea = c.lineas[0]!
    c.registrarLinea(c.version, linea.id, 15)

    c.iniciarReconteo(c.version)
    expect(c.lineas.find((l) => l.id === linea.id)?.estadoLinea).toBe('en_reconteo')
  })

  it('rechaza iniciar reconteo fuera de en_conteo', () => {
    const c = ConteoFisico.crear({
      id: 'cnt-2',
      codigo: 'CNT-2',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    expect(() => c.iniciarReconteo(c.version)).toThrow(InventoryDomainError)
  })

  it('cancela desde borrador o abierto y libera el bloqueo', () => {
    const c = ConteoFisico.crear({
      id: 'cnt-3',
      codigo: 'CNT-3',
      almacenId: 'alm-a',
      tipoConteo: 'parcial',
      descripcionAlcance: 'prod-1',
      responsableId: 'user-1',
    })
    c.cancelar(c.version)
    expect(c.estado).toBe('cancelado')

    const c2 = crearConteoAbierto()
    expect(c2.bloqueoActivo).toBe(true)
    c2.cancelar(c2.version)
    expect(c2.estado).toBe('cancelado')
    expect(c2.bloqueoActivo).toBe(false)
  })

  it('rechaza cancelar desde en_conteo', () => {
    const c = crearConteoAbierto()
    const linea = c.lineas[0]!
    c.registrarLinea(c.version, linea.id, 15)
    expect(() => c.cancelar(c.version)).toThrow(InventoryDomainError)
  })
})
