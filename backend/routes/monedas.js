/**
 * API Monedas — tabla Moneda (SQL Server)
 * Contrato FE: id, code, name, symbol, isDefault, status
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

const SELECT_MONEDA = `
  SELECT id_moneda, codigo_iso, simbolo, nombre, es_predeterminada, estado
  FROM Moneda
`;

function mapEstadoToFe(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'activa' || e === 'activo' || e === 'active') return 'active';
  return 'inactive';
}

function mapEstadoToDb(status) {
  const e = String(status || '').trim().toLowerCase();
  if (e === 'active' || e === 'activo' || e === 'activa') return 'Activa';
  return 'Inactiva';
}

function mapMoneda(row) {
  return {
    id: String(row.id_moneda),
    code: String(row.codigo_iso || '').trim(),
    name: row.nombre || '',
    symbol: row.simbolo || '',
    isDefault: Boolean(row.es_predeterminada),
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
    .query(`${SELECT_MONEDA} WHERE id_moneda = @id`);
  return result.recordset[0] || null;
}

async function countReferencias(pool, code) {
  const c = String(code || '').trim().toUpperCase();
  const result = await pool
    .request()
    .input('code', sql.VarChar(10), c)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM Pais WHERE UPPER(LTRIM(RTRIM(moneda))) = @code) AS n_pais,
        (SELECT COUNT(*) FROM Proveedor WHERE UPPER(LTRIM(RTRIM(moneda_preferida))) = @code) AS n_prov
    `);
  const row = result.recordset[0] || {};
  return Number(row.n_pais || 0) + Number(row.n_prov || 0);
}

/** GET /api/monedas */
router.get('/', async (_req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      ${SELECT_MONEDA}
      ORDER BY es_predeterminada DESC, codigo_iso ASC
    `);
    return res.json(result.recordset.map(mapMoneda));
  } catch (err) {
    console.error('[monedas] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/monedas/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Moneda no encontrada');
    return res.json(mapMoneda(row));
  } catch (err) {
    console.error('[monedas] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/monedas */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const code = String(body.code || body.codigo || body.codigo_iso || '')
      .trim()
      .toUpperCase();
    const name = String(body.name || body.nombre || '').trim();
    const symbol = String(body.symbol || body.simbolo || '').trim();
    const status = mapEstadoToDb(body.status || body.estado || 'active');
    const isDefault = Boolean(body.isDefault ?? body.es_predeterminada);

    if (!/^[A-Z]{3}$/.test(code)) {
      return fail(res, 400, 'El código debe ser ISO de 3 letras (ej. DOP).');
    }
    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!symbol) return fail(res, 400, 'El símbolo es obligatorio.');

    const dup = await pool
      .request()
      .input('code', sql.Char(3), code)
      .query(`SELECT TOP 1 id_moneda FROM Moneda WHERE codigo_iso = @code`);
    if (dup.recordset[0]) {
      return fail(res, 409, 'Ya existe una moneda con ese código ISO.');
    }

    if (isDefault) {
      await pool.request().query(`UPDATE Moneda SET es_predeterminada = 0`);
    }

    const inserted = await pool
      .request()
      .input('code', sql.Char(3), code)
      .input('symbol', sql.VarChar(10), symbol)
      .input('name', sql.VarChar(100), name)
      .input('status', sql.VarChar(20), status)
      .input('isDefault', sql.Bit, isDefault ? 1 : 0)
      .query(`
        INSERT INTO Moneda (codigo_iso, simbolo, nombre, estado, es_predeterminada)
        OUTPUT INSERTED.id_moneda
        VALUES (@code, @symbol, @name, @status, @isDefault)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_moneda);
    return res.status(201).json(mapMoneda(row));
  } catch (err) {
    console.error('[monedas] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe una moneda con ese código ISO.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PUT /api/monedas/:id */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Moneda no encontrada');

    const body = req.body || {};
    const code = String(body.code || body.codigo || existing.codigo_iso).trim().toUpperCase();
    const name = String(body.name || body.nombre || existing.nombre).trim();
    const symbol = String(body.symbol || body.simbolo || existing.simbolo).trim();
    const status = mapEstadoToDb(body.status ?? body.estado ?? existing.estado);
    const isDefault =
      body.isDefault != null || body.es_predeterminada != null
        ? Boolean(body.isDefault ?? body.es_predeterminada)
        : Boolean(existing.es_predeterminada);

    if (!/^[A-Z]{3}$/.test(code)) {
      return fail(res, 400, 'El código debe ser ISO de 3 letras (ej. DOP).');
    }
    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!symbol) return fail(res, 400, 'El símbolo es obligatorio.');

    const dup = await pool
      .request()
      .input('code', sql.Char(3), code)
      .input('id', sql.Int, Number(req.params.id))
      .query(`
        SELECT TOP 1 id_moneda FROM Moneda
        WHERE codigo_iso = @code AND id_moneda <> @id
      `);
    if (dup.recordset[0]) {
      return fail(res, 409, 'Ya existe otra moneda con ese código ISO.');
    }

    if (isDefault) {
      await pool.request().query(`UPDATE Moneda SET es_predeterminada = 0`);
    }

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('code', sql.Char(3), code)
      .input('symbol', sql.VarChar(10), symbol)
      .input('name', sql.VarChar(100), name)
      .input('status', sql.VarChar(20), status)
      .input('isDefault', sql.Bit, isDefault ? 1 : 0)
      .query(`
        UPDATE Moneda
        SET codigo_iso = @code,
            simbolo = @symbol,
            nombre = @name,
            estado = @status,
            es_predeterminada = @isDefault
        WHERE id_moneda = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapMoneda(row));
  } catch (err) {
    console.error('[monedas] update', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PATCH /api/monedas/:id/estado */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Moneda no encontrada');

    const status = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('status', sql.VarChar(20), status)
      .query(`UPDATE Moneda SET estado = @status WHERE id_moneda = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapMoneda(row));
  } catch (err) {
    console.error('[monedas] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** DELETE /api/monedas/:id */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Moneda no encontrada');

    if (existing.es_predeterminada) {
      return fail(res, 409, 'No se puede eliminar la moneda predeterminada.');
    }

    const refs = await countReferencias(pool, existing.codigo_iso);
    if (refs > 0) {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('status', sql.VarChar(20), 'Inactiva')
        .query(`UPDATE Moneda SET estado = @status WHERE id_moneda = @id`);
      const row = await fetchById(pool, req.params.id);
      return res.json({ ok: true, softDeleted: true, ...mapMoneda(row) });
    }

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query(`DELETE FROM Moneda WHERE id_moneda = @id`);

    return res.json({ ok: true, deleted: true, id: String(req.params.id) });
  } catch (err) {
    console.error('[monedas] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
