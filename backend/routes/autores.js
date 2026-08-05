/**
 * API Autores — adaptada exclusivamente a public/scriptdb
 * Tablas: Autor, Producto (id_autor)
 * Contrato FE: id, name, firstName, lastName, nationality, productCount
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

const SELECT_AUTOR = `
  SELECT
    a.id_autor,
    a.nombre,
    a.apellido,
    a.nacionalidad,
    a.fecha_nacimiento,
    a.biografia,
    (
      SELECT COUNT(*)
      FROM Producto p
      WHERE p.id_autor = a.id_autor
    ) AS product_count
  FROM Autor a
`;

function mapAutor(row) {
  const firstName = String(row.nombre || '').trim();
  const lastName = String(row.apellido || '').trim();
  const name = [firstName, lastName].filter((x) => x && x !== '-').join(' ').trim();
  return {
    id: String(row.id_autor),
    name: name || firstName || lastName,
    firstName,
    lastName,
    nationality: row.nacionalidad || '',
    birthDate: row.fecha_nacimiento
      ? new Date(row.fecha_nacimiento).toISOString().slice(0, 10)
      : '',
    biography: row.biografia || '',
    productCount: Number(row.product_count) || 0,
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
    .query(`${SELECT_AUTOR} WHERE a.id_autor = @id`);
  return result.recordset[0] || null;
}

/** GET /api/autores — listar / buscar */
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const q = String(req.query.q || req.query.texto || req.query.search || '').trim();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 200, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;

    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += ` AND (a.nombre LIKE @q OR a.apellido LIKE @q OR a.nacionalidad LIKE @q)`;
    }
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countResult = await pool
      .request()
      .input('q', sql.NVarChar(200), q ? `%${q}%` : null)
      .query(`
        SELECT COUNT(*) AS total FROM Autor a
        WHERE (@q IS NULL OR a.nombre LIKE @q OR a.apellido LIKE @q OR a.nacionalidad LIKE @q)
      `);

    const result = await request.query(`
      ${SELECT_AUTOR}
      ${where}
      ORDER BY a.apellido, a.nombre
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      success: true,
      data: result.recordset.map(mapAutor),
      total: countResult.recordset[0].total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[autores] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/autores/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Autor no encontrado');
    return res.json(mapAutor(row));
  } catch (err) {
    console.error('[autores] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/autores */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const nombre = String(body.firstName ?? body.nombre ?? '').trim();
    const apellido = String(body.lastName ?? body.apellido ?? '-').trim() || '-';
    if (!nombre) return fail(res, 400, 'El nombre del autor es obligatorio.');

    const dup = await pool
      .request()
      .input('n', sql.VarChar(100), nombre)
      .input('a', sql.VarChar(100), apellido)
      .query(`
        SELECT TOP 1 id_autor FROM Autor
        WHERE nombre = @n AND apellido = @a
      `);
    if (dup.recordset[0]) {
      const row = await fetchById(pool, dup.recordset[0].id_autor);
      return res.status(200).json(mapAutor(row));
    }

    const result = await pool
      .request()
      .input('n', sql.VarChar(100), nombre)
      .input('a', sql.VarChar(100), apellido)
      .input('nac', sql.VarChar(50), body.nationality ?? body.nacionalidad ?? null)
      .input('bio', sql.Text, body.biography ?? body.biografia ?? null)
      .query(`
        INSERT INTO Autor (nombre, apellido, nacionalidad, biografia)
        OUTPUT INSERTED.id_autor
        VALUES (@n, @a, @nac, @bio)
      `);

    const row = await fetchById(pool, result.recordset[0].id_autor);
    return res.status(201).json(mapAutor(row));
  } catch (err) {
    console.error('[autores] create', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
