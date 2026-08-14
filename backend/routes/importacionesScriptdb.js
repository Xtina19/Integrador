/**
 * API Importaciones — adaptada exclusivamente a public/scriptdb
 * Tablas: Embarque, DocumentoCostoFlete, CostoEmbarque, FacturaInternacional, DetalleFacturaInternacional,
 *         Consolidacion, OrdenCompra, DetalleOrdenCompra, RecepcionOrdenCompra,
 *         Inventario, MovimientoInventario
 * Relación: OrdenCompra (internacional) → FacturaProveedores → FacturaInternacional → Embarque → Consolidacion
 *           → RecepcionOrdenCompra → Inventario / MovimientoInventario (documento_tipo recepcion)
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { sendPaginated, sendSuccess } = require('../middlewares/successResponse');
const { ensureFacturaProveedorFromOrden } = require('../lib/facturaProveedorScriptdb');
const { ensureScriptdbCompras } = require('../lib/ensureScriptdb');
const {
  ensureDetalleRecepcionFromOrden,
  aplicarEntradaInventarioRecepcion,
} = require('../lib/entradaInventario');

const MAX_FLETE_FILE_BYTES = 25 * 1024 * 1024;
const uploadFlete = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FLETE_FILE_BYTES },
});

function acceptFleteFile(req, res, next) {
  uploadFlete.single('archivo')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 413, 'El PDF o imagen no puede superar 25 MB.');
    }
    return fail(res, 400, 'No se pudo leer el archivo adjunto. Use PDF o imagen.');
  });
}

const TIPOS_DOCUMENTO_FLETE = [
  'Factura flete',
  'Conocimiento de embarque',
  'Guía aérea',
  'Factura aduana',
  'Recibo portuario',
  'Otros',
];

const ESTADOS_DOCUMENTO_FLETE = ['Registrado', 'Validado', 'Pagado', 'Anulado'];

const COSTO_CONCEPTOS = {
  internationalFreight: 'Flete internacional',
  insurance: 'Seguro',
  customs: 'Aduana',
  localTransport: 'Transporte local',
  portFees: 'Gastos portuarios',
  handling: 'Manipulación',
  other: 'Otros gastos',
};

const FE_STATUS_FLOW = ['registered', 'in_transit', 'customs', 'received', 'costed', 'finalized'];

const DB_ESTADO_TO_FE = {
  Registrado: 'registered',
  'En Tránsito': 'in_transit',
  'En Aduana': 'customs',
  Recibido: 'received',
  Costeado: 'costed',
  Finalizado: 'finalized',
};

const FE_TO_DB_ESTADO = {
  registered: 'Registrado',
  in_transit: 'En Tránsito',
  customs: 'En Aduana',
  received: 'Recibido',
  costed: 'Costeado',
  finalized: 'Finalizado',
};

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'UNEXPECTED', message },
  });
}

function isOrdenInternacional(row) {
  return String(row?.tipo_orden || '').trim() === 'Internacional';
}

function extractPaisOrigen(origin) {
  const parts = String(origin || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(origin || '—').slice(0, 100);
}

async function nextCodigoEmbarque(pool) {
  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(codigo_embarque, 5, 20) AS INT)
    ) AS max_num
    FROM Embarque
    WHERE codigo_embarque LIKE 'EMB-[0-9]%'
  `);
  const maxNum = Number(result.recordset[0]?.max_num || 0);
  return `EMB-${String(maxNum + 1).padStart(3, '0')}`;
}

async function nextCodigoConsolidacion(pool) {
  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(codigo_consolidacion, 6, 20) AS INT)
    ) AS max_num
    FROM Consolidacion
    WHERE codigo_consolidacion LIKE 'CONS-[0-9]%'
  `);
  const maxNum = Number(result.recordset[0]?.max_num || 0);
  return `CONS-${String(maxNum + 1).padStart(3, '0')}`;
}

async function nextCodigoDocumentoFlete(pool) {
  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(codigo_documento, 5, 20) AS INT)
    ) AS max_num
    FROM DocumentoCostoFlete
    WHERE codigo_documento LIKE 'DCF-[0-9]%'
  `);
  const maxNum = Number(result.recordset[0]?.max_num || 0);
  return `DCF-${String(maxNum + 1).padStart(3, '0')}`;
}

async function nextNumeroFacturaInt(pool) {
  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(numero_factura, 6, 20) AS INT)
    ) AS max_num
    FROM FacturaInternacional
    WHERE numero_factura LIKE 'FINV-[0-9]%'
  `);
  const maxNum = Number(result.recordset[0]?.max_num || 0);
  return `FINV-${String(maxNum + 1).padStart(3, '0')}`;
}

function mapConsolidacionEstadoToFe(estado) {
  const e = String(estado || '').trim();
  if (e === 'Procesado') return 'processed';
  if (e === 'Cerrado') return 'closed';
  return 'pending';
}

function mapConsolidacionEstadoToDb(status) {
  if (status === 'processed') return 'Procesado';
  if (status === 'closed') return 'Cerrado';
  return 'Pendiente';
}

function inferPipelineStage(feStatus, hasConsolidacion) {
  switch (feStatus) {
    case 'registered':
      return 'freight';
    case 'in_transit':
      return 'shipment';
    case 'customs':
      return hasConsolidacion ? 'consolidation' : 'shipment';
    case 'received':
      return 'freight';
    case 'costed':
      return 'costing';
    case 'finalized':
      return 'reception';
    default:
      return 'invoice';
  }
}

function costsFromRows(rows) {
  const costs = {
    internationalFreight: 0,
    insurance: 0,
    customs: 0,
    localTransport: 0,
    portFees: 0,
    handling: 0,
    other: 0,
  };
  for (const row of rows) {
    const concepto = String(row.concepto || '');
    const monto = Number(row.monto_local ?? row.monto ?? 0);
    const entry = Object.entries(COSTO_CONCEPTOS).find(([, label]) => label === concepto);
    if (entry) costs[entry[0]] = monto;
    else costs.other += monto;
  }
  return costs;
}

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function decodeContenidoArchivo(body) {
  const raw = body?.contenidoArchivo ?? body?.contenido_archivo;
  if (!raw || typeof raw !== 'string') return null;
  const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
  if (!base64) return null;
  try {
    const buf = Buffer.from(base64, 'base64');
    return buf.length ? buf : null;
  } catch {
    return null;
  }
}

function resolveContenidoArchivo(req) {
  if (req.file?.buffer?.length) return req.file.buffer;
  return decodeContenidoArchivo(req.body);
}

async function ensureDocumentoCostoFlete(pool) {
  await pool.request().query(`
    IF OBJECT_ID('DocumentoCostoFlete', 'U') IS NULL
    BEGIN
      CREATE TABLE DocumentoCostoFlete (
        id_documento_flete INT PRIMARY KEY IDENTITY,
        id_embarque INT NOT NULL,
        codigo_documento VARCHAR(50) NOT NULL UNIQUE,
        numero_documento VARCHAR(100),
        tipo_documento VARCHAR(50) NOT NULL,
        concepto VARCHAR(150) NOT NULL,
        proveedor_servicio VARCHAR(150) NOT NULL,
        fecha_documento DATE NOT NULL,
        moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
        tasa_cambio DECIMAL(10, 4),
        monto DECIMAL(12, 2) NOT NULL,
        monto_local DECIMAL(12, 2),
        estado VARCHAR(50) NOT NULL DEFAULT 'Registrado',
        nombre_archivo VARCHAR(255),
        mime_type VARCHAR(100),
        contenido_archivo VARBINARY(MAX),
        observacion VARCHAR(255),
        fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_dcf_embarque FOREIGN KEY (id_embarque) REFERENCES Embarque(id_embarque)
      );
    END
  `);
  await pool.request().query(`
    IF COL_LENGTH('DocumentoCostoFlete', 'mime_type') IS NULL
      ALTER TABLE DocumentoCostoFlete ADD mime_type VARCHAR(100) NULL;
  `);
  await pool.request().query(`
    IF COL_LENGTH('DocumentoCostoFlete', 'contenido_archivo') IS NULL
      ALTER TABLE DocumentoCostoFlete ADD contenido_archivo VARBINARY(MAX) NULL;
  `);
}

async function fetchFacturaInternacionalForEmbarque(pool, idEmbarque) {
  try {
    const result = await pool.request().input('id', sql.Int, idEmbarque).query(`
      SELECT TOP 1 fi.*, oc.codigo_orden
      FROM FacturaInternacional fi
      LEFT JOIN OrdenCompra oc ON oc.id_orden_compra = fi.id_orden_compra
      WHERE fi.id_embarque = @id
      ORDER BY fi.id_factura_int DESC
    `);
    return result.recordset[0] ?? null;
  } catch (err) {
    if (!String(err.message || '').includes('Invalid column name')) throw err;
    const fallback = await pool.request().input('id', sql.Int, idEmbarque).query(`
      SELECT TOP 1 fi.* FROM FacturaInternacional fi
      WHERE fi.id_embarque = @id
      ORDER BY fi.id_factura_int DESC
    `);
    return fallback.recordset[0] ?? null;
  }
}

const DOCUMENTO_FLETE_SELECT = `
  dcf.id_documento_flete,
  dcf.id_embarque,
  dcf.codigo_documento,
  dcf.numero_documento,
  dcf.tipo_documento,
  dcf.concepto,
  dcf.proveedor_servicio,
  dcf.fecha_documento,
  dcf.moneda,
  dcf.tasa_cambio,
  dcf.monto,
  dcf.monto_local,
  dcf.estado,
  dcf.nombre_archivo,
  dcf.mime_type,
  dcf.observacion,
  CASE WHEN dcf.contenido_archivo IS NOT NULL THEN 1 ELSE 0 END AS tiene_archivo
`;

function mapDocumentoFleteRow(row, embarqueCodigo) {
  const feStatus = String(row.estado || '').toLowerCase();
  let status = 'registered';
  if (feStatus === 'validado') status = 'validated';
  else if (feStatus === 'pagado') status = 'paid';
  else if (feStatus === 'anulado') status = 'void';
  return {
    id: row.id_documento_flete,
    codigo: row.codigo_documento,
    embarqueId: row.id_embarque,
    embarqueCodigo: embarqueCodigo ?? null,
    numeroDocumento: row.numero_documento,
    tipoDocumento: row.tipo_documento,
    concepto: row.concepto,
    proveedorServicio: row.proveedor_servicio,
    fechaDocumento: toIsoDate(row.fecha_documento),
    moneda: row.moneda,
    tasaCambio: row.tasa_cambio != null ? Number(row.tasa_cambio) : null,
    monto: Number(row.monto ?? 0),
    montoLocal: row.monto_local != null ? Number(row.monto_local) : null,
    estadoDb: row.estado,
    status,
    nombreArchivo: row.nombre_archivo,
    mimeType: row.mime_type ?? null,
    tieneArchivo: Boolean(row.tiene_archivo),
    observacion: row.observacion,
  };
}

function mapEmbarqueRow(row, extras = {}) {
  const feStatus = DB_ESTADO_TO_FE[String(row.estado || '')] || 'registered';
  const fi = extras.facturaRow;
  return {
    id: row.id_embarque,
    codigo: row.codigo_embarque,
    proveedor: row.proveedor,
    paisOrigen: row.pais_origen,
    origen: extras.origen ?? row.pais_origen,
    destino: extras.destino ?? 'Santo Domingo, RD',
    fechaDespacho: toIsoDate(row.fecha_despacho),
    fechaLlegadaEst: toIsoDate(row.fecha_llegada_est),
    fechaLlegadaReal: toIsoDate(row.fecha_llegada_real),
    tipoTransporte: row.tipo_transporte,
    numeroTracking: row.numero_tracking,
    estadoDb: row.estado,
    estado: feStatus,
    observacion: row.observacion,
    cajas: extras.cajas ?? null,
    costs: extras.costs ?? null,
    documentosFlete: extras.documentosFlete ?? [],
    facturaInternacional: extras.factura ?? null,
    consolidacion: extras.consolidacion ?? null,
    ordenCompraId: fi?.id_orden_compra ?? null,
    codigoOrden: fi?.codigo_orden ?? null,
    pipelineStage: inferPipelineStage(feStatus, Boolean(extras.consolidacion)),
  };
}

function mapFacturaRow(row, embarque) {
  const feStatus = String(row.estado || '').toLowerCase() === 'pagada' ? 'paid' : 'pending';
  return {
    id: row.id_factura_int,
    numeroFactura: row.numero_factura,
    embarqueId: row.id_embarque,
    embarqueCodigo: embarque?.codigo_embarque ?? null,
    proveedor: row.proveedor,
    paisEmisor: row.pais_emisor,
    fechaEmision: toIsoDate(row.fecha_emision),
    moneda: row.moneda,
    tasaCambio: Number(row.tasa_cambio ?? 1),
    subtotal: Number(row.subtotal ?? 0),
    impuestos: Number(row.impuestos ?? 0),
    total: Number(row.total ?? 0),
    totalLocal: Number(row.total_local ?? 0),
    estado: row.estado,
    status: feStatus,
    observacion: row.observacion,
    ordenCompraId: row.id_orden_compra ?? null,
    codigoOrden: row.codigo_orden ?? null,
    stage: embarque
      ? inferPipelineStage(
          DB_ESTADO_TO_FE[String(embarque.estado || '')] || 'registered',
          false,
        )
      : 'invoice',
  };
}

function mapConsolidacionRow(row, almacenNombre) {
  return {
    id: row.id_consolidacion,
    codigo: row.codigo_consolidacion,
    embarqueId: row.id_embarque,
    almacenId: row.id_almacen_destino,
    almacenNombre: almacenNombre ?? null,
    fechaConsolidacion: toIsoDate(row.fecha_consolidacion),
    totalBultos: Number(row.total_bultos ?? 0),
    pesoTotalKg: row.peso_total_kg != null ? Number(row.peso_total_kg) : null,
    volumenTotalM3: row.volumen_total_m3 != null ? Number(row.volumen_total_m3) : null,
    estadoDb: row.estado,
    status: mapConsolidacionEstadoToFe(row.estado),
    observacion: row.observacion,
  };
}

async function fetchDocumentosFlete(pool, idEmbarque, embarqueCodigo) {
  try {
    const result = await pool.request().input('id', sql.Int, idEmbarque).query(`
      SELECT ${DOCUMENTO_FLETE_SELECT}, e.codigo_embarque
      FROM DocumentoCostoFlete dcf
      INNER JOIN Embarque e ON e.id_embarque = dcf.id_embarque
      WHERE dcf.id_embarque = @id AND dcf.estado <> 'Anulado'
      ORDER BY dcf.fecha_documento DESC, dcf.id_documento_flete DESC
    `);
    return result.recordset.map((row) =>
      mapDocumentoFleteRow(row, row.codigo_embarque ?? embarqueCodigo),
    );
  } catch (err) {
    if (String(err.message || '').includes('Invalid object name')) return [];
    throw err;
  }
}

async function fetchCostosLegacy(pool, idEmbarque) {
  const result = await pool.request().input('id', sql.Int, idEmbarque).query(`
    SELECT concepto, monto, moneda, monto_local
    FROM CostoEmbarque
    WHERE id_embarque = @id
  `);
  return result.recordset;
}

async function fetchCostos(pool, idEmbarque, embarqueCodigo) {
  const documentos = await fetchDocumentosFlete(pool, idEmbarque, embarqueCodigo);
  if (documentos.length) {
    return costsFromRows(
      documentos.map((d) => ({
        concepto: d.concepto,
        monto: d.monto,
        monto_local: d.montoLocal ?? d.monto,
      })),
    );
  }
  const legacy = await fetchCostosLegacy(pool, idEmbarque);
  return costsFromRows(legacy);
}

async function fetchEmbarqueBundle(pool, idEmbarque) {
  const embResult = await pool.request().input('id', sql.Int, idEmbarque).query(`
    SELECT * FROM Embarque WHERE id_embarque = @id
  `);
  const row = embResult.recordset[0];
  if (!row) return null;

  const [documentosFlete, fi, consResult] = await Promise.all([
    fetchDocumentosFlete(pool, idEmbarque, row.codigo_embarque),
    fetchFacturaInternacionalForEmbarque(pool, idEmbarque),
    pool.request().input('id', sql.Int, idEmbarque).query(`
      SELECT TOP 1 c.*, a.nombre AS nombre_almacen
      FROM Consolidacion c
      LEFT JOIN Almacen a ON a.id_almacen = c.id_almacen_destino
      WHERE c.id_embarque = @id
      ORDER BY c.id_consolidacion DESC
    `),
  ]);

  const cons = consResult.recordset[0] ?? null;
  const metaObs = String(row.observacion || '');
  const cajasMatch = metaObs.match(/cajas=(\d+)/i);
  const destinoMatch = metaObs.match(/destino=([^;]+)/i);

  const costRows = documentosFlete.length
    ? documentosFlete.map((d) => ({
        concepto: d.concepto,
        monto: d.monto,
        monto_local: d.montoLocal ?? d.monto,
      }))
    : await fetchCostosLegacy(pool, idEmbarque);

  return mapEmbarqueRow(row, {
    costs: costsFromRows(costRows),
    documentosFlete,
    facturaRow: fi ?? null,
    origen: metaObs.match(/origen=([^;]+)/i)?.[1]?.trim() ?? row.pais_origen,
    destino: destinoMatch?.[1]?.trim() ?? 'Santo Domingo, RD',
    cajas: cajasMatch ? Number(cajasMatch[1]) : null,
    factura: fi ? mapFacturaRow(fi, row) : null,
    consolidacion: cons
      ? mapConsolidacionRow(cons, cons.nombre_almacen)
      : null,
  });
}

async function fetchOrdenInternacional(pool, idOrden) {
  const orden = await pool.request().input('id', sql.Int, idOrden).query(`
    SELECT * FROM OrdenCompra WHERE id_orden_compra = @id
  `);
  const row = orden.recordset[0];
  if (!row) return null;
  if (!isOrdenInternacional(row)) return null;
  if (String(row.estado) !== 'Aprobada') return null;

  const det = await pool.request().input('id', sql.Int, idOrden).query(`
    SELECT id_detalle_oc, id_producto, cantidad, precio_unitario, subtotal
    FROM DetalleOrdenCompra WHERE id_orden_compra = @id
  `);
  return { row, detalles: det.recordset };
}

async function createFacturaFromOrden(pool, idEmbarque, ordenPack, moneda = 'USD') {
  const { row, detalles } = ordenPack;
  const fp = await ensureFacturaProveedorFromOrden(pool, row.id_orden_compra);
  const numero = fp.numero_factura;
  const subtotal = 0;
  const impuestos = 0;
  const total = 0;

  const fiIns = await pool
    .request()
    .input('idEmb', sql.Int, idEmbarque)
    .input('idOrden', sql.Int, row.id_orden_compra)
    .input('idFp', sql.Int, fp.id_factura_prov)
    .input('numero', sql.VarChar(100), numero)
    .input('proveedor', sql.VarChar(150), row.proveedor)
    .input('pais', sql.VarChar(100), 'Internacional')
    .input('fecha', sql.Date, row.fecha_emision)
    .input('moneda', sql.VarChar(10), moneda)
    .input('tasa', sql.Decimal(10, 4), 1)
    .input('subtotal', sql.Decimal(12, 2), subtotal)
    .input('impuestos', sql.Decimal(12, 2), impuestos)
    .input('total', sql.Decimal(12, 2), total)
    .input('totalLocal', sql.Decimal(12, 2), total)
    .input('obs', sql.VarChar(255), row.observacion ?? null)
    .query(`
      INSERT INTO FacturaInternacional (
        id_embarque, id_orden_compra, id_factura_prov, numero_factura, proveedor, pais_emisor, fecha_emision,
        moneda, tasa_cambio, subtotal, impuestos, total, total_local, estado, observacion
      )
      OUTPUT INSERTED.*
      VALUES (
        @idEmb, @idOrden, @idFp, @numero, @proveedor, @pais, @fecha,
        @moneda, @tasa, @subtotal, @impuestos, @total, @totalLocal, 'Pendiente', @obs
      )
    `);
  const fi = fiIns.recordset[0];
  for (const d of detalles) {
    await pool
      .request()
      .input('idFi', sql.Int, fi.id_factura_int)
      .input('idProd', sql.Int, d.id_producto)
      .input('cant', sql.Int, d.cantidad)
      .input('precio', sql.Decimal(12, 2), 0)
      .input('sub', sql.Decimal(12, 2), 0)
      .query(`
        INSERT INTO DetalleFacturaInternacional (
          id_factura_int, id_producto, cantidad, precio_unitario, subtotal, cantidad_recibida
        )
        VALUES (@idFi, @idProd, @cant, @precio, @sub, 0)
      `);
  }
  return fi;
}

async function ensureConsolidacion(pool, idEmbarque, idAlmacen, totalBultos, fecha) {
  const existing = await pool.request().input('id', sql.Int, idEmbarque).query(`
    SELECT TOP 1 * FROM Consolidacion WHERE id_embarque = @id
  `);
  if (existing.recordset[0]) return existing.recordset[0];

  const codigo = await nextCodigoConsolidacion(pool);
  const ins = await pool
    .request()
    .input('codigo', sql.VarChar(50), codigo)
    .input('idEmb', sql.Int, idEmbarque)
    .input('idAlm', sql.Int, idAlmacen)
    .input('fecha', sql.Date, fecha)
    .input('bultos', sql.Int, totalBultos || 0)
    .query(`
      INSERT INTO Consolidacion (
        codigo_consolidacion, id_embarque, id_almacen_destino,
        fecha_consolidacion, total_bultos, estado
      )
      OUTPUT INSERTED.*
      VALUES (@codigo, @idEmb, @idAlm, @fecha, @bultos, 'Pendiente')
    `);
  return ins.recordset[0];
}

async function createRecepcionFromOrden(pool, idOrden, idAlmacen, idUsuario = 1) {
  const existing = await pool.request().input('idOrden', sql.Int, idOrden).query(`
    SELECT TOP 1 * FROM RecepcionOrdenCompra WHERE id_orden_compra = @idOrden
    ORDER BY id_recepcion DESC
  `);
  let rec = existing.recordset[0];
  if (!rec) {
    const ins = await pool
      .request()
      .input('idOrden', sql.Int, idOrden)
      .input('idAlm', sql.Int, idAlmacen)
      .input('idUsr', sql.Int, idUsuario)
      .query(`
        INSERT INTO RecepcionOrdenCompra (id_orden_compra, id_almacen, id_usuario_recibe, estado, observacion)
        OUTPUT INSERTED.*
        VALUES (@idOrden, @idAlm, @idUsr, 'Recibido', 'Recepción generada desde embarque internacional')
      `);
    rec = ins.recordset[0];
  } else if (String(rec.estado) !== 'Recibido' && String(rec.estado) !== 'Recibido Parcial') {
    await pool
      .request()
      .input('id', sql.Int, rec.id_recepcion)
      .query(`UPDATE RecepcionOrdenCompra SET estado = 'Recibido' WHERE id_recepcion = @id`);
    rec = { ...rec, estado: 'Recibido' };
  }

  if (rec?.id_recepcion) {
    await ensureDetalleRecepcionFromOrden(pool, rec.id_recepcion, { setRecibida: true });
    await aplicarEntradaInventarioRecepcion(pool, rec.id_recepcion, { idUsuario });
  }
  return rec;
}

/** GET /embarques */
router.get('/embarques', async (req, res) => {
  try {
    const pool = await getConnection();
    await ensureScriptdbCompras(pool);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize) || 200));
    const offset = (page - 1) * pageSize;

    const countResult = await pool.request().query(`SELECT COUNT(*) AS total FROM Embarque`);
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const list = await pool.request().query(`
      SELECT id_embarque FROM Embarque
      ORDER BY fecha_registro DESC, id_embarque DESC
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `);

    const data = [];
    for (const r of list.recordset) {
      const bundle = await fetchEmbarqueBundle(pool, r.id_embarque);
      if (bundle) data.push(bundle);
    }

    return sendPaginated(res, data, { page, pageSize, total }, 'Embarques listados correctamente.');
  } catch (err) {
    console.error('[importaciones] list embarques', err.message, err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /embarques/:id */
router.get('/embarques/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const pool = await getConnection();
    const bundle = await fetchEmbarqueBundle(pool, id);
    if (!bundle) return fail(res, 404, 'Embarque no encontrado');
    return sendSuccess(res, bundle, { message: 'Embarque obtenido.' });
  } catch (err) {
    console.error('[importaciones] get embarque', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /ordenes-pendientes — OC internacionales aprobadas sin embarque */
router.get('/ordenes-pendientes', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT oc.*
      FROM OrdenCompra oc
      WHERE oc.estado = 'Aprobada'
        AND oc.tipo_orden = 'Internacional'
        AND NOT EXISTS (
          SELECT 1 FROM FacturaInternacional fi
          WHERE fi.id_orden_compra = oc.id_orden_compra
        )
      ORDER BY oc.fecha_emision DESC
    `);

    const data = result.recordset.map((row) => ({
      ordenCompraId: row.id_orden_compra,
      codigoOrden: row.codigo_orden,
      proveedor: row.proveedor,
      fechaOrden: toIsoDate(row.fecha_emision),
      total: Number(row.total ?? 0),
      monedaId: isOrdenInternacional(row) ? 2 : 1,
      idAlmacen: row.id_almacen,
    }));

    return sendSuccess(res, data, { message: 'Órdenes pendientes de embarque.' });
  } catch (err) {
    if (String(err.message || '').includes('Invalid column name')) {
      return sendSuccess(res, [], { message: 'Órdenes pendientes de embarque.' });
    }
    console.error('[importaciones] ordenes pendientes', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /facturas-internacionales */
router.get('/facturas-internacionales', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT fi.*, e.codigo_embarque, e.estado AS embarque_estado, oc.codigo_orden
      FROM FacturaInternacional fi
      INNER JOIN Embarque e ON e.id_embarque = fi.id_embarque
      LEFT JOIN OrdenCompra oc ON oc.id_orden_compra = fi.id_orden_compra
      ORDER BY fi.fecha_registro DESC
    `);
    const data = result.recordset.map((row) =>
      mapFacturaRow(row, { codigo_embarque: row.codigo_embarque, estado: row.embarque_estado }),
    );
    return sendSuccess(res, data, { message: 'Facturas internacionales listadas.' });
  } catch (err) {
    if (String(err.message || '').includes('Invalid column name')) {
      try {
        const pool = await getConnection();
        const result = await pool.request().query(`
          SELECT fi.*, e.codigo_embarque, e.estado AS embarque_estado
          FROM FacturaInternacional fi
          INNER JOIN Embarque e ON e.id_embarque = fi.id_embarque
          ORDER BY fi.fecha_registro DESC
        `);
        const data = result.recordset.map((row) =>
          mapFacturaRow(row, { codigo_embarque: row.codigo_embarque, estado: row.embarque_estado }),
        );
        return sendSuccess(res, data, { message: 'Facturas internacionales listadas.' });
      } catch (inner) {
        console.error('[importaciones] list facturas fallback', inner);
      }
    }
    console.error('[importaciones] list facturas', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /consolidaciones */
router.get('/consolidaciones', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT c.*, a.nombre AS nombre_almacen, e.codigo_embarque
      FROM Consolidacion c
      INNER JOIN Embarque e ON e.id_embarque = c.id_embarque
      LEFT JOIN Almacen a ON a.id_almacen = c.id_almacen_destino
      ORDER BY c.fecha_registro DESC
    `);
    const data = result.recordset.map((row) =>
      mapConsolidacionRow(row, row.nombre_almacen),
    );
    return sendSuccess(res, data, { message: 'Consolidaciones listadas.' });
  } catch (err) {
    console.error('[importaciones] list consolidaciones', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /embarques — registrar embarque + costos + factura desde OC */
router.post('/embarques', async (req, res) => {
  try {
    const body = req.body ?? {};
    const ordenCompraId = Number(body.ordenCompraId);
    if (!Number.isInteger(ordenCompraId) || ordenCompraId <= 0) {
      return fail(res, 400, 'ordenCompraId es obligatorio');
    }

    const pool = await getConnection();
    const ordenPack = await fetchOrdenInternacional(pool, ordenCompraId);
    if (!ordenPack) {
      return fail(res, 404, 'Orden internacional aprobada no encontrada');
    }

    const dup = await pool
      .request()
      .input('idOrden', sql.Int, ordenCompraId)
      .query(`
        SELECT TOP 1 id_factura_int FROM FacturaInternacional
        WHERE id_orden_compra = @idOrden
      `);
    if (dup.recordset[0]) {
      return fail(res, 409, 'Esta orden ya tiene un embarque registrado');
    }

    const codigo = await nextCodigoEmbarque(pool);
    const tipo = String(body.tipoTransporte || body.type || 'Marítimo').slice(0, 50);
    const origen = String(body.origen || body.origin || ordenPack.row.proveedor);
    const destino = String(body.destino || body.destination || 'Santo Domingo, RD');
    const pais = extractPaisOrigen(origen);
    const fechaDespacho = body.fechaDespacho || body.departure || ordenPack.row.fecha_emision;
    const fechaLlegada = body.fechaLlegadaEst || body.arrival || ordenPack.row.fecha_entrega_est;
    const cajas = Math.max(1, Number(body.cajas ?? body.boxes ?? 1));
    const moneda = String(body.moneda || 'USD').slice(0, 10);
    const metaObs = `origen=${origen};destino=${destino};cajas=${cajas}${body.observacion ? ';' + body.observacion : ''}`;

    const embIns = await pool
      .request()
      .input('codigo', sql.VarChar(50), codigo)
      .input('proveedor', sql.VarChar(150), ordenPack.row.proveedor)
      .input('pais', sql.VarChar(100), pais)
      .input('fd', sql.Date, fechaDespacho)
      .input('fle', sql.Date, fechaLlegada)
      .input('tipo', sql.VarChar(50), tipo)
      .input('track', sql.VarChar(100), body.numeroTracking || null)
      .input('obs', sql.VarChar(255), metaObs)
      .query(`
        INSERT INTO Embarque (
          codigo_embarque, proveedor, pais_origen, fecha_despacho, fecha_llegada_est,
          tipo_transporte, numero_tracking, estado, observacion
        )
        OUTPUT INSERTED.id_embarque
        VALUES (@codigo, @proveedor, @pais, @fd, @fle, @tipo, @track, 'Registrado', @obs)
      `);

    const idEmbarque = embIns.recordset[0].id_embarque;
    await createFacturaFromOrden(pool, idEmbarque, ordenPack, moneda);

    const bundle = await fetchEmbarqueBundle(pool, idEmbarque);
    return sendSuccess(res, bundle, { message: `Embarque ${codigo} registrado.` });
  } catch (err) {
    console.error('[importaciones] create embarque', err);
    return fail(res, 500, err.message || 'Error de base de datos');
  }
});

/** PATCH /embarques/:id */
router.patch('/embarques/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const body = req.body ?? {};
    const pool = await getConnection();
    const current = await fetchEmbarqueBundle(pool, id);
    if (!current) return fail(res, 404, 'Embarque no encontrado');

    const origen = String(body.origen ?? body.origin ?? current.origen);
    const destino = String(body.destino ?? body.destination ?? current.destino);
    const cajas = Number(body.cajas ?? body.boxes ?? current.cajas ?? 1);
    const metaObs = `origen=${origen};destino=${destino};cajas=${cajas}${body.observacion ? ';' + body.observacion : ''}`;

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('pais', sql.VarChar(100), extractPaisOrigen(origen))
      .input('fd', sql.Date, body.fechaDespacho || body.departure || current.fechaDespacho)
      .input('fle', sql.Date, body.fechaLlegadaEst || body.arrival || current.fechaLlegadaEst)
      .input('tipo', sql.VarChar(50), body.tipoTransporte || body.type || current.tipoTransporte)
      .input('obs', sql.VarChar(255), metaObs)
      .query(`
        UPDATE Embarque SET
          pais_origen = @pais,
          fecha_despacho = @fd,
          fecha_llegada_est = @fle,
          tipo_transporte = @tipo,
          observacion = @obs
        WHERE id_embarque = @id
      `);

    const bundle = await fetchEmbarqueBundle(pool, id);
    return sendSuccess(res, bundle, { message: 'Embarque actualizado.' });
  } catch (err) {
    console.error('[importaciones] patch embarque', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /embarques/:id/avanzar */
router.post('/embarques/:id/avanzar', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const pool = await getConnection();
    const bundle = await fetchEmbarqueBundle(pool, id);
    if (!bundle) return fail(res, 404, 'Embarque no encontrado');

    const currentFe = bundle.estado;
    const idx = FE_STATUS_FLOW.indexOf(currentFe);
    const nextFe = FE_STATUS_FLOW[idx + 1];
    if (!nextFe) return fail(res, 409, 'No hay transición disponible');

    const nextDb = FE_TO_DB_ESTADO[nextFe];
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('estado', sql.VarChar(50), nextDb)
      .query(`UPDATE Embarque SET estado = @estado WHERE id_embarque = @id`);

    let consolidacion = bundle.consolidacion;
    if (nextFe === 'customs') {
      const almacenId = Number(req.body?.almacenId) || 1;
      const consRow = await ensureConsolidacion(
        pool,
        id,
        almacenId,
        bundle.cajas || 0,
        bundle.fechaLlegadaEst || new Date().toISOString().slice(0, 10),
      );
      const alm = await pool.request().input('id', sql.Int, consRow.id_almacen_destino).query(`
        SELECT nombre AS nombre_almacen FROM Almacen WHERE id_almacen = @id
      `);
      consolidacion = mapConsolidacionRow(consRow, alm.recordset[0]?.nombre_almacen);
    }

    if (nextFe === 'received' || nextFe === 'costed') {
      if (consolidacion?.id) {
        await pool
          .request()
          .input('id', sql.Int, consolidacion.id)
          .query(`UPDATE Consolidacion SET estado = 'Procesado' WHERE id_consolidacion = @id`);
        consolidacion = { ...consolidacion, status: 'processed', estadoDb: 'Procesado' };
      }
    }

    if (nextFe === 'finalized') {
      if (consolidacion?.id) {
        await pool
          .request()
          .input('id', sql.Int, consolidacion.id)
          .query(`UPDATE Consolidacion SET estado = 'Cerrado' WHERE id_consolidacion = @id`);
        consolidacion = { ...consolidacion, status: 'closed', estadoDb: 'Cerrado' };
      }
      if (bundle.ordenCompraId) {
        const orden = await pool
          .request()
          .input('id', sql.Int, bundle.ordenCompraId)
          .query(`SELECT id_almacen FROM OrdenCompra WHERE id_orden_compra = @id`);
        const idAlmacen = orden.recordset[0]?.id_almacen || 1;
        await createRecepcionFromOrden(pool, bundle.ordenCompraId, idAlmacen);
        await pool
          .request()
          .input('id', sql.Int, bundle.ordenCompraId)
          .query(`UPDATE OrdenCompra SET estado = 'Recibida' WHERE id_orden_compra = @id`);
      }
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('fr', sql.Date, new Date())
        .query(`UPDATE Embarque SET fecha_llegada_real = @fr WHERE id_embarque = @id`);
    }

    const updated = await fetchEmbarqueBundle(pool, id);
    if (consolidacion && !updated.consolidacion) updated.consolidacion = consolidacion;

    return sendSuccess(res, updated, { message: `Embarque avanzado a ${nextFe}.` });
  } catch (err) {
    console.error('[importaciones] avanzar embarque', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** DELETE /embarques/:id — solo Registrado */
router.delete('/embarques/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const pool = await getConnection();
    const emb = await pool.request().input('id', sql.Int, id).query(`
      SELECT estado FROM Embarque WHERE id_embarque = @id
    `);
    const row = emb.recordset[0];
    if (!row) return fail(res, 404, 'Embarque no encontrado');
    if (String(row.estado) !== 'Registrado') {
      return fail(res, 409, 'Solo se pueden eliminar embarques en estado Registrado');
    }

    await pool.request().input('id', sql.Int, id).query(`
      DELETE FROM DocumentoCostoFlete WHERE id_embarque = @id;
      DELETE FROM DetalleFacturaInternacional WHERE id_factura_int IN (
        SELECT id_factura_int FROM FacturaInternacional WHERE id_embarque = @id
      );
      DELETE FROM FacturaInternacional WHERE id_embarque = @id;
      DELETE FROM CostoEmbarque WHERE id_embarque = @id;
      DELETE FROM Consolidacion WHERE id_embarque = @id;
      DELETE FROM Embarque WHERE id_embarque = @id;
    `);

    return sendSuccess(res, { id }, { message: 'Embarque eliminado.' });
  } catch (err) {
    console.error('[importaciones] delete embarque', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** PATCH /consolidaciones/:id */
router.patch('/consolidaciones/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const body = req.body ?? {};
    const pool = await getConnection();

    const status = body.status ?? body.estado;
    const obs = body.observacion ?? body.notes;
    const estadoDb = status ? mapConsolidacionEstadoToDb(status) : null;

    if (estadoDb) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('estado', sql.VarChar(50), estadoDb)
        .input('obs', sql.VarChar(255), obs ?? null)
        .query(`
          UPDATE Consolidacion SET estado = @estado, observacion = COALESCE(@obs, observacion)
          WHERE id_consolidacion = @id
        `);
    } else if (obs != null) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('obs', sql.VarChar(255), obs)
        .query(`UPDATE Consolidacion SET observacion = @obs WHERE id_consolidacion = @id`);
    }

    const result = await pool.request().input('id', sql.Int, id).query(`
      SELECT c.*, a.nombre AS nombre_almacen FROM Consolidacion c
      LEFT JOIN Almacen a ON a.id_almacen = c.id_almacen_destino
      WHERE c.id_consolidacion = @id
    `);
    const row = result.recordset[0];
    if (!row) return fail(res, 404, 'Consolidación no encontrada');
    return sendSuccess(res, mapConsolidacionRow(row, row.nombre_almacen), {
      message: 'Consolidación actualizada.',
    });
  } catch (err) {
    console.error('[importaciones] patch consolidacion', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

function mapDocumentoEstadoToDb(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'validated' || s === 'validado') return 'Validado';
  if (s === 'paid' || s === 'pagado') return 'Pagado';
  if (s === 'void' || s === 'anulado') return 'Anulado';
  return 'Registrado';
}

function resolveConcepto(body) {
  const concepto = String(body.concepto || body.concept || '').trim();
  if (concepto) return concepto.slice(0, 150);
  const key = body.conceptKey || body.conceptoKey;
  if (key && COSTO_CONCEPTOS[key]) return COSTO_CONCEPTOS[key];
  return 'Otros gastos';
}

/** GET /documentos-flete */
router.get('/documentos-flete', async (req, res) => {
  try {
    const pool = await getConnection();
    await ensureDocumentoCostoFlete(pool);
    const embarqueId = Number(req.query.embarqueId);
    let query = `
      SELECT ${DOCUMENTO_FLETE_SELECT}, e.codigo_embarque
      FROM DocumentoCostoFlete dcf
      INNER JOIN Embarque e ON e.id_embarque = dcf.id_embarque
      WHERE dcf.estado <> 'Anulado'
    `;
    if (Number.isInteger(embarqueId) && embarqueId > 0) {
      query += ` AND dcf.id_embarque = ${embarqueId}`;
    }
    query += ' ORDER BY dcf.fecha_registro DESC, dcf.id_documento_flete DESC';
    const result = await pool.request().query(query);
    const data = result.recordset.map((row) =>
      mapDocumentoFleteRow(row, row.codigo_embarque),
    );
    return sendSuccess(res, data, { message: 'Documentos de flete listados.' });
  } catch (err) {
    console.error('[importaciones] list documentos flete', err.message);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** POST /embarques/:id/documentos-flete */
router.post('/embarques/:id/documentos-flete', acceptFleteFile, async (req, res) => {
  try {
    const idEmbarque = Number(req.params.id);
    if (!Number.isInteger(idEmbarque) || idEmbarque <= 0) return fail(res, 400, 'Id inválido');
    const body = req.body ?? {};
    const pool = await getConnection();
    await ensureDocumentoCostoFlete(pool);

    const emb = await pool.request().input('id', sql.Int, idEmbarque).query(`
      SELECT id_embarque, codigo_embarque FROM Embarque WHERE id_embarque = @id
    `);
    if (!emb.recordset[0]) return fail(res, 404, 'Embarque no encontrado');

    const concepto = resolveConcepto(body);
    const tipoDoc = String(body.tipoDocumento || body.tipo_documento || 'Factura flete').slice(0, 50);
    if (!TIPOS_DOCUMENTO_FLETE.includes(tipoDoc) && tipoDoc !== 'Otros') {
      return fail(res, 400, 'tipoDocumento inválido');
    }
    const proveedor = String(body.proveedorServicio || body.proveedor_servicio || '').trim();
    if (!proveedor) return fail(res, 400, 'proveedorServicio es obligatorio');

    const monto = Number(body.monto);
    if (!Number.isFinite(monto) || monto <= 0) return fail(res, 400, 'monto inválido');

    const codigo = await nextCodigoDocumentoFlete(pool);
    const moneda = String(body.moneda || 'USD').slice(0, 10);
    const tasa = Number(body.tasaCambio ?? body.tasa_cambio ?? 1);
    const montoLocal = Number(body.montoLocal ?? body.monto_local ?? monto * tasa);
    const fecha = body.fechaDocumento || body.fecha_documento || new Date().toISOString().slice(0, 10);
    const estadoDb = mapDocumentoEstadoToDb(body.status ?? body.estado ?? 'registered');
    const contenido = resolveContenidoArchivo(req);
    if (!contenido) {
      return fail(res, 400, 'Adjunte el documento (PDF o imagen) para guardarlo.');
    }
    const mimeType = String(
      req.file?.mimetype || body.mimeType || body.mime_type || 'application/pdf',
    ).slice(0, 100);
    const nomArch = String(
      req.file?.originalname || body.nombreArchivo || body.nombre_archivo || 'documento-flete.pdf',
    ).slice(0, 255) || 'documento-flete.pdf';

    const reqIns = pool
      .request()
      .input('idEmb', sql.Int, idEmbarque)
      .input('codigo', sql.VarChar(50), codigo)
      .input('numero', sql.VarChar(100), body.numeroDocumento || body.numero_documento || null)
      .input('tipo', sql.VarChar(50), tipoDoc)
      .input('concepto', sql.VarChar(150), concepto)
      .input('prov', sql.VarChar(150), proveedor)
      .input('fecha', sql.Date, fecha)
      .input('moneda', sql.VarChar(10), moneda)
      .input('tasa', sql.Decimal(10, 4), tasa)
      .input('monto', sql.Decimal(12, 2), monto)
      .input('montoLocal', sql.Decimal(12, 2), montoLocal)
      .input('estado', sql.VarChar(50), estadoDb)
      .input('nomArch', sql.VarChar(255), nomArch)
      .input('mime', sql.VarChar(100), mimeType)
      .input('obs', sql.VarChar(255), body.observacion || body.notes || null)
      .input('contenido', sql.VarBinary(sql.MAX), contenido);
    reqIns.timeout = 60000;

    const ins = await reqIns.query(`
        INSERT INTO DocumentoCostoFlete (
          id_embarque, codigo_documento, numero_documento, tipo_documento, concepto,
          proveedor_servicio, fecha_documento, moneda, tasa_cambio, monto, monto_local,
          estado, nombre_archivo, mime_type, contenido_archivo, observacion
        )
        OUTPUT INSERTED.id_documento_flete
        VALUES (
          @idEmb, @codigo, @numero, @tipo, @concepto, @prov, @fecha,
          @moneda, @tasa, @monto, @montoLocal, @estado, @nomArch, @mime,
          @contenido, @obs
        )
      `);

    const newId = ins.recordset[0].id_documento_flete;
    const fetched = await pool.request().input('id', sql.Int, newId).query(`
      SELECT ${DOCUMENTO_FLETE_SELECT}, e.codigo_embarque
      FROM DocumentoCostoFlete dcf
      INNER JOIN Embarque e ON e.id_embarque = dcf.id_embarque
      WHERE dcf.id_documento_flete = @id
    `);
    const doc = mapDocumentoFleteRow(fetched.recordset[0], emb.recordset[0].codigo_embarque);
    return sendSuccess(res, doc, { message: `Documento ${codigo} registrado.` });
  } catch (err) {
    console.error('[importaciones] create documento flete', err);
    return fail(res, 500, err.message || 'Error de base de datos');
  }
});

/** PATCH /documentos-flete/:id */
router.patch('/documentos-flete/:id', acceptFleteFile, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const body = req.body ?? {};
    const pool = await getConnection();
    await ensureDocumentoCostoFlete(pool);

    const current = await pool.request().input('id', sql.Int, id).query(`
      SELECT ${DOCUMENTO_FLETE_SELECT}, e.codigo_embarque
      FROM DocumentoCostoFlete dcf
      INNER JOIN Embarque e ON e.id_embarque = dcf.id_embarque
      WHERE dcf.id_documento_flete = @id
    `);
    const row = current.recordset[0];
    if (!row) return fail(res, 404, 'Documento no encontrado');

    const estadoDb = body.status || body.estado
      ? mapDocumentoEstadoToDb(body.status ?? body.estado)
      : row.estado;
    const contenido = resolveContenidoArchivo(req);

    const reqUpd = pool
      .request()
      .input('id', sql.Int, id)
      .input('numero', sql.VarChar(100), body.numeroDocumento ?? body.numero_documento ?? row.numero_documento)
      .input('tipo', sql.VarChar(50), body.tipoDocumento ?? body.tipo_documento ?? row.tipo_documento)
      .input('concepto', sql.VarChar(150), body.concepto ? resolveConcepto(body) : row.concepto)
      .input('prov', sql.VarChar(150), body.proveedorServicio ?? body.proveedor_servicio ?? row.proveedor_servicio)
      .input('fecha', sql.Date, body.fechaDocumento ?? body.fecha_documento ?? row.fecha_documento)
      .input('moneda', sql.VarChar(10), body.moneda ?? row.moneda)
      .input('tasa', sql.Decimal(10, 4), body.tasaCambio ?? body.tasa_cambio ?? row.tasa_cambio ?? 1)
      .input('monto', sql.Decimal(12, 2), body.monto ?? row.monto)
      .input('montoLocal', sql.Decimal(12, 2), body.montoLocal ?? body.monto_local ?? row.monto_local)
      .input('estado', sql.VarChar(50), estadoDb)
      .input('nomArch', sql.VarChar(255), req.file?.originalname ?? body.nombreArchivo ?? body.nombre_archivo ?? row.nombre_archivo)
      .input(
        'mime',
        sql.VarChar(100),
        req.file?.mimetype ?? body.mimeType ?? body.mime_type ?? row.mime_type ?? (contenido ? 'application/pdf' : null),
      )
      .input('obs', sql.VarChar(255), body.observacion ?? body.notes ?? row.observacion);

    let updateSql = `
        UPDATE DocumentoCostoFlete SET
          numero_documento = @numero,
          tipo_documento = @tipo,
          concepto = @concepto,
          proveedor_servicio = @prov,
          fecha_documento = @fecha,
          moneda = @moneda,
          tasa_cambio = @tasa,
          monto = @monto,
          monto_local = @montoLocal,
          estado = @estado,
          nombre_archivo = @nomArch,
          mime_type = @mime,
          observacion = @obs
    `;
    if (contenido) {
      reqUpd.input('contenido', sql.VarBinary(sql.MAX), contenido);
      reqUpd.timeout = 60000;
      updateSql += `, contenido_archivo = @contenido`;
    }
    updateSql += ` WHERE id_documento_flete = @id`;

    await reqUpd.query(updateSql);

    const updated = await pool.request().input('id', sql.Int, id).query(`
      SELECT ${DOCUMENTO_FLETE_SELECT}, e.codigo_embarque
      FROM DocumentoCostoFlete dcf
      INNER JOIN Embarque e ON e.id_embarque = dcf.id_embarque
      WHERE dcf.id_documento_flete = @id
    `);
    return sendSuccess(res, mapDocumentoFleteRow(updated.recordset[0], row.codigo_embarque), {
      message: 'Documento actualizado.',
    });
  } catch (err) {
    console.error('[importaciones] patch documento flete', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** GET /documentos-flete/:id/archivo — descarga archivo desde BD */
router.get('/documentos-flete/:id/archivo', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const pool = await getConnection();
    const result = await pool.request().input('id', sql.Int, id).query(`
      SELECT nombre_archivo, mime_type, contenido_archivo
      FROM DocumentoCostoFlete
      WHERE id_documento_flete = @id AND estado <> 'Anulado'
    `);
    const row = result.recordset[0];
    if (!row?.contenido_archivo) return fail(res, 404, 'Archivo no encontrado en base de datos');

    const buffer = Buffer.isBuffer(row.contenido_archivo)
      ? row.contenido_archivo
      : Buffer.from(row.contenido_archivo);

    res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${String(row.nombre_archivo || 'documento-flete').replace(/"/g, '')}"`,
    );
    return res.send(buffer);
  } catch (err) {
    console.error('[importaciones] get archivo documento flete', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

/** DELETE /documentos-flete/:id — anula documento */
router.delete('/documentos-flete/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id inválido');
    const pool = await getConnection();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`UPDATE DocumentoCostoFlete SET estado = 'Anulado' WHERE id_documento_flete = @id`);
    return sendSuccess(res, { id }, { message: 'Documento anulado.' });
  } catch (err) {
    console.error('[importaciones] delete documento flete', err);
    return fail(res, 500, 'Error de base de datos');
  }
});

module.exports = router;
