import { randomUUID } from 'node:crypto'
import type { Venta } from '../../../domain/aggregates/Venta'
import type { ListVentasCriterios, VentaRepository } from '../../../domain/ports/VentaRepository'
import { VentaFactory } from '../../factories/VentaFactory'
import type { SqlExecutor } from '../sql/SqlExecutor'
import type {
  CambioRecord,
  DevolucionRecord,
  NotaCreditoRecord,
  VentaRecord,
} from '../models/VentaPersistenceModels'
import { MysqlVentaRowMapper, mysqlDateToIso, type VentaCabeceraRow } from './MysqlVentaRowMapper'
import { VentasCatalogBridge } from './VentasCatalogBridge'

/**
 * Persistencia definitiva MySQL del Aggregate Venta.
 * - No modifica dominio ni mueve invariantes a SQL.
 * - Stock solo vía InventarioEfectosPort (fuera de este repositorio).
 */
export class MysqlVentaRepository implements VentaRepository {
  constructor(private readonly sql: SqlExecutor) {}

  async getById(id: string): Promise<Venta | null> {
    const record = await this.loadRecordByDominioId(this.sql, id)
    return record ? VentaFactory.fromRecord(record) : null
  }

  async getByNumeroFactura(numero: string): Promise<Venta | null> {
    const { rows } = await this.sql.query<{ dominio_id: string }>(
      `SELECT dominio_id FROM ventas WHERE numero_factura = ? LIMIT 1`,
      [numero],
    )
    if (!rows[0]) return null
    return this.getById(rows[0].dominio_id)
  }

  async save(venta: Venta): Promise<void> {
    const record = VentaFactory.toRecord(venta)
    await this.sql.transaction(async (tx) => {
      const bridge = new VentasCatalogBridge(tx)
      await this.upsertAggregate(tx, bridge, record)
    })
  }

  async list(criterios: ListVentasCriterios): Promise<Venta[]> {
    const where: string[] = ['1=1']
    const params: unknown[] = []

    if (criterios.sucursalId) {
      where.push('sucursal_dominio_id = ?')
      params.push(criterios.sucursalId)
    }
    if (criterios.estado) {
      where.push('estado = ?')
      params.push(criterios.estado)
    }
    if (criterios.clienteId) {
      where.push('cliente_dominio_id = ?')
      params.push(criterios.clienteId)
    }
    if (criterios.numeroFactura) {
      where.push('numero_factura LIKE ?')
      params.push(`%${criterios.numeroFactura}%`)
    }
    if (criterios.desde) {
      where.push('fecha_emision >= ?')
      params.push(criterios.desde)
    }
    if (criterios.hasta) {
      where.push('fecha_emision <= ?')
      params.push(criterios.hasta)
    }

    const limit = criterios.limit ?? 100
    const offset = criterios.offset ?? 0
    params.push(limit, offset)

    const { rows } = await this.sql.query<VentaCabeceraRow>(
      `SELECT * FROM ventas
       WHERE ${where.join(' AND ')}
       ORDER BY fecha_emision DESC
       LIMIT ? OFFSET ?`,
      params,
    )

    const out: Venta[] = []
    for (const cab of rows) {
      const record = await this.loadRecordByPk(this.sql, Number(cab.id), cab)
      out.push(VentaFactory.fromRecord(record))
    }
    return out
  }

  async nextIdentity(): Promise<string> {
    return randomUUID()
  }

  async nextNumeroFactura(sucursalId: string): Promise<string> {
    return this.sql.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO ventas_secuencia_factura (sucursal_dominio_id, ultimo_numero)
         VALUES (?, 1000)
         ON DUPLICATE KEY UPDATE sucursal_dominio_id = sucursal_dominio_id`,
        [sucursalId],
      )
      await tx.query(
        `UPDATE ventas_secuencia_factura SET ultimo_numero = ultimo_numero + 1 WHERE sucursal_dominio_id = ?`,
        [sucursalId],
      )
      const { rows } = await tx.query<{ ultimo_numero: number }>(
        `SELECT ultimo_numero FROM ventas_secuencia_factura WHERE sucursal_dominio_id = ? LIMIT 1`,
        [sucursalId],
      )
      const n = Number(rows[0]?.ultimo_numero ?? 1001)
      const suc = sucursalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SUC'
      return `F-${suc}-${n}`
    })
  }

  async nextNumeroNotaCredito(): Promise<string> {
    // Contador global sin sucursal (NC-000001…). Tabla auxiliar opcional.
    try {
      return await this.sql.transaction(async (tx) => {
        await tx.query(
          `CREATE TABLE IF NOT EXISTS ventas_secuencia_nc (
             id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
             ultimo_numero INT UNSIGNED NOT NULL DEFAULT 0
           ) ENGINE=InnoDB`,
        )
        await tx.query(
          `INSERT INTO ventas_secuencia_nc (id, ultimo_numero) VALUES (1, 0)
           ON DUPLICATE KEY UPDATE id = id`,
        )
        await tx.query(`UPDATE ventas_secuencia_nc SET ultimo_numero = ultimo_numero + 1 WHERE id = 1`)
        const { rows } = await tx.query<{ ultimo_numero: number }>(
          `SELECT ultimo_numero FROM ventas_secuencia_nc WHERE id = 1 LIMIT 1`,
        )
        const n = Number(rows[0]?.ultimo_numero ?? 1)
        return `NC-${String(n).padStart(6, '0')}`
      })
    } catch {
      const { rows } = await this.sql.query<{ c: number }>(
        `SELECT COUNT(*) AS c FROM notas_credito`,
      )
      const n = Number(rows[0]?.c ?? 0) + 1
      return `NC-${String(n).padStart(6, '0')}`
    }
  }

  // ---------------------------------------------------------------------------
  // Carga
  // ---------------------------------------------------------------------------

  private async loadRecordByDominioId(sql: SqlExecutor, dominioId: string): Promise<VentaRecord | null> {
    const { rows } = await sql.query<VentaCabeceraRow>(
      `SELECT * FROM ventas WHERE dominio_id = ? LIMIT 1`,
      [dominioId],
    )
    if (!rows[0]) return null
    return this.loadRecordByPk(sql, Number(rows[0].id), rows[0])
  }

  private async loadRecordByPk(
    sql: SqlExecutor,
    ventaPk: number,
    cabecera: VentaCabeceraRow,
  ): Promise<VentaRecord> {
    const moneda = cabecera.moneda_codigo

    const lineasRes = await sql.query<{
      dominio_id: string
      producto_dominio_id: string | null
      descripcion_snapshot: string
      cantidad: number
      precio_unitario: number | string
      descuento_tipo: string | null
      descuento_valor: number | string | null
      importe_neto: number | string
    }>(`SELECT * FROM venta_lineas WHERE venta_id = ? ORDER BY id`, [ventaPk])

    const pagosRes = await sql.query<{
      dominio_id: string
      forma_pago: string
      monto: number | string
      moneda_codigo: string
      nota_credito_id: string | null
      vuelto: number | string | null
    }>(`SELECT * FROM pagos WHERE venta_id = ? ORDER BY id`, [ventaPk])

    const histRes = await sql.query<{
      dominio_id: string
      tipo_evento: string
      usuario_dominio_id: string
      fecha: Date | string
      resultado: string
      detalle: string | null
    }>(`SELECT * FROM historial_ventas WHERE venta_id = ? ORDER BY fecha, id`, [ventaPk])

    const cambios = await this.loadCambios(sql, ventaPk, moneda)
    const devoluciones = await this.loadDevoluciones(sql, ventaPk, moneda)
    const notasCredito = await this.loadNotasCredito(sql, ventaPk)

    return MysqlVentaRowMapper.assemble({
      cabecera,
      lineas: lineasRes.rows.map((r) => MysqlVentaRowMapper.lineaFromRow(r, moneda)),
      pagos: pagosRes.rows.map((r) => MysqlVentaRowMapper.pagoFromRow(r)),
      cambios,
      devoluciones,
      notasCredito,
      historial: histRes.rows.map((r) => MysqlVentaRowMapper.historialFromRow(r)),
    })
  }

  private async loadCambios(sql: SqlExecutor, ventaPk: number, moneda: string): Promise<CambioRecord[]> {
    const { rows: cambios } = await sql.query<{
      id: number
      dominio_id: string
      fecha: Date | string
      usuario_dominio_id: string
      diferencia_monto: number | string
      moneda_codigo: string
      resolucion: string
    }>(`SELECT * FROM cambios WHERE venta_id = ? ORDER BY id`, [ventaPk])

    const out: CambioRecord[] = []
    for (const c of cambios) {
      const { rows: lineas } = await sql.query<{
        tipo: string
        producto_dominio_id: string | null
        cantidad: number
        precio_unitario: number | string | null
        descripcion_snapshot: string | null
      }>(`SELECT * FROM cambio_lineas WHERE cambio_id = ?`, [c.id])

      out.push({
        id: c.dominio_id,
        fecha: mysqlDateToIso(c.fecha),
        usuarioId: c.usuario_dominio_id,
        lineasDevueltas: lineas
          .filter((l) => l.tipo === 'devuelta')
          .map((l) => ({
            productoId: l.producto_dominio_id ?? '',
            cantidad: Number(l.cantidad),
            precioUnitario: l.precio_unitario == null ? undefined : Number(l.precio_unitario),
            descripcionSnapshot: l.descripcion_snapshot ?? undefined,
          })),
        lineasNuevas: lineas
          .filter((l) => l.tipo === 'nueva')
          .map((l) => ({
            productoId: l.producto_dominio_id ?? '',
            cantidad: Number(l.cantidad),
            precioUnitario: l.precio_unitario == null ? undefined : Number(l.precio_unitario),
            descripcionSnapshot: l.descripcion_snapshot ?? undefined,
          })),
        diferenciaMonto: Number(c.diferencia_monto),
        moneda: c.moneda_codigo || moneda,
        resolucion: c.resolucion,
      })
    }
    return out
  }

  private async loadDevoluciones(
    sql: SqlExecutor,
    ventaPk: number,
    moneda: string,
  ): Promise<DevolucionRecord[]> {
    const { rows: devs } = await sql.query<{
      id: number
      dominio_id: string
      fecha: Date | string
      usuario_dominio_id: string
      aptitud_reingreso: string
      compensacion: string
      monto_compensacion: number | string
      moneda_codigo: string
    }>(`SELECT * FROM devoluciones WHERE venta_id = ? ORDER BY id`, [ventaPk])

    const out: DevolucionRecord[] = []
    for (const d of devs) {
      const { rows: lineas } = await sql.query<{
        producto_dominio_id: string | null
        cantidad: number
      }>(`SELECT * FROM devolucion_lineas WHERE devolucion_id = ?`, [d.id])

      out.push({
        id: d.dominio_id,
        fecha: mysqlDateToIso(d.fecha),
        usuarioId: d.usuario_dominio_id,
        lineas: lineas.map((l) => ({
          productoId: l.producto_dominio_id ?? '',
          cantidad: Number(l.cantidad),
        })),
        aptitudReingreso: d.aptitud_reingreso,
        compensacion: d.compensacion,
        montoCompensacion: Number(d.monto_compensacion),
        moneda: d.moneda_codigo || moneda,
      })
    }
    return out
  }

  private async loadNotasCredito(sql: SqlExecutor, ventaPk: number): Promise<NotaCreditoRecord[]> {
    const { rows: ncs } = await sql.query<{
      id: number
      dominio_id: string
      venta_id: number
      cliente_dominio_id: string
      fecha: Date | string
      usuario_dominio_id: string
      monto: number | string
      moneda_codigo: string
      motivo: string
      estado: string
      monto_aplicado: number | string
    }>(`SELECT * FROM notas_credito WHERE venta_id = ? ORDER BY id`, [ventaPk])

    const ventaDom = await sql.query<{ dominio_id: string }>(
      `SELECT dominio_id FROM ventas WHERE id = ? LIMIT 1`,
      [ventaPk],
    )
    const ventaOrigenId = ventaDom.rows[0]?.dominio_id ?? ''

    const out: NotaCreditoRecord[] = []
    for (const nc of ncs) {
      const { rows: apps } = await sql.query<{
        venta_destino_dominio_id: string | null
        monto_aplicado: number | string
        fecha: Date | string
      }>(`SELECT * FROM nota_credito_aplicaciones WHERE nota_credito_id = ?`, [nc.id])

      out.push({
        id: nc.dominio_id,
        ventaOrigenId,
        clienteId: nc.cliente_dominio_id,
        fecha: mysqlDateToIso(nc.fecha),
        usuarioId: nc.usuario_dominio_id,
        monto: Number(nc.monto),
        moneda: nc.moneda_codigo,
        motivo: nc.motivo,
        estado: nc.estado,
        montoAplicado: Number(nc.monto_aplicado),
        aplicaciones: apps.map((a) => ({
          ventaDestinoId: a.venta_destino_dominio_id ?? '',
          montoAplicado: Number(a.monto_aplicado),
          fecha: mysqlDateToIso(a.fecha),
        })),
      })
    }
    return out
  }

  // ---------------------------------------------------------------------------
  // Escritura
  // ---------------------------------------------------------------------------

  private async upsertAggregate(
    tx: SqlExecutor,
    bridge: VentasCatalogBridge,
    record: VentaRecord,
  ): Promise<void> {
    const sucursalErp = await bridge.resolveErpId('sucursal', record.sucursalId)
    const almacenErp = await bridge.resolveErpId('almacen', record.almacenId)
    const usuarioErp = await bridge.resolveErpId('usuario', record.usuarioEmisionId)
    const clienteErp = await bridge.resolveClienteErpId(record.clienteId)

    const existing = await tx.query<{ id: number; version: number }>(
      `SELECT id, version FROM ventas WHERE dominio_id = ? LIMIT 1`,
      [record.id],
    )

    let ventaPk: number
    if (existing.rows[0]) {
      const prevVersion = Number(existing.rows[0].version)
      if (record.version < prevVersion) {
        throw new Error(
          `MysqlVentaRepository: conflicto de versión (persistido=${prevVersion}, incoming=${record.version})`,
        )
      }
      ventaPk = Number(existing.rows[0].id)
      await tx.query(
        `UPDATE ventas SET
          numero_factura = ?, estado = ?, tipo_venta = ?,
          cliente_id = ?, cliente_dominio_id = ?,
          sucursal_id = ?, sucursal_dominio_id = ?,
          almacen_id = ?, almacen_dominio_id = ?,
          usuario_emision_id = ?, usuario_emision_dominio_id = ?,
          moneda_codigo = ?, fecha_emision = ?,
          subtotal = ?, total_descuentos = ?, total = ?, version = ?,
          tiene_cambios = ?, tiene_devoluciones = ?, tiene_notas_credito = ?,
          motivo_anulacion = ?
         WHERE id = ?`,
        [
          record.numeroFactura,
          record.estado,
          record.tipoVenta,
          clienteErp,
          record.clienteId ?? null,
          sucursalErp,
          record.sucursalId,
          almacenErp,
          record.almacenId,
          usuarioErp,
          record.usuarioEmisionId,
          record.moneda,
          toMysqlDatetime(record.fechaEmision),
          record.subtotal,
          record.totalDescuentos,
          record.total,
          record.version,
          record.tieneCambios ? 1 : 0,
          record.tieneDevoluciones ? 1 : 0,
          record.tieneNotasCredito ? 1 : 0,
          record.motivoAnulacion ?? null,
          ventaPk,
        ],
      )
      await this.deleteChildren(tx, ventaPk)
    } else {
      const ins = await tx.query(
        `INSERT INTO ventas (
          dominio_id, numero_factura, estado, tipo_venta,
          cliente_id, cliente_dominio_id,
          sucursal_id, sucursal_dominio_id,
          almacen_id, almacen_dominio_id,
          usuario_emision_id, usuario_emision_dominio_id,
          moneda_codigo, fecha_emision,
          subtotal, total_descuentos, total, version,
          tiene_cambios, tiene_devoluciones, tiene_notas_credito,
          motivo_anulacion
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          record.id,
          record.numeroFactura,
          record.estado,
          record.tipoVenta,
          clienteErp,
          record.clienteId ?? null,
          sucursalErp,
          record.sucursalId,
          almacenErp,
          record.almacenId,
          usuarioErp,
          record.usuarioEmisionId,
          record.moneda,
          toMysqlDatetime(record.fechaEmision),
          record.subtotal,
          record.totalDescuentos,
          record.total,
          record.version,
          record.tieneCambios ? 1 : 0,
          record.tieneDevoluciones ? 1 : 0,
          record.tieneNotasCredito ? 1 : 0,
          record.motivoAnulacion ?? null,
        ],
      )
      ventaPk = ins.insertId
    }

    await this.insertChildren(tx, bridge, ventaPk, record)
  }

  private async deleteChildren(tx: SqlExecutor, ventaPk: number): Promise<void> {
    const cambios = await tx.query<{ id: number }>(`SELECT id FROM cambios WHERE venta_id = ?`, [ventaPk])
    for (const c of cambios.rows) {
      await tx.query(`DELETE FROM cambio_lineas WHERE cambio_id = ?`, [c.id])
    }
    await tx.query(`DELETE FROM cambios WHERE venta_id = ?`, [ventaPk])

    const devoluciones = await tx.query<{ id: number }>(
      `SELECT id FROM devoluciones WHERE venta_id = ?`,
      [ventaPk],
    )
    for (const d of devoluciones.rows) {
      await tx.query(`DELETE FROM devolucion_lineas WHERE devolucion_id = ?`, [d.id])
    }
    await tx.query(`DELETE FROM devoluciones WHERE venta_id = ?`, [ventaPk])

    const ncs = await tx.query<{ id: number }>(`SELECT id FROM notas_credito WHERE venta_id = ?`, [
      ventaPk,
    ])
    for (const nc of ncs.rows) {
      await tx.query(`DELETE FROM nota_credito_aplicaciones WHERE nota_credito_id = ?`, [nc.id])
    }
    await tx.query(`DELETE FROM notas_credito WHERE venta_id = ?`, [ventaPk])

    await tx.query(`DELETE FROM historial_ventas WHERE venta_id = ?`, [ventaPk])
    await tx.query(`DELETE FROM pagos WHERE venta_id = ?`, [ventaPk])
    await tx.query(`DELETE FROM venta_lineas WHERE venta_id = ?`, [ventaPk])
  }

  private async insertChildren(
    tx: SqlExecutor,
    bridge: VentasCatalogBridge,
    ventaPk: number,
    record: VentaRecord,
  ): Promise<void> {
    for (const linea of record.lineas) {
      const productoErp = await bridge.resolveErpId('producto', linea.productoId)
      const desc = MysqlVentaRowMapper.descuentoToCols(linea.descuento)
      await tx.query(
        `INSERT INTO venta_lineas (
          dominio_id, venta_id, producto_id, producto_dominio_id,
          descripcion_snapshot, cantidad, precio_unitario,
          descuento_tipo, descuento_valor, importe_neto
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          linea.id,
          ventaPk,
          productoErp,
          linea.productoId,
          linea.descripcionSnapshot,
          linea.cantidad,
          linea.precioUnitario,
          desc.descuento_tipo,
          desc.descuento_valor,
          linea.importeNeto,
        ],
      )
    }

    for (const pago of record.pagos) {
      await tx.query(
        `INSERT INTO pagos (
          dominio_id, venta_id, forma_pago, monto, moneda_codigo, nota_credito_id, vuelto
        ) VALUES (?,?,?,?,?,?,?)`,
        [
          pago.id,
          ventaPk,
          pago.formaPago,
          pago.monto,
          pago.moneda,
          pago.notaCreditoId ?? null,
          pago.vuelto ?? null,
        ],
      )
    }

    for (const h of record.historial) {
      const usuarioErp = await bridge.resolveErpId('usuario', h.usuarioId)
      await tx.query(
        `INSERT INTO historial_ventas (
          dominio_id, venta_id, tipo_evento, usuario_id, usuario_dominio_id,
          fecha, resultado, detalle
        ) VALUES (?,?,?,?,?,?,?,?)`,
        [
          h.id,
          ventaPk,
          h.tipoEvento,
          usuarioErp,
          h.usuarioId,
          toMysqlDatetime(h.fecha),
          h.resultado,
          h.detalle ?? null,
        ],
      )
    }

    for (const cambio of record.cambios) {
      await this.insertCambio(tx, bridge, ventaPk, cambio)
    }
    for (const dev of record.devoluciones) {
      await this.insertDevolucion(tx, bridge, ventaPk, dev)
    }
    for (const nc of record.notasCredito) {
      await this.insertNotaCredito(tx, bridge, ventaPk, nc)
    }
  }

  private async insertCambio(
    tx: SqlExecutor,
    bridge: VentasCatalogBridge,
    ventaPk: number,
    cambio: CambioRecord,
  ): Promise<void> {
    const usuarioErp = await bridge.resolveErpId('usuario', cambio.usuarioId)
    const ins = await tx.query(
      `INSERT INTO cambios (
        dominio_id, venta_id, fecha, usuario_id, usuario_dominio_id,
        diferencia_monto, moneda_codigo, resolucion
      ) VALUES (?,?,?,?,?,?,?,?)`,
      [
        cambio.id,
        ventaPk,
        toMysqlDatetime(cambio.fecha),
        usuarioErp,
        cambio.usuarioId,
        cambio.diferenciaMonto,
        cambio.moneda,
        cambio.resolucion,
      ],
    )
    const cambioPk = ins.insertId
    for (const l of cambio.lineasDevueltas) {
      const productoErp = await bridge.resolveErpId('producto', l.productoId)
      await tx.query(
        `INSERT INTO cambio_lineas (
          cambio_id, tipo, producto_id, producto_dominio_id, cantidad
        ) VALUES (?,?,?,?,?)`,
        [cambioPk, 'devuelta', productoErp, l.productoId, l.cantidad],
      )
    }
    for (const l of cambio.lineasNuevas) {
      const productoErp = await bridge.resolveErpId('producto', l.productoId)
      await tx.query(
        `INSERT INTO cambio_lineas (
          cambio_id, tipo, producto_id, producto_dominio_id, cantidad,
          precio_unitario, descripcion_snapshot
        ) VALUES (?,?,?,?,?,?,?)`,
        [
          cambioPk,
          'nueva',
          productoErp,
          l.productoId,
          l.cantidad,
          l.precioUnitario ?? null,
          l.descripcionSnapshot ?? null,
        ],
      )
    }
  }

  private async insertDevolucion(
    tx: SqlExecutor,
    bridge: VentasCatalogBridge,
    ventaPk: number,
    dev: DevolucionRecord,
  ): Promise<void> {
    const usuarioErp = await bridge.resolveErpId('usuario', dev.usuarioId)
    const ins = await tx.query(
      `INSERT INTO devoluciones (
        dominio_id, venta_id, fecha, usuario_id, usuario_dominio_id,
        aptitud_reingreso, compensacion, monto_compensacion, moneda_codigo
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        dev.id,
        ventaPk,
        toMysqlDatetime(dev.fecha),
        usuarioErp,
        dev.usuarioId,
        dev.aptitudReingreso,
        dev.compensacion,
        dev.montoCompensacion,
        dev.moneda,
      ],
    )
    const devPk = ins.insertId
    for (const l of dev.lineas) {
      const productoErp = await bridge.resolveErpId('producto', l.productoId)
      await tx.query(
        `INSERT INTO devolucion_lineas (
          devolucion_id, producto_id, producto_dominio_id, cantidad
        ) VALUES (?,?,?,?)`,
        [devPk, productoErp, l.productoId, l.cantidad],
      )
    }
  }

  private async insertNotaCredito(
    tx: SqlExecutor,
    bridge: VentasCatalogBridge,
    ventaPk: number,
    nc: NotaCreditoRecord,
  ): Promise<void> {
    const usuarioErp = await bridge.resolveErpId('usuario', nc.usuarioId)
    let clienteErp = await bridge.resolveClienteErpId(nc.clienteId)
    if (clienteErp == null) {
      throw new Error(`MysqlVentaRepository: cliente NC no mapeado (${nc.clienteId})`)
    }
    await bridge.ensureClienteRef(nc.clienteId, clienteErp)

    const ins = await tx.query(
      `INSERT INTO notas_credito (
        dominio_id, venta_id, cliente_id, cliente_dominio_id,
        fecha, usuario_id, usuario_dominio_id,
        monto, moneda_codigo, motivo, estado, monto_aplicado
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nc.id,
        ventaPk,
        clienteErp,
        nc.clienteId,
        toMysqlDatetime(nc.fecha),
        usuarioErp,
        nc.usuarioId,
        nc.monto,
        nc.moneda,
        nc.motivo,
        nc.estado,
        nc.montoAplicado,
      ],
    )
    const ncPk = ins.insertId

    for (const app of nc.aplicaciones) {
      const dest = await tx.query<{ id: number }>(
        `SELECT id FROM ventas WHERE dominio_id = ? LIMIT 1`,
        [app.ventaDestinoId],
      )
      if (!dest.rows[0]) {
        throw new Error(
          `MysqlVentaRepository: venta destino NC no encontrada (${app.ventaDestinoId})`,
        )
      }
      await tx.query(
        `INSERT INTO nota_credito_aplicaciones (
          nota_credito_id, venta_destino_id, venta_destino_dominio_id,
          monto_aplicado, fecha
        ) VALUES (?,?,?,?,?)`,
        [
          ncPk,
          dest.rows[0].id,
          app.ventaDestinoId,
          app.montoAplicado,
          toMysqlDatetime(app.fecha),
        ],
      )
    }
  }
}

function toMysqlDatetime(isoOrDate: string): string {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return isoOrDate.slice(0, 19).replace('T', ' ')
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
