/**
 * API Formas de pago — tabla FormaPago (SQL Server)
 * Contrato FE: id, code, name, description, status, slug
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { mapEstadoToFe, mapEstadoToDb, mapToApi, slugFromCodigo } = require('../lib/formasPago');

const SELECT_FORMA = `
  SELECT id_forma_pago, codigo, slug, nombre, estado
  FROM FormaPago
`;

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION', message },
  });
}

async function fetchById(pool, id) {
  const num = Number(id);
  if (Number.isFinite(num)) {
    const result = await pool
      .request()
      .input('id', sql.Int, num)
      .query(`${SELECT_FORMA} WHERE id_forma_pago = @id`);
    if (result.recordset[0]) return result.recordset[0];
  }

  const slug = slugFromCodigo(id);
  const byCode = await pool
    .request()
    .input('codigo', sql.VarChar(30), String(id).trim().toUpperCase())
    .input('slug', sql.VarChar(30), slug)
    .query(`
      ${SELECT_FORMA}
      WHERE UPPER(codigo) = @codigo OR LOWER(codigo) = @slug
    `);
  return byCode.recordset[0] || null;
}

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const q = String(req.query.q || req.query.search || '').trim().toLowerCase();
    const request = pool.request();
    let where = ' WHERE 1=1 ';

    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          codigo LIKE @q
          OR nombre LIKE @q
        )`;
    }

    if (req.query.status) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status));
      where += ' AND estado = @estado ';
    } else {
      where += " AND estado = 'Activo' ";
    }

    const result = await request.query(`
      ${SELECT_FORMA}
      ${where}
      ORDER BY id_forma_pago ASC
    `);

    const items = result.recordset.map(mapToApi);
    return res.json({ success: true, data: items, total: items.length });
  } catch (err) {
    console.error('[formas-pago] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) {
      return res.status(404).json({
        success: false,
        error: { message: 'Forma de pago no encontrada' },
      });
    }
    return res.json(mapToApi(row));
  } catch (err) {
    console.error('[formas-pago] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const codigo = String(body.code || body.codigo || '').trim().toUpperCase();
    const nombre = String(body.name || body.nombre || '').trim();
    const estado = mapEstadoToDb(body.status || body.estado || 'active');

    if (!codigo) return fail(res, 400, 'El código es obligatorio.');
    if (!nombre) return fail(res, 400, 'El nombre es obligatorio.');
    if (codigo === 'NOTA_CREDITO') {
      return fail(res, 400, 'Las notas de crédito no son una forma de pago.');
    }

    const slug = slugFromCodigo(codigo);
    const inserted = await pool
      .request()
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.VarChar(100), nombre)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO FormaPago (codigo, slug, nombre, estado)
        OUTPUT INSERTED.id_forma_pago
        VALUES (@codigo, @slug, @nombre, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_forma_pago);
    return res.status(201).json(mapToApi(row));
  } catch (err) {
    console.error('[formas-pago] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe una forma de pago con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Forma de pago no encontrada');

    const body = req.body || {};
    const codigo = String(body.code || body.codigo || existing.codigo).trim().toUpperCase();
    const nombre = String(body.name || body.nombre || existing.nombre).trim();
    const estado = mapEstadoToDb(body.status ?? body.estado ?? existing.estado);

    if (!codigo) return fail(res, 400, 'El código es obligatorio.');
    if (!nombre) return fail(res, 400, 'El nombre es obligatorio.');
    if (codigo === 'NOTA_CREDITO') {
      return fail(res, 400, 'Las notas de crédito no son una forma de pago.');
    }

    const slug = slugFromCodigo(codigo);
    await pool
      .request()
      .input('id', sql.Int, existing.id_forma_pago)
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.VarChar(100), nombre)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE FormaPago
        SET codigo = @codigo, slug = @slug, nombre = @nombre, estado = @estado
        WHERE id_forma_pago = @id
      `);

    const row = await fetchById(pool, existing.id_forma_pago);
    return res.json(mapToApi(row));
  } catch (err) {
    console.error('[formas-pago] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe otra forma de pago con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Forma de pago no encontrada');

    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, existing.id_forma_pago)
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE FormaPago SET estado = @estado WHERE id_forma_pago = @id`);

    const row = await fetchById(pool, existing.id_forma_pago);
    return res.json(mapToApi(row));
  } catch (err) {
    console.error('[formas-pago] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
