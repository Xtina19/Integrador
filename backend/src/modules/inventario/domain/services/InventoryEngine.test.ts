import { describe, expect, it } from 'vitest'
import {
  DocumentoOrigenRef,
  Existencia,
  InventoryDomainError,
  InventoryEngine,
  type EngineContext,
} from '../index'

function createIdFactory(prefix = 'id') {
  let n = 0
  return () => `${prefix}-${++n}`
}

function baseContext(
  overrides: Partial<EngineContext> = {},
): EngineContext {
  return {
    now: new Date('2026-07-18T12:00:00.000Z'),
    generateId: createIdFactory(),
    productoActivo: true,
    almacenBloqueado: false,
    ...overrides,
  }
}

function existencia(saldo = 10, version = 1): Existencia {
  return Existencia.crear({
    id: 'ex-1',
    productoId: 'prod-1',
    almacenId: 'alm-1',
    saldo,
    version,
  })
}

function doc(tipo: 'transferencia' | 'descarte' | 'ajuste' | 'recepcion' | 'venta' | 'compensacion' = 'transferencia') {
  return DocumentoOrigenRef.of(tipo, 'DOC-1', 'L1')
}

function expectDomainError(fn: () => unknown, code: string): void {
  try {
    fn()
    expect.fail(`Expected InventoryDomainError(${code})`)
  } catch (error) {
    expect(error).toBeInstanceOf(InventoryDomainError)
    expect((error as InventoryDomainError).code).toBe(code)
  }
}

describe('InventoryEngine', () => {
  const engine = new InventoryEngine()

  describe('registrarEntrada', () => {
    it('incrementa stock, genera movimiento, kardex, auditoría y eventos', () => {
      const ex = existencia(5, 1)
      const result = engine.registrarEntrada(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidad: 3,
          tipoMovimiento: 'recepcion',
          documento: doc('recepcion'),
          usuarioId: 'user-1',
          idempotencyKey: 'entrada-1',
        },
        baseContext(),
      )

      expect(result.replayed).toBe(false)
      expect(ex.saldo.value).toBe(8)
      expect(ex.version.value).toBe(2)
      expect(result.movimiento.tipoMovimiento).toBe('recepcion')
      expect(result.movimiento.saldoAnterior.value).toBe(5)
      expect(result.movimiento.saldoPosterior.value).toBe(8)
      expect(result.kardex.movimientoId).toBe(result.movimiento.id)
      expect(result.auditoria.resultado).toBe('OK')
      expect(result.events.map((e) => e.name)).toEqual([
        'MovimientoRegistrado',
        'StockActualizado',
      ])
    })

    it('rechaza cantidad no positiva', () => {
      expect(() =>
        engine.registrarEntrada(
          {
            existencia: existencia(),
            expectedVersion: 1,
            cantidad: 0,
            tipoMovimiento: 'transferencia_entrada',
            documento: doc(),
            usuarioId: 'user-1',
            idempotencyKey: 'entrada-0',
          },
          baseContext(),
        ),
      ).toThrow(InventoryDomainError)
    })
  })

  describe('registrarSalida', () => {
    it('decrementa stock cuando hay disponibilidad', () => {
      const ex = existencia(10, 1)
      const result = engine.registrarSalida(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidad: 4,
          tipoMovimiento: 'transferencia_salida',
          documento: doc(),
          usuarioId: 'user-1',
          idempotencyKey: 'salida-1',
        },
        baseContext(),
      )

      expect(ex.saldo.value).toBe(6)
      expect(result.movimiento.tipoMovimiento).toBe('transferencia_salida')
    })

    it('rechaza stock insuficiente', () => {
      expectDomainError(
        () =>
          engine.registrarSalida(
            {
              existencia: existencia(2, 1),
              expectedVersion: 1,
              cantidad: 5,
              tipoMovimiento: 'venta',
              documento: doc('venta'),
              usuarioId: 'user-1',
              idempotencyKey: 'salida-insuf',
            },
            baseContext(),
          ),
        'INSUFFICIENT_STOCK',
      )
    })
  })

  describe('aplicarDescarte', () => {
    it('aplica salida tipificada con motivo', () => {
      const ex = existencia(7, 1)
      const result = engine.aplicarDescarte(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidad: 2,
          documento: doc('descarte'),
          usuarioId: 'user-1',
          idempotencyKey: 'descarte-1',
          motivoCodigo: 'DANO',
        },
        baseContext(),
      )

      expect(ex.saldo.value).toBe(5)
      expect(result.movimiento.tipoMovimiento).toBe('descarte')
      expect(result.movimiento.motivoCodigo).toBe('DANO')
    })

    it('exige motivo', () => {
      expectDomainError(
        () =>
          engine.aplicarDescarte(
            {
              existencia: existencia(),
              expectedVersion: 1,
              cantidad: 1,
              documento: doc('descarte'),
              usuarioId: 'user-1',
              idempotencyKey: 'descarte-sin-motivo',
              motivoCodigo: '   ',
            },
            baseContext(),
          ),
        'INVALID_MOVEMENT_TYPE',
      )
    })
  })

  describe('aplicarAjuste', () => {
    it('ajusta por cantidad objetivo al alza', () => {
      const ex = existencia(4, 1)
      const result = engine.aplicarAjuste(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidadObjetivo: 10,
          documento: doc('ajuste'),
          usuarioId: 'user-1',
          idempotencyKey: 'ajuste-up',
        },
        baseContext(),
      )

      expect(ex.saldo.value).toBe(10)
      expect(result.movimiento.cantidad.value).toBe(6)
      expect(result.movimiento.tipoMovimiento).toBe('ajuste')
    })

    it('ajusta por diferencia negativa', () => {
      const ex = existencia(10, 1)
      engine.aplicarAjuste(
        {
          existencia: ex,
          expectedVersion: 1,
          diferencia: -3,
          documento: doc('ajuste'),
          usuarioId: 'user-1',
          idempotencyKey: 'ajuste-down',
        },
        baseContext(),
      )
      expect(ex.saldo.value).toBe(7)
    })

    it('rechaza diferencia cero / objetivo igual al saldo', () => {
      expectDomainError(
        () =>
          engine.aplicarAjuste(
            {
              existencia: existencia(5, 1),
              expectedVersion: 1,
              cantidadObjetivo: 5,
              documento: doc('ajuste'),
              usuarioId: 'user-1',
              idempotencyKey: 'ajuste-cero',
            },
            baseContext(),
          ),
        'INVALID_ADJUSTMENT',
      )
    })

    it('rechaza si se envían objetivo y diferencia a la vez', () => {
      expectDomainError(
        () =>
          engine.aplicarAjuste(
            {
              existencia: existencia(5, 1),
              expectedVersion: 1,
              cantidadObjetivo: 6,
              diferencia: 1,
              documento: doc('ajuste'),
              usuarioId: 'user-1',
              idempotencyKey: 'ajuste-ambos',
            },
            baseContext(),
          ),
        'INVALID_ADJUSTMENT',
      )
    })
  })

  describe('registrarCompensacion', () => {
    it('invierte el efecto del movimiento original sin editarlo', () => {
      const ex = existencia(10, 1)
      const originalResult = engine.registrarSalida(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidad: 4,
          tipoMovimiento: 'transferencia_salida',
          documento: doc(),
          usuarioId: 'user-1',
          idempotencyKey: 'orig-1',
        },
        baseContext({ generateId: createIdFactory('a') }),
      )

      expect(ex.saldo.value).toBe(6)

      const compensation = engine.registrarCompensacion(
        {
          existencia: ex,
          expectedVersion: 2,
          movimientoOriginal: originalResult.movimiento,
          documento: DocumentoOrigenRef.of('compensacion', 'REV-1'),
          usuarioId: 'admin-1',
          idempotencyKey: 'comp-1',
          observacion: 'Reversión controlada',
        },
        baseContext({ generateId: createIdFactory('b') }),
      )

      expect(ex.saldo.value).toBe(10)
      expect(compensation.movimiento.tipoMovimiento).toBe('compensacion')
      expect(compensation.movimiento.movimientoCompensaId).toBe(
        originalResult.movimiento.id,
      )
      expect(originalResult.movimiento.saldoPosterior.value).toBe(6)
    })

    it('rechaza compensación sobre otra existencia', () => {
      const exA = existencia(10, 1)
      const move = engine.registrarEntrada(
        {
          existencia: exA,
          expectedVersion: 1,
          cantidad: 1,
          tipoMovimiento: 'recepcion',
          documento: doc('recepcion'),
          usuarioId: 'user-1',
          idempotencyKey: 'x1',
        },
        baseContext(),
      ).movimiento

      const exB = Existencia.crear({
        id: 'ex-2',
        productoId: 'prod-2',
        almacenId: 'alm-1',
        saldo: 10,
        version: 1,
      })

      expectDomainError(
        () =>
          engine.registrarCompensacion(
            {
              existencia: exB,
              expectedVersion: 1,
              movimientoOriginal: move,
              documento: DocumentoOrigenRef.of('compensacion', 'REV-2'),
              usuarioId: 'admin-1',
              idempotencyKey: 'comp-bad',
            },
            baseContext(),
          ),
        'INVALID_COMPENSATION',
      )
    })
  })

  describe('concurrencia e idempotencia', () => {
    it('detecta conflicto de versión', () => {
      expectDomainError(
        () =>
          engine.registrarSalida(
            {
              existencia: existencia(10, 3),
              expectedVersion: 1,
              cantidad: 1,
              tipoMovimiento: 'venta',
              documento: doc('venta'),
              usuarioId: 'user-1',
              idempotencyKey: 'ver-1',
            },
            baseContext(),
          ),
        'VERSION_CONFLICT',
      )
    })

    it('reexpone resultado previo sin mutar de nuevo (idempotencia)', () => {
      const ex = existencia(10, 1)
      const ctx = baseContext({ generateId: createIdFactory('idem') })
      const first = engine.registrarSalida(
        {
          existencia: ex,
          expectedVersion: 1,
          cantidad: 2,
          tipoMovimiento: 'venta',
          documento: doc('venta'),
          usuarioId: 'user-1',
          idempotencyKey: 'same-key',
        },
        ctx,
      )

      expect(ex.saldo.value).toBe(8)

      const second = engine.registrarSalida(
        {
          existencia: ex,
          expectedVersion: 2,
          cantidad: 2,
          tipoMovimiento: 'venta',
          documento: doc('venta'),
          usuarioId: 'user-1',
          idempotencyKey: 'same-key',
        },
        { ...ctx, previousResultForKey: first },
      )

      expect(second.replayed).toBe(true)
      expect(ex.saldo.value).toBe(8)
      expect(second.movimiento.id).toBe(first.movimiento.id)
    })
  })

  describe('bloqueos y actor', () => {
    it('rechaza almacén bloqueado por conteo', () => {
      expectDomainError(
        () =>
          engine.registrarEntrada(
            {
              existencia: existencia(),
              expectedVersion: 1,
              cantidad: 1,
              tipoMovimiento: 'recepcion',
              documento: doc('recepcion'),
              usuarioId: 'user-1',
              idempotencyKey: 'blk-1',
            },
            baseContext({ almacenBloqueado: true }),
          ),
        'ALMACEN_BLOQUEADO',
      )
    })

    it('rechaza producto inactivo', () => {
      expectDomainError(
        () =>
          engine.registrarEntrada(
            {
              existencia: existencia(),
              expectedVersion: 1,
              cantidad: 1,
              tipoMovimiento: 'recepcion',
              documento: doc('recepcion'),
              usuarioId: 'user-1',
              idempotencyKey: 'ina-1',
            },
            baseContext({ productoActivo: false }),
          ),
        'PRODUCTO_INACTIVO',
      )
    })

    it('exige actor', () => {
      expectDomainError(
        () =>
          engine.registrarEntrada(
            {
              existencia: existencia(),
              expectedVersion: 1,
              cantidad: 1,
              tipoMovimiento: 'recepcion',
              documento: doc('recepcion'),
              usuarioId: '  ',
              idempotencyKey: 'actor-1',
            },
            baseContext(),
          ),
        'MISSING_ACTOR',
      )
    })

    it('exige idempotency key', () => {
      expectDomainError(
        () =>
          engine.registrarEntrada(
            {
              existencia: existencia(),
              expectedVersion: 1,
              cantidad: 1,
              tipoMovimiento: 'recepcion',
              documento: doc('recepcion'),
              usuarioId: 'user-1',
              idempotencyKey: '',
            },
            baseContext(),
          ),
        'MISSING_IDEMPOTENCY_KEY',
      )
    })
  })
})

/**
 * Estrategia de pruebas unitarias del Engine (Fase 1):
 * - Cubrir cada operación pública (entrada, salida, descarte, ajuste, compensación).
 * - Cubrir invariantes: no stock negativo, versión, idempotencia, documento, actor.
 * - Cubrir contexto: almacén bloqueado, producto inactivo.
 * - Sin DB ni HTTP: solo dominio en memoria.
 * - Compensación: verificar que el movimiento original permanece inmutable.
 */