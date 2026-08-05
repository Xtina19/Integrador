/**
 * API Tasas de Cambio — tabla TasaCambio + Moneda (SQL Server)
 * Contrato FE: id, fromCurrency, toCurrency, value, date, updatedBy, notes, status
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

const SELECT_TASA = `
  SELECT
    t.id_tasa_cambio,
    mo.codigo_iso AS moneda_origen,
    md.codigo_iso AS moneda_destino,
    t.valor,
    t.fecha_tasa,
    t.notas,
    t.actualizado_por,
    t.estado
  FROM TasaCambio t
  INNER JOIN Moneda mo ON mo.id_moneda = t.id_moneda_origen
  INNER JOIN Moneda md ON md.id_moneda = t.id_moneda_destino
`;

function mapEstadoToFe(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'activo' || e === 'active' || e === 'activa') return 'active';
  return 'inactive';
}

function mapEstadoToDb(status) {
  const e = String(status || '').trim().toLowerCase();
  if (e === 'active' || e === 'activo' || e === 'activa') return 'Activa';
  return 'Inactiva';
}

function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function mapTasa(row) {
  return {
    id: String(row.id_tasa_cambio),
    fromCurrency: String(row.moneda_origen || '').trim(),
    toCurrency: String(row.moneda_destino || '').trim(),
    value: Number(row.valor) || 0,
    date: formatDate(row.fecha_tasa),
    updatedBy: row.actualizado_por || 'Sistema',
    notes: row.notas || '',
    status: mapEstadoToFe(row.estado),
  };
}

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION', message },
  });
}

async function fetchById(pool, id) {
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query(`${SELECT_TASA} WHERE t.id_tasa_cambio = @id`);
  return result.recordset[0] || null;
}

async function resolveMonedaId(pool, codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  const result = await pool
    .request()
    .input('c', sql.Char(3), c)
    .query(`
      SELECT id_moneda FROM Moneda
      WHERE codigo_iso = @c AND estado = 'Activa'
    `);
  return result.recordset[0]?.id_moneda || null;
}

async function validateMonedaCodes(pool, fromCurrency, toCurrency) {
  const from = String(fromCurrency || '').trim().toUpperCase();
  const to = String(toCurrency || '').trim().toUpperCase();

  if (!from || !to) {
    return { ok: false, message: 'Las monedas origen y destino son obligatorias.' };
  }
  if (from === to) {
    return { ok: false, message: 'Las monedas origen y destino deben ser diferentes.' };
  }

  const idOrigen = await resolveMonedaId(pool, from);
  const idDestino = await resolveMonedaId(pool, to);
  if (!idOrigen) {
    return { ok: false, message: `Moneda origen "${from}" no existe en el catálogo.` };
  }
  if (!idDestino) {
    return { ok: false, message: `Moneda destino "${to}" no existe en el catálogo.` };
  }

  return { ok: true, from, to, idOrigen, idDestino };
}

function readPayload(body) {
  return {
    fromCurrency: String(body.fromCurrency || body.origen || body.moneda_origen || '')
      .trim()
      .toUpperCase(),
    toCurrency: String(body.toCurrency || body.destino || body.moneda_destino || '')
      .trim()
      .toUpperCase(),
    value: Number(body.value ?? body.valor ?? body.rate ?? body.tasa),
    date: String(body.date || body.fecha || body.fecha_tasa || '').trim(),
    notes: String(body.notes || body.notas || '').trim(),
    updatedBy: String(body.updatedBy || body.actualizado_por || 'Sistema').trim() || 'Sistema',
    status:
      body.status != null || body.estado != null
        ? mapEstadoToDb(body.status || body.estado)
        : 'Activa',
  };
}

/** GET /api/tasas-cambio */
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.search || '').trim();

    const request = pool.request();
    let where = ' WHERE 1=1 ';

    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          mo.codigo_iso LIKE @q
          OR md.codigo_iso LIKE @q
          OR ISNULL(t.notas, '') LIKE @q
          OR ISNULL(t.actualizado_por, '') LIKE @q
        )`;
    }

    if (req.query.status || req.query.estado) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
      where += ' AND t.estado = @estado ';
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countReq = pool.request();
    if (q) countReq.input('q', sql.NVarChar(200), `%${q}%`);
    if (req.query.status || req.query.estado) {
      countReq.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
    }

    const countResult = await countReq.query(`
      SELECT COUNT(*) AS total
      FROM TasaCambio t
      INNER JOIN Moneda mo ON mo.id_moneda = t.id_moneda_origen
      INNER JOIN Moneda md ON md.id_moneda = t.id_moneda_destino
      WHERE 1=1
        ${q ? `AND (
          mo.codigo_iso LIKE @q OR md.codigo_iso LIKE @q
          OR ISNULL(t.notas, '') LIKE @q OR ISNULL(t.actualizado_por, '') LIKE @q
        )` : ''}
        ${req.query.status || req.query.estado ? 'AND t.estado = @estado' : ''}
    `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_TASA}
      ${where}
      ORDER BY t.fecha_tasa DESC, t.id_tasa_cambio DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      success: true,
      data: result.recordset.map(mapTasa),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[tasas-cambio] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/tasas-cambio/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Tasa de cambio no encontrada');
    return res.json(mapTasa(row));
  } catch (err) {
    console.error('[tasas-cambio] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/tasas-cambio */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const payload = readPayload(req.body || {});

    if (!(payload.value > 0)) return fail(res, 400, 'El valor de la tasa debe ser mayor que cero.');
    if (!payload.date) return fail(res, 400, 'La fecha es obligatoria.');

    const monedas = await validateMonedaCodes(pool, payload.fromCurrency, payload.toCurrency);
    if (!monedas.ok) return fail(res, 400, monedas.message);

    const inserted = await pool
      .request()
      .input('o', sql.Int, monedas.idOrigen)
      .input('d', sql.Int, monedas.idDestino)
      .input('valor', sql.Decimal(18, 6), payload.value)
      .input('fecha', sql.Date, payload.date)
      .input('notas', sql.VarChar(255), payload.notes || null)
      .input('por', sql.VarChar(100), payload.updatedBy)
      .input('estado', sql.VarChar(20), payload.status)
      .query(`
        INSERT INTO TasaCambio (
          id_moneda_origen, id_moneda_destino, valor, fecha_tasa, notas, actualizado_por, estado
        )
        OUTPUT INSERTED.id_tasa_cambio
        VALUES (@o, @d, @valor, @fecha, @notas, @por, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_tasa_cambio);
    return res.status(201).json(mapTasa(row));
  } catch (err) {
    console.error('[tasas-cambio] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe una tasa para ese par de monedas en esa fecha.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PUT /api/tasas-cambio/:id */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Tasa de cambio no encontrada');

    const payload = readPayload(req.body || {});
    const fromCurrency = payload.fromCurrency || existing.moneda_origen;
    const toCurrency = payload.toCurrency || existing.moneda_destino;
    const value =
      Number.isFinite(payload.value) && payload.value > 0
        ? payload.value
        : Number(existing.valor);
    const date = payload.date || formatDate(existing.fecha_tasa);
    const notes =
      req.body?.notes != null || req.body?.notas != null ? payload.notes : existing.notas || '';
    const updatedBy = payload.updatedBy || existing.actualizado_por || 'Sistema';
    const status = payload.status || existing.estado || 'Activa';

    if (!(value > 0)) return fail(res, 400, 'El valor de la tasa debe ser mayor que cero.');
    if (!date) return fail(res, 400, 'La fecha es obligatoria.');

    const monedas = await validateMonedaCodes(pool, fromCurrency, toCurrency);
    if (!monedas.ok) return fail(res, 400, monedas.message);

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('o', sql.Int, monedas.idOrigen)
      .input('d', sql.Int, monedas.idDestino)
      .input('valor', sql.Decimal(18, 6), value)
      .input('fecha', sql.Date, date)
      .input('notas', sql.VarChar(255), notes || null)
      .input('por', sql.VarChar(100), updatedBy)
      .input('estado', sql.VarChar(20), status)
      .query(`
        UPDATE TasaCambio
        SET id_moneda_origen = @o,
            id_moneda_destino = @d,
            valor = @valor,
            fecha_tasa = @fecha,
            notas = @notas,
            actualizado_por = @por,
            estado = @estado
        WHERE id_tasa_cambio = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapTasa(row));
  } catch (err) {
    console.error('[tasas-cambio] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe otra tasa para ese par de monedas en esa fecha.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PATCH /api/tasas-cambio/:id/estado */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Tasa de cambio no encontrada');

    const status = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), status)
      .query(`UPDATE TasaCambio SET estado = @estado WHERE id_tasa_cambio = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapTasa(row));
  } catch (err) {
    console.error('[tasas-cambio] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** DELETE /api/tasas-cambio/:id — eliminación lógica */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Tasa de cambio no encontrada');

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), 'Inactiva')
      .query(`UPDATE TasaCambio SET estado = @estado WHERE id_tasa_cambio = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json({
      success: true,
      data: { ...mapTasa(row), deleted: false, softDeleted: true },
    });
  } catch (err) {
    console.error('[tasas-cambio] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
