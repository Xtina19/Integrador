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
import { mysqlDateToIso } from '../mysql/MysqlVentaRowMapper'
import { SqlServerCatalogBridge } from './SqlServerCatalogBridge'
import {
  descuentoToCols,
  SqlServerVentaRowMapper,
  toSqlDatetime,
  type FacturaVentaCabeceraRow,
} from './SqlServerVentaRowMapper'

const CABECERA_SELECT = `
  SELECT fv.*, m.codigo_iso
  FROM FacturaVenta fv
  INNER JOIN Moneda m ON m.id_moneda = fv.id_moneda
`

/**
 * Persistencia SQL Server del aggregate Venta — tablas public/scriptdb.
 */
export class SqlServerVentaRepository implements VentaRepository {
  constructor(private readonly sql: SqlExecutor) {}

  async getById(id: string): Promise<Venta | null> {
    const record = await this.loadRecordByDominioId(this.sql, id)
    return record ? VentaFactory.fromRecord(record) : null
  }

  async getByNumeroFactura(numero: string): Promise<Venta | null> {
    const { rows } = await this.sql.query<{ codigo_dominio: string }>(
      `SELECT codigo_dominio FROM FacturaVenta WHERE numero_factura = ?`,
      [numero],
    )
    if (!rows[0]) return null
    return this.getById(rows[0].codigo_dominio)
  }

  async save(venta: Venta): Promise<void> {
    const record = VentaFactory.toRecord(venta)
    await this.sql.transaction(async (tx) => {
      const bridge = new SqlServerCatalogBridge(tx)
      await this.upsertAggregate(tx, bridge, record)
    })
  }

  async list(criterios: ListVentasCriterios): Promise<Venta[]> {
    const where: string[] = ['1=1']
    const params: unknown[] = []

    if (criterios.sucursalId) {
      where.push('fv.id_sucursal = ?')
      params.push(Number(criterios.sucursalId))
    }
    if (criterios.estado) {
      where.push('fv.estado = ?')
      params.push(criterios.estado)
    }
    if (criterios.clienteId) {
      where.push('fv.id_persona = ?')
      params.push(Number(criterios.clienteId))
    }
    if (criterios.numeroFactura) {
      where.push('fv.numero_factura LIKE ?')
      params.push(`%${criterios.numeroFactura}%`)
    }
    if (criterios.desde) {
      where.push('fv.fecha_emision >= ?')
      params.push(criterios.desde)
    }
    if (criterios.hasta) {
      where.push('fv.fecha_emision <= ?')
      params.push(criterios.hasta)
    }

    const limit = criterios.limit ?? 100
    const offset = criterios.offset ?? 0
    params.push(offset, limit)

    const { rows } = await this.sql.query<FacturaVentaCabeceraRow>(
      `${CABECERA_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY fv.fecha_emision DESC
       OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
      params,
    )

    const out: Venta[] = []
    for (const cab of rows) {
      const record = await this.loadRecordByPk(this.sql, Number(cab.id_factura), cab)
      out.push(VentaFactory.fromRecord(record))
    }
    return out
  }

  async nextIdentity(): Promise<string> {
    return randomUUID()
  }

  async nextNumeroFactura(sucursalId: string): Promise<string> {
    const idSucursal = Number(sucursalId)
    if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
      throw new Error(`SqlServerVentaRepository: id_sucursal inválido (${sucursalId})`)
    }

    return this.sql.transaction(async (tx) => {
      await tx.query(
        `IF NOT EXISTS (SELECT 1 FROM SecuenciaFacturaVenta WHERE id_sucursal = ?)
         INSERT INTO SecuenciaFacturaVenta (id_sucursal, ultimo_numero) VALUES (?, 1000)`,
        [idSucursal, idSucursal],
      )
      await tx.query(
        `UPDATE SecuenciaFacturaVenta SET ultimo_numero = ultimo_numero + 1 WHERE id_sucursal = ?`,
        [idSucursal],
      )
      const { rows } = await tx.query<{ ultimo_numero: number }>(
        `SELECT ultimo_numero FROM SecuenciaFacturaVenta WHERE id_sucursal = ?`,
        [idSucursal],
      )
      const n = Number(rows[0]?.ultimo_numero ?? 1001)
      const suc = sucursalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SUC'
      return `F-${suc}-${n}`
    })
  }

  async nextNumeroNotaCredito(): Promise<string> {
    return this.sql.transaction(async (tx) => {
      await tx.query(
        `IF NOT EXISTS (SELECT 1 FROM SecuenciaNotaCredito WHERE id_secuencia = 1)
         INSERT INTO SecuenciaNotaCredito (id_secuencia, ultimo_numero) VALUES (1, 0)`,
      )
      await tx.query(
        `UPDATE SecuenciaNotaCredito SET ultimo_numero = ultimo_numero + 1 WHERE id_secuencia = 1`,
      )
      const { rows } = await tx.query<{ ultimo_numero: number }>(
        `SELECT ultimo_numero FROM SecuenciaNotaCredito WHERE id_secuencia = 1`,
      )
      const n = Number(rows[0]?.ultimo_numero ?? 1)
      return `NC-${String(n).padStart(6, '0')}`
    })
  }

  private async loadRecordByDominioId(sql: SqlExecutor, dominioId: string): Promise<VentaRecord | null> {
    const { rows } = await sql.query<FacturaVentaCabeceraRow>(
      `${CABECERA_SELECT} WHERE fv.codigo_dominio = ?`,
      [dominioId],
    )
    if (!rows[0]) return null
    return this.loadRecordByPk(sql, Number(rows[0].id_factura), rows[0])
  }

  private async loadRecordByPk(
    sql: SqlExecutor,
    facturaPk: number,
    cabecera: FacturaVentaCabeceraRow,
  ): Promise<VentaRecord> {
    const moneda = cabecera.codigo_iso

    const lineasRes = await sql.query<{
      codigo_dominio: string
      id_producto: number
      descripcion_snapshot: string
      cantidad: number
      precio_unitario: number | string
      descuento_tipo: string | null
      descuento_valor: number | string | null
      importe_neto: number | string
    }>(
      `SELECT * FROM DetalleFacturaVenta WHERE id_factura = ? ORDER BY id_detalle`,
      [facturaPk],
    )

    const pagosRes = await sql.query<{
      codigo_dominio: string
      forma_pago: string
      monto: number | string
      codigo_iso: string
      nc_codigo: string | null
      vuelto: number | string | null
    }>(
      `SELECT pf.codigo_dominio, pf.forma_pago, pf.monto, m.codigo_iso, nc.codigo_dominio AS nc_codigo, pf.vuelto
       FROM PagoFactura pf
       INNER JOIN Moneda m ON m.id_moneda = pf.id_moneda
       LEFT JOIN NotaCredito nc ON nc.id_nota_credito = pf.id_nota_credito
       WHERE pf.id_factura = ?
       ORDER BY pf.id_pago`,
      [facturaPk],
    )

    const histRes = await sql.query<{
      codigo_dominio: string
      tipo_evento: string
      id_usuario: number
      fecha: Date | string
      resultado: string
      detalle: string | null
    }>(
      `SELECT * FROM HistorialFacturaVenta WHERE id_factura = ? ORDER BY fecha, id_historial`,
      [facturaPk],
    )

    const cambios = await this.loadCambios(sql, facturaPk, moneda)
    const devoluciones = await this.loadDevoluciones(sql, facturaPk, moneda)
    const notasCredito = await this.loadNotasCredito(sql, facturaPk, cabecera.codigo_dominio)

    return SqlServerVentaRowMapper.assemble({
      cabecera,
      lineas: lineasRes.rows.map((r) => SqlServerVentaRowMapper.lineaFromRow(r, moneda)),
      pagos: pagosRes.rows.map((r) => SqlServerVentaRowMapper.pagoFromRow(r)),
      cambios,
      devoluciones,
      notasCredito,
      historial: histRes.rows.map((r) => SqlServerVentaRowMapper.historialFromRow(r)),
    })
  }

  private async loadCambios(sql: SqlExecutor, facturaPk: number, moneda: string): Promise<CambioRecord[]> {
    const { rows: cambios } = await sql.query<{
      id_cambio: number
      codigo_dominio: string
      fecha: Date | string
      id_usuario: number
      diferencia_monto: number | string
      codigo_iso: string
      resolucion: string
    }>(
      `SELECT cf.*, m.codigo_iso
       FROM CambioFactura cf
       INNER JOIN Moneda m ON m.id_moneda = cf.id_moneda
       WHERE cf.id_factura = ?
       ORDER BY cf.id_cambio`,
      [facturaPk],
    )

    const out: CambioRecord[] = []
    for (const c of cambios) {
      const { rows: lineas } = await sql.query<{
        tipo_linea: string
        id_producto: number
        cantidad: number
        precio_unitario: number | string | null
        descripcion_snapshot: string | null
      }>(`SELECT * FROM DetalleCambioFactura WHERE id_cambio = ?`, [c.id_cambio])

      out.push({
        id: c.codigo_dominio,
        fecha: mysqlDateToIso(c.fecha),
        usuarioId: String(c.id_usuario),
        lineasDevueltas: lineas
          .filter((l) => l.tipo_linea === 'devuelta')
          .map((l) => ({
            productoId: String(l.id_producto),
            cantidad: Number(l.cantidad),
            precioUnitario: l.precio_unitario == null ? undefined : Number(l.precio_unitario),
            descripcionSnapshot: l.descripcion_snapshot ?? undefined,
          })),
        lineasNuevas: lineas
          .filter((l) => l.tipo_linea === 'nueva')
          .map((l) => ({
            productoId: String(l.id_producto),
            cantidad: Number(l.cantidad),
            precioUnitario: l.precio_unitario == null ? undefined : Number(l.precio_unitario),
            descripcionSnapshot: l.descripcion_snapshot ?? undefined,
          })),
        diferenciaMonto: Number(c.diferencia_monto),
        moneda: c.codigo_iso || moneda,
        resolucion: c.resolucion,
      })
    }
    return out
  }

  private async loadDevoluciones(
    sql: SqlExecutor,
    facturaPk: number,
    moneda: string,
  ): Promise<DevolucionRecord[]> {
    const { rows: devs } = await sql.query<{
      id_devolucion: number
      codigo_dominio: string
      fecha: Date | string
      id_usuario: number
      aptitud_reingreso: string
      compensacion: string
      monto_compensacion: number | string
      codigo_iso: string
    }>(
      `SELECT df.*, m.codigo_iso
       FROM DevolucionFactura df
       INNER JOIN Moneda m ON m.id_moneda = df.id_moneda
       WHERE df.id_factura = ?
       ORDER BY df.id_devolucion`,
      [facturaPk],
    )

    const out: DevolucionRecord[] = []
    for (const d of devs) {
      const { rows: lineas } = await sql.query<{ id_producto: number; cantidad: number }>(
        `SELECT id_producto, cantidad FROM DetalleDevolucionFactura WHERE id_devolucion = ?`,
        [d.id_devolucion],
      )

      out.push({
        id: d.codigo_dominio,
        fecha: mysqlDateToIso(d.fecha),
        usuarioId: String(d.id_usuario),
        lineas: lineas.map((l) => ({
          productoId: String(l.id_producto),
          cantidad: Number(l.cantidad),
        })),
        aptitudReingreso: d.aptitud_reingreso,
        compensacion: d.compensacion,
        montoCompensacion: Number(d.monto_compensacion),
        moneda: d.codigo_iso || moneda,
      })
    }
    return out
  }

  private async loadNotasCredito(
    sql: SqlExecutor,
    facturaPk: number,
    ventaOrigenId: string,
  ): Promise<NotaCreditoRecord[]> {
    const { rows: ncs } = await sql.query<{
      id_nota_credito: number
      codigo_dominio: string
      id_persona: number
      fecha: Date | string
      id_usuario: number
      monto: number | string
      codigo_iso: string
      motivo: string
      estado: string
      monto_aplicado: number | string
    }>(
      `SELECT nc.*, m.codigo_iso
       FROM NotaCredito nc
       INNER JOIN Moneda m ON m.id_moneda = nc.id_moneda
       WHERE nc.id_factura_origen = ?
       ORDER BY nc.id_nota_credito`,
      [facturaPk],
    )

    const out: NotaCreditoRecord[] = []
    for (const nc of ncs) {
      const { rows: apps } = await sql.query<{
        monto_aplicado: number | string
        fecha: Date | string
        codigo_dominio: string
      }>(
        `SELECT a.monto_aplicado, a.fecha, fv.codigo_dominio
         FROM AplicacionNotaCredito a
         INNER JOIN FacturaVenta fv ON fv.id_factura = a.id_factura_destino
         WHERE a.id_nota_credito = ?`,
        [nc.id_nota_credito],
      )

      out.push({
        id: nc.codigo_dominio,
        ventaOrigenId,
        clienteId: String(nc.id_persona),
        fecha: mysqlDateToIso(nc.fecha),
        usuarioId: String(nc.id_usuario),
        monto: Number(nc.monto),
        moneda: nc.codigo_iso,
        motivo: nc.motivo,
        estado: nc.estado,
        montoAplicado: Number(nc.monto_aplicado),
        aplicaciones: apps.map((a) => ({
          ventaDestinoId: a.codigo_dominio,
          montoAplicado: Number(a.monto_aplicado),
          fecha: mysqlDateToIso(a.fecha),
        })),
      })
    }
    return out
  }

  private async upsertAggregate(
    tx: SqlExecutor,
    bridge: SqlServerCatalogBridge,
    record: VentaRecord,
  ): Promise<void> {
    const idSucursal = bridge.requireId(record.sucursalId, 'sucursal')
    const idAlmacen = bridge.requireId(record.almacenId, 'almacen')
    const idUsuario = bridge.requireId(record.usuarioEmisionId, 'usuario')
    const idPersona = bridge.parseId(record.clienteId)
    const idMoneda = await bridge.monedaId(record.moneda)

    const existing = await tx.query<{ id_factura: number; version: number }>(
      `SELECT id_factura, version FROM FacturaVenta WHERE codigo_dominio = ?`,
      [record.id],
    )

    let facturaPk: number
    if (existing.rows[0]) {
      const prevVersion = Number(existing.rows[0].version)
      if (record.version < prevVersion) {
        throw new Error(
          `SqlServerVentaRepository: conflicto de versión (persistido=${prevVersion}, incoming=${record.version})`,
        )
      }
      facturaPk = Number(existing.rows[0].id_factura)
      await tx.query(
        `UPDATE FacturaVenta SET
          numero_factura = ?, estado = ?, tipo_venta = ?,
          id_persona = ?, id_sucursal = ?, id_almacen = ?,
          id_usuario_emision = ?, id_moneda = ?, fecha_emision = ?,
          subtotal = ?, total_descuentos = ?, total = ?, version = ?,
          tiene_cambios = ?, tiene_devoluciones = ?, tiene_notas_credito = ?,
          motivo_anulacion = ?
         WHERE id_factura = ?`,
        [
          record.numeroFactura,
          record.estado,
          record.tipoVenta,
          idPersona,
          idSucursal,
          idAlmacen,
          idUsuario,
          idMoneda,
          toSqlDatetime(record.fechaEmision),
          record.subtotal,
          record.totalDescuentos,
          record.total,
          record.version,
          record.tieneCambios ? 1 : 0,
          record.tieneDevoluciones ? 1 : 0,
          record.tieneNotasCredito ? 1 : 0,
          record.motivoAnulacion ?? null,
          facturaPk,
        ],
      )
      await this.deleteChildren(tx, facturaPk)
    } else {
      const ins = await tx.query<{ id_factura: number }>(
        `INSERT INTO FacturaVenta (
          codigo_dominio, numero_factura, estado, tipo_venta,
          id_persona, id_sucursal, id_almacen, id_usuario_emision, id_moneda,
          fecha_emision, subtotal, total_descuentos, total, version,
          tiene_cambios, tiene_devoluciones, tiene_notas_credito, motivo_anulacion
        )
        OUTPUT INSERTED.id_factura
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          record.id,
          record.numeroFactura,
          record.estado,
          record.tipoVenta,
          idPersona,
          idSucursal,
          idAlmacen,
          idUsuario,
          idMoneda,
          toSqlDatetime(record.fechaEmision),
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
      facturaPk = ins.insertId || Number(ins.rows[0]?.id_factura)
    }

    await this.insertChildren(tx, bridge, facturaPk, record)
  }

  private async deleteChildren(tx: SqlExecutor, facturaPk: number): Promise<void> {
    const ncs = await tx.query<{ id_nota_credito: number }>(
      `SELECT id_nota_credito FROM NotaCredito WHERE id_factura_origen = ?`,
      [facturaPk],
    )
    for (const nc of ncs.rows) {
      await tx.query(`DELETE FROM AplicacionNotaCredito WHERE id_nota_credito = ?`, [
        nc.id_nota_credito,
      ])
    }

    await tx.query(`DELETE FROM PagoFactura WHERE id_factura = ?`, [facturaPk])
    await tx.query(`DELETE FROM NotaCredito WHERE id_factura_origen = ?`, [facturaPk])

    const cambios = await tx.query<{ id_cambio: number }>(
      `SELECT id_cambio FROM CambioFactura WHERE id_factura = ?`,
      [facturaPk],
    )
    for (const c of cambios.rows) {
      await tx.query(`DELETE FROM DetalleCambioFactura WHERE id_cambio = ?`, [c.id_cambio])
    }
    await tx.query(`DELETE FROM CambioFactura WHERE id_factura = ?`, [facturaPk])

    const devoluciones = await tx.query<{ id_devolucion: number }>(
      `SELECT id_devolucion FROM DevolucionFactura WHERE id_factura = ?`,
      [facturaPk],
    )
    for (const d of devoluciones.rows) {
      await tx.query(`DELETE FROM DetalleDevolucionFactura WHERE id_devolucion = ?`, [
        d.id_devolucion,
      ])
    }
    await tx.query(`DELETE FROM DevolucionFactura WHERE id_factura = ?`, [facturaPk])
    await tx.query(`DELETE FROM HistorialFacturaVenta WHERE id_factura = ?`, [facturaPk])
    await tx.query(`DELETE FROM DetalleFacturaVenta WHERE id_factura = ?`, [facturaPk])
  }

  private async insertChildren(
    tx: SqlExecutor,
    bridge: SqlServerCatalogBridge,
    facturaPk: number,
    record: VentaRecord,
  ): Promise<void> {
    for (const linea of record.lineas) {
      const idProducto = bridge.requireId(linea.productoId, 'producto')
      const idInventario = await bridge.inventarioId(linea.productoId, record.almacenId)
      const desc = descuentoToCols(linea.descuento)
      await tx.query(
        `INSERT INTO DetalleFacturaVenta (
          id_factura, codigo_dominio, id_producto, id_inventario,
          descripcion_snapshot, cantidad, precio_unitario,
          descuento_tipo, descuento_valor, importe_neto
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          facturaPk,
          linea.id,
          idProducto,
          idInventario,
          linea.descripcionSnapshot,
          linea.cantidad,
          linea.precioUnitario,
          desc.descuento_tipo,
          desc.descuento_valor,
          linea.importeNeto,
        ],
      )
    }

    for (const nc of record.notasCredito) {
      await this.insertNotaCredito(tx, bridge, facturaPk, nc)
    }

    for (const pago of record.pagos) {
      const idMonedaPago = await bridge.monedaId(pago.moneda)
      let idNotaCredito: number | null = null
      if (pago.notaCreditoId) {
        idNotaCredito = await bridge.notaCreditoPk(pago.notaCreditoId)
      }
      await tx.query(
        `INSERT INTO PagoFactura (
          id_factura, codigo_dominio, forma_pago, monto, id_moneda, id_nota_credito, vuelto
        ) VALUES (?,?,?,?,?,?,?)`,
        [
          facturaPk,
          pago.id,
          pago.formaPago,
          pago.monto,
          idMonedaPago,
          idNotaCredito,
          pago.vuelto ?? null,
        ],
      )
    }

    for (const h of record.historial) {
      await tx.query(
        `INSERT INTO HistorialFacturaVenta (
          id_factura, codigo_dominio, tipo_evento, id_usuario, fecha, resultado, detalle
        ) VALUES (?,?,?,?,?,?,?)`,
        [
          facturaPk,
          h.id,
          h.tipoEvento,
          bridge.requireId(h.usuarioId, 'usuario'),
          toSqlDatetime(h.fecha),
          h.resultado,
          h.detalle ?? null,
        ],
      )
    }

    for (const cambio of record.cambios) {
      await this.insertCambio(tx, bridge, facturaPk, record.almacenId, cambio)
    }
    for (const dev of record.devoluciones) {
      await this.insertDevolucion(tx, bridge, facturaPk, record.almacenId, dev)
    }
  }

  private async insertCambio(
    tx: SqlExecutor,
    bridge: SqlServerCatalogBridge,
    facturaPk: number,
    almacenId: string,
    cambio: CambioRecord,
  ): Promise<void> {
    const idMoneda = await bridge.monedaId(cambio.moneda)
    const ins = await tx.query<{ id_cambio: number }>(
      `INSERT INTO CambioFactura (
        id_factura, codigo_dominio, fecha, id_usuario, diferencia_monto, id_moneda, resolucion
      )
      OUTPUT INSERTED.id_cambio
      VALUES (?,?,?,?,?,?,?)`,
      [
        facturaPk,
        cambio.id,
        toSqlDatetime(cambio.fecha),
        bridge.requireId(cambio.usuarioId, 'usuario'),
        cambio.diferenciaMonto,
        idMoneda,
        cambio.resolucion,
      ],
    )
    const cambioPk = ins.insertId || Number(ins.rows[0]?.id_cambio)

    for (const l of cambio.lineasDevueltas) {
      const idProducto = bridge.requireId(l.productoId, 'producto')
      const idInventario = await bridge.inventarioId(l.productoId, almacenId)
      await tx.query(
        `INSERT INTO DetalleCambioFactura (
          id_cambio, tipo_linea, id_producto, id_inventario, cantidad
        ) VALUES (?,?,?,?,?)`,
        [cambioPk, 'devuelta', idProducto, idInventario, l.cantidad],
      )
    }
    for (const l of cambio.lineasNuevas) {
      const idProducto = bridge.requireId(l.productoId, 'producto')
      const idInventario = await bridge.inventarioId(l.productoId, almacenId)
      await tx.query(
        `INSERT INTO DetalleCambioFactura (
          id_cambio, tipo_linea, id_producto, id_inventario, cantidad, precio_unitario, descripcion_snapshot
        ) VALUES (?,?,?,?,?,?,?)`,
        [
          cambioPk,
          'nueva',
          idProducto,
          idInventario,
          l.cantidad,
          l.precioUnitario ?? null,
          l.descripcionSnapshot ?? null,
        ],
      )
    }
  }

  private async insertDevolucion(
    tx: SqlExecutor,
    bridge: SqlServerCatalogBridge,
    facturaPk: number,
    almacenId: string,
    dev: DevolucionRecord,
  ): Promise<void> {
    const idMoneda = await bridge.monedaId(dev.moneda)
    const ins = await tx.query<{ id_devolucion: number }>(
      `INSERT INTO DevolucionFactura (
        id_factura, codigo_dominio, fecha, id_usuario,
        aptitud_reingreso, compensacion, monto_compensacion, id_moneda
      )
      OUTPUT INSERTED.id_devolucion
      VALUES (?,?,?,?,?,?,?,?)`,
      [
        facturaPk,
        dev.id,
        toSqlDatetime(dev.fecha),
        bridge.requireId(dev.usuarioId, 'usuario'),
        dev.aptitudReingreso,
        dev.compensacion,
        dev.montoCompensacion,
        idMoneda,
      ],
    )
    const devPk = ins.insertId || Number(ins.rows[0]?.id_devolucion)

    for (const l of dev.lineas) {
      const idProducto = bridge.requireId(l.productoId, 'producto')
      const idInventario = await bridge.inventarioId(l.productoId, almacenId)
      await tx.query(
        `INSERT INTO DetalleDevolucionFactura (id_devolucion, id_producto, id_inventario, cantidad)
         VALUES (?,?,?,?)`,
        [devPk, idProducto, idInventario, l.cantidad],
      )
    }
  }

  private async insertNotaCredito(
    tx: SqlExecutor,
    bridge: SqlServerCatalogBridge,
    facturaPk: number,
    nc: NotaCreditoRecord,
  ): Promise<void> {
    const idPersona = bridge.requireId(nc.clienteId, 'cliente')
    const idMoneda = await bridge.monedaId(nc.moneda)

    const ins = await tx.query<{ id_nota_credito: number }>(
      `INSERT INTO NotaCredito (
        codigo_dominio, id_factura_origen, id_persona, fecha, id_usuario,
        monto, id_moneda, motivo, estado, monto_aplicado
      )
      OUTPUT INSERTED.id_nota_credito
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        nc.id,
        facturaPk,
        idPersona,
        toSqlDatetime(nc.fecha),
        bridge.requireId(nc.usuarioId, 'usuario'),
        nc.monto,
        idMoneda,
        nc.motivo,
        nc.estado,
        nc.montoAplicado,
      ],
    )
    const ncPk = ins.insertId || Number(ins.rows[0]?.id_nota_credito)

    for (const app of nc.aplicaciones) {
      const destPk = await bridge.facturaPk(app.ventaDestinoId)
      if (destPk == null) {
        throw new Error(
          `SqlServerVentaRepository: factura destino NC no encontrada (${app.ventaDestinoId})`,
        )
      }
      await tx.query(
        `INSERT INTO AplicacionNotaCredito (id_nota_credito, id_factura_destino, monto_aplicado, fecha)
         VALUES (?,?,?,?)`,
        [ncPk, destPk, app.montoAplicado, toSqlDatetime(app.fecha)],
      )
    }
  }
}
