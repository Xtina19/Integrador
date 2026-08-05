/**
 * API Roles — tabla Rol (SQL Server) + conteo Usuario.rol
 * Contrato FE: id, code, name, description, status, users
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { mapRoleToApi, mapEstadoToDb } = require('../lib/rolesSemilla');

const SELECT_ROL = `
  SELECT
    r.id_rol,
    r.codigo,
    r.slug,
    r.nombre,
    r.descripcion,
    r.estado,
    (
      SELECT COUNT(*)
      FROM Usuario u
      WHERE LOWER(LTRIM(RTRIM(u.rol))) = r.slug
    ) AS users
  FROM Rol r
`;

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION', message },
  });
}

async function fetchById(pool, id) {
  const slug = String(id || '').trim().toLowerCase();
  const result = await pool
    .request()
    .input('slug', sql.VarChar(30), slug)
    .input('codigo', sql.VarChar(30), slug.toUpperCase())
    .query(`
      ${SELECT_ROL}
      WHERE r.slug = @slug OR UPPER(r.codigo) = @codigo
    `);
  return result.recordset[0] || null;
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
          r.codigo LIKE @q
          OR r.slug LIKE @q
          OR r.nombre LIKE @q
          OR ISNULL(r.descripcion, '') LIKE @q
        )`;
    }

    if (req.query.status || req.query.estado) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
      where += ' AND r.estado = @estado ';
    } else {
      where += " AND r.estado = 'Activo' ";
    }

    const result = await request.query(`
      ${SELECT_ROL}
      ${where}
      ORDER BY r.nombre ASC
    `);

    const items = result.recordset.map((row) => mapRoleToApi(row));
    return res.json({ success: true, data: items, total: items.length });
  } catch (err) {
    console.error('[roles] list', err);
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
        error: { message: 'Rol no encontrado' },
      });
    }
    return res.json(mapRoleToApi(row));
  } catch (err) {
    console.error('[roles] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const codigo = String(body.code || body.codigo || '').trim().toUpperCase();
    const nombre = String(body.name || body.nombre || '').trim();
    const descripcion = String(body.description || body.descripcion || '').trim();
    const estado = mapEstadoToDb(body.status || body.estado || 'active');
    const slug = codigo.toLowerCase();

    if (!codigo) return fail(res, 400, 'El código es obligatorio.');
    if (!nombre) return fail(res, 400, 'El nombre es obligatorio.');

    const inserted = await pool
      .request()
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.VarChar(100), nombre)
      .input('descripcion', sql.VarChar(255), descripcion || null)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO Rol (codigo, slug, nombre, descripcion, estado)
        OUTPUT INSERTED.id_rol
        VALUES (@codigo, @slug, @nombre, @descripcion, @estado)
      `);

    const row = await fetchById(pool, slug);
    return res.status(201).json(mapRoleToApi(row));
  } catch (err) {
    console.error('[roles] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe un rol con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Rol no encontrado');

    const body = req.body || {};
    const codigo = String(body.code || body.codigo || existing.codigo).trim().toUpperCase();
    const nombre = String(body.name || body.nombre || existing.nombre).trim();
    const descripcion =
      body.description != null || body.descripcion != null
        ? String(body.description || body.descripcion || '').trim()
        : existing.descripcion || '';
    const estado = mapEstadoToDb(body.status ?? body.estado ?? existing.estado);
    const slug = codigo.toLowerCase();

    if (!codigo) return fail(res, 400, 'El código es obligatorio.');
    if (!nombre) return fail(res, 400, 'El nombre es obligatorio.');

    await pool
      .request()
      .input('id', sql.Int, existing.id_rol)
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.VarChar(100), nombre)
      .input('descripcion', sql.VarChar(255), descripcion || null)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE Rol
        SET codigo = @codigo,
            slug = @slug,
            nombre = @nombre,
            descripcion = @descripcion,
            estado = @estado
        WHERE id_rol = @id
      `);

    const row = await fetchById(pool, slug);
    return res.json(mapRoleToApi(row));
  } catch (err) {
    console.error('[roles] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe otro rol con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Rol no encontrado');

    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, existing.id_rol)
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE Rol SET estado = @estado WHERE id_rol = @id`);

    const row = await fetchById(pool, existing.slug);
    return res.json(mapRoleToApi(row));
  } catch (err) {
    console.error('[roles] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
