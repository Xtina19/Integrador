/**
 * API Categorías — adaptada exclusivamente a public/scriptdb
 * Tabla: CategoriaProducto
 * Contrato FE: id, code, name, description, status, productCount
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

const SELECT_CATEGORIA = `
  SELECT
    c.id_categoria,
    c.nombre_categoria,
    c.descripcion,
    c.estado,
    (
      SELECT COUNT(*)
      FROM Producto p
      WHERE p.id_categoria = c.id_categoria
    ) AS product_count
  FROM CategoriaProducto c
`;

function mapEstadoToFe(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'activo' || e === 'active') return 'active';
  return 'inactive';
}

function mapEstadoToDb(status) {
  const e = String(status || '').trim().toLowerCase();
  if (e === 'active' || e === 'activo') return 'Activo';
  return 'Inactivo';
}

/** Código derivado del id_categoria (no se persiste; no existe columna code). */
function codeFromId(id) {
  return `CAT${String(id).padStart(6, '0')}`;
}

function mapCategoria(row) {
  return {
    id: String(row.id_categoria),
    code: codeFromId(row.id_categoria),
    name: row.nombre_categoria || '',
    description: row.descripcion || '',
    status: mapEstadoToFe(row.estado),
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
    .query(`${SELECT_CATEGORIA} WHERE c.id_categoria = @id`);
  return result.recordset[0] || null;
}

async function countProductos(pool, idCategoria) {
  const result = await pool
    .request()
    .input('id', sql.Int, Number(idCategoria))
    .query(`SELECT COUNT(*) AS n FROM Producto WHERE id_categoria = @id`);
  return Number(result.recordset[0]?.n) || 0;
}

/** GET /api/categorias — listar / buscar */
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.texto || req.query.search || '').trim();

    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          c.nombre_categoria LIKE @q
          OR ISNULL(c.descripcion, '') LIKE @q
        )`;
    }
    if (req.query.status || req.query.estado) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
      where += ` AND c.estado = @estado`;
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countResult = await pool
      .request()
      .input('q', sql.NVarChar(200), q ? `%${q}%` : null)
      .input(
        'estado',
        sql.VarChar(20),
        req.query.status || req.query.estado
          ? mapEstadoToDb(req.query.status || req.query.estado)
          : null,
      )
      .query(`
        SELECT COUNT(*) AS total
        FROM CategoriaProducto c
        WHERE 1=1
          AND (@q IS NULL OR (
            c.nombre_categoria LIKE @q OR ISNULL(c.descripcion, '') LIKE @q
          ))
          AND (@estado IS NULL OR c.estado = @estado)
      `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_CATEGORIA}
      ${where}
      ORDER BY c.nombre_categoria
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const data = result.recordset.map(mapCategoria);
    return res.json({ success: true, data, total, page, pageSize });
  } catch (err) {
    console.error('[categorias] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/categorias/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Categoría no encontrada');
    return res.json(mapCategoria(row));
  } catch (err) {
    console.error('[categorias] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/categorias */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const name = String(body.name || body.nombre || body.nombre_categoria || '').trim();
    const description = String(body.description || body.descripcion || '').trim();
    const estado = mapEstadoToDb(body.status || body.estado || 'active');

    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!description) return fail(res, 400, 'La descripción es obligatoria.');

    const inserted = await pool
      .request()
      .input('nombre', sql.VarChar(100), name)
      .input('descripcion', sql.VarChar(255), description)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO CategoriaProducto (nombre_categoria, descripcion, estado)
        OUTPUT INSERTED.id_categoria
        VALUES (@nombre, @descripcion, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_categoria);
    return res.status(201).json(mapCategoria(row));
  } catch (err) {
    console.error('[categorias] create', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PUT /api/categorias/:id */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Categoría no encontrada');

    const body = req.body || {};
    const name =
      body.name != null || body.nombre != null || body.nombre_categoria != null
        ? String(body.name || body.nombre || body.nombre_categoria || '').trim()
        : existing.nombre_categoria;
    const description =
      body.description != null || body.descripcion != null
        ? String(body.description || body.descripcion || '').trim()
        : existing.descripcion || '';
    const estado =
      body.status != null || body.estado != null
        ? mapEstadoToDb(body.status || body.estado)
        : existing.estado;

    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!description) return fail(res, 400, 'La descripción es obligatoria.');

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('nombre', sql.VarChar(100), name)
      .input('descripcion', sql.VarChar(255), description)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE CategoriaProducto
        SET nombre_categoria = @nombre,
            descripcion = @descripcion,
            estado = @estado
        WHERE id_categoria = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapCategoria(row));
  } catch (err) {
    console.error('[categorias] update', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PATCH /api/categorias/:id/estado */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Categoría no encontrada');

    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE CategoriaProducto SET estado = @estado WHERE id_categoria = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapCategoria(row));
  } catch (err) {
    console.error('[categorias] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * DELETE /api/categorias/:id
 * Borrado físico; si hay Productos asociados → soft delete (Inactivo).
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Categoría no encontrada');

    const linked = await countProductos(pool, req.params.id);
    if (linked > 0) {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('estado', sql.VarChar(20), 'Inactivo')
        .query(`UPDATE CategoriaProducto SET estado = @estado WHERE id_categoria = @id`);
      const row = await fetchById(pool, req.params.id);
      return res.json({
        success: true,
        data: { ...mapCategoria(row), deleted: false, softDeleted: true },
      });
    }

    try {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .query(`DELETE FROM CategoriaProducto WHERE id_categoria = @id`);
      return res.json({
        success: true,
        data: { id: String(req.params.id), deleted: true },
      });
    } catch (fkErr) {
      if (fkErr.number === 547) {
        await pool
          .request()
          .input('id', sql.Int, Number(req.params.id))
          .input('estado', sql.VarChar(20), 'Inactivo')
          .query(`UPDATE CategoriaProducto SET estado = @estado WHERE id_categoria = @id`);
        const row = await fetchById(pool, req.params.id);
        return res.json({
          success: true,
          data: { ...mapCategoria(row), deleted: false, softDeleted: true },
        });
      }
      throw fkErr;
    }
  } catch (err) {
    console.error('[categorias] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
