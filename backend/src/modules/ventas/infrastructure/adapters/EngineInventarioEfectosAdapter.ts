import { DocumentoOrigenRef } from '../../../inventario/domain/value-objects/DocumentoOrigenRef'
import { InventoryDomainError } from '../../../inventario/domain/errors/InventoryDomainError'
import { InventoryEngine } from '../../../inventario/domain/services/InventoryEngine'
import {
  persistEngineResult,
  type IAlmacenRepository,
  type IClock,
  type IExistenciaRepository,
  type IIdGenerator,
  type IIdempotencyRepository,
  type IProductoReadPort,
  type IUnitOfWork,
  type PersistEngineResultPorts,
} from '../../../inventario/application/ports/outbound'
import type { InventarioEfectosPort } from '../../application/ports/outbound'
import type { IntencionEfectoInventario } from '../../domain/value-objects/IntencionEfectoInventario'
import type { LineaEfectoInventario } from '../../domain/value-objects/IntencionEfectoInventario'

export interface EngineInventarioEfectosDeps {
  engine: InventoryEngine
  uow: IUnitOfWork
  existencias: IExistenciaRepository
  almacenes: IAlmacenRepository
  productos: IProductoReadPort
  idempotency: IIdempotencyRepository
  clock: IClock
  ids: IIdGenerator
  persistPorts: PersistEngineResultPorts
}

/**
 * ACL Ventas → Inventory Engine.
 * Única vía de afectación de existencias; no toca store de Ventas.
 */
export class EngineInventarioEfectosAdapter implements InventarioEfectosPort {
  constructor(private readonly deps: EngineInventarioEfectosDeps) {}

  async aplicar(
    intencion: IntencionEfectoInventario,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const prev = await this.deps.idempotency.get(intencion.idempotencyKey)
    if (prev) {
      return { ok: true }
    }

    await this.deps.uow.begin()
    try {
      for (const [index, linea] of intencion.lineas.entries()) {
        await this.aplicarLinea(intencion, linea, index)
      }
      await this.deps.idempotency.save({
        key: intencion.idempotencyKey,
        tipoOperacion: `venta_${intencion.tipoEfecto}`,
        documentoTipo: this.mapDocumentoTipo(intencion, intencion.lineas[0]),
        documentoId: intencion.documento.documentoId,
        resultado: { ok: true, lineas: intencion.lineas.length },
        fechaRegistro: this.deps.clock.now(),
      })
      await this.deps.uow.commit()
      return { ok: true }
    } catch (error) {
      await this.deps.uow.rollback()
      if (error instanceof InventoryDomainError) {
        return { ok: false, message: error.message }
      }
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Error al aplicar efecto de inventario.',
      }
    }
  }

  private async aplicarLinea(
    intencion: IntencionEfectoInventario,
    linea: LineaEfectoInventario,
    index: number,
  ): Promise<void> {
    const existencia = await this.deps.existencias.get(linea.productoId, linea.almacenId)
    if (!existencia) {
      throw new InventoryDomainError(
        'INSUFFICIENT_STOCK',
        `Existencia no registrada en Inventory Engine para ${linea.productoId} / ${linea.almacenId}.`,
        { productoId: linea.productoId, almacenId: linea.almacenId },
      )
    }

    const almacen = await this.deps.almacenes.getById(linea.almacenId)
    const producto = await this.deps.productos.getById(linea.productoId)
    const documentoTipo = this.mapDocumentoTipo(intencion, linea)
    const documento = DocumentoOrigenRef.of(
      documentoTipo,
      intencion.documento.documentoId,
      intencion.documento.lineaId,
    )
    const lineKey = `${intencion.idempotencyKey}:l${index}:${linea.productoId}:${linea.sentido}`
    const ctx = {
      now: this.deps.clock.now(),
      generateId: () => this.deps.ids.generate(),
      almacenBloqueado: almacen?.bloqueadoPorConteo === true,
      productoActivo: producto?.activo !== false,
    }

    let result
    if (linea.sentido === 'salida') {
      result = this.deps.engine.registrarSalida(
        {
          existencia,
          expectedVersion: existencia.version.value,
          cantidad: linea.cantidad,
          tipoMovimiento: 'venta',
          documento,
          usuarioId: intencion.usuarioId,
          idempotencyKey: lineKey,
        },
        ctx,
      )
    } else {
      const tipoMovimiento =
        intencion.tipoEfecto === 'reversion_anulacion' ? 'devolucion_entrada' : 'devolucion_entrada'
      result = this.deps.engine.registrarEntrada(
        {
          existencia,
          expectedVersion: existencia.version.value,
          cantidad: linea.cantidad,
          tipoMovimiento,
          documento,
          usuarioId: intencion.usuarioId,
          idempotencyKey: lineKey,
          observacion:
            intencion.tipoEfecto === 'reversion_anulacion'
              ? 'Reversión por anulación de venta'
              : undefined,
        },
        ctx,
      )
    }

    await persistEngineResult(this.deps.persistPorts, result)
  }

  private mapDocumentoTipo(
    intencion: IntencionEfectoInventario,
    linea?: LineaEfectoInventario,
  ): 'venta' | 'devolucion' | 'compensacion' {
    switch (intencion.documento.tipo) {
      case 'venta':
        return 'venta'
      case 'devolucion':
        return 'devolucion'
      case 'anulacion_venta':
        return 'compensacion'
      case 'cambio':
        return linea?.sentido === 'salida' ? 'venta' : 'devolucion'
      default:
        return 'venta'
    }
  }
}
