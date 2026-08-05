/**
 * API Productos — adaptada exclusivamente a public/scriptdb
 * Tablas: Producto, Autor, Editorial, CategoriaProducto
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { nextCodigoFromColumn } = require('../lib/codigoAuto');

const SELECT_PRODUCTO = `
  SELECT
    p.id_producto,
    p.codigo_producto,
    p.titulo,
    p.isbn,
    p.id_autor,
    p.id_editorial,
    p.id_categoria,
    p.costo_referencia,
    p.precio,
    p.estado,
    p.fecha_registro,
    a.nombre AS autor_nombre,
    a.apellido AS autor_apellido,
    e.nombre AS editorial,
    c.nombre_categoria AS categoria
  FROM Producto p
  INNER JOIN Autor a ON p.id_autor = a.id_autor
  INNER JOIN Editorial e ON p.id_editorial = e.id_editorial
  INNER JOIN CategoriaProducto c ON p.id_categoria = c.id_categoria
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

function mapProducto(row) {
  const author = [row.autor_nombre, row.autor_apellido]
    .map((x) => String(x || '').trim())
    .filter((x) => x && x !== '-')
    .join(' ')
    .trim();
  return {
    id: String(row.id_producto),
    code: row.codigo_producto,
    isbn: row.isbn || '',
    title: row.titulo,
    author,
    authorId: String(row.id_autor),
    category: row.categoria || '',
    categoryId: String(row.id_categoria),
    publisher: row.editorial || '',
    publisherId: String(row.id_editorial),
    price: Number(row.precio) || 0,
    cost: Number(row.costo_referencia) || 0,
    currency: 'DOP',
    status: mapEstadoToFe(row.estado),
    createdAt: row.fecha_registro
      ? new Date(row.fecha_registro).toISOString()
      : undefined,
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
    .query(`${SELECT_PRODUCTO} WHERE p.id_producto = @id`);
  return result.recordset[0] || null;
}

/**
 * Siguiente codigo_producto: LIB00001, LIB00002, … (5 dígitos).
 * Toma MAX(numérico) entre códigos LIB+dígitos; nunca reutiliza eliminados.
 */
async function nextCodigoProducto(pool) {
  return nextCodigoFromColumn(pool, {
    table: 'Producto',
    column: 'codigo_producto',
    prefix: 'LIB',
    pad: 5,
  });
}

async function resolveAutorId(pool, body) {
  const rawId = body.authorId ?? body.id_autor ?? body.autorId;
  if (rawId != null && String(rawId).trim() !== '') {
    const id = Number(rawId);
    if (Number.isFinite(id) && id > 0) {
      const hit = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`SELECT TOP 1 id_autor FROM Autor WHERE id_autor = @id`);
      if (hit.recordset[0]) return hit.recordset[0].id_autor;
    }
  }

  const full = String(body.author || body.autor || '').trim();
  if (!full) return null;

  const parts = full.split(/\s+/).filter(Boolean);
  const nombre = parts[0] || 'Autor';
  const apellido = parts.slice(1).join(' ') || '-';

  const existing = await pool
    .request()
    .input('n', sql.VarChar(100), nombre)
    .input('a', sql.VarChar(100), apellido)
    .input('full', sql.VarChar(220), full)
    .query(`
      SELECT TOP 1 id_autor
      FROM Autor
      WHERE (nombre = @n AND apellido = @a)
         OR LTRIM(RTRIM(nombre + ' ' + apellido)) = @full
      ORDER BY id_autor
    `);
  if (existing.recordset[0]) return existing.recordset[0].id_autor;

  const inserted = await pool
    .request()
    .input('n', sql.VarChar(100), nombre)
    .input('a', sql.VarChar(100), apellido)
    .query(`
      INSERT INTO Autor (nombre, apellido)
      OUTPUT INSERTED.id_autor
      VALUES (@n, @a)
    `);
  return inserted.recordset[0].id_autor;
}

async function resolveCategoriaId(pool, body) {
  const raw = body.categoryId ?? body.id_categoria ?? body.categoriaId;
  if (raw == null || String(raw).trim() === '') return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  const hit = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT TOP 1 id_categoria FROM CategoriaProducto WHERE id_categoria = @id`);
  return hit.recordset[0]?.id_categoria ?? null;
}

async function resolveEditorialId(pool, body) {
  const raw = body.publisherId ?? body.id_editorial ?? body.editorialId;
  if (raw == null || String(raw).trim() === '') return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  const hit = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT TOP 1 id_editorial FROM Editorial WHERE id_editorial = @id`);
  return hit.recordset[0]?.id_editorial ?? null;
}

/** GET /api/productos — listar / buscar */
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
          p.codigo_producto LIKE @q
          OR p.isbn LIKE @q
          OR p.titulo LIKE @q
          OR a.nombre LIKE @q
          OR a.apellido LIKE @q
          OR e.nombre LIKE @q
          OR c.nombre_categoria LIKE @q
        )`;
    }
    if (req.query.status || req.query.estado) {
      const st = mapEstadoToDb(req.query.status || req.query.estado);
      request.input('estado', sql.VarChar(20), st);
      where += ` AND p.estado = @estado`;
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
        FROM Producto p
        INNER JOIN Autor a ON p.id_autor = a.id_autor
        INNER JOIN Editorial e ON p.id_editorial = e.id_editorial
        INNER JOIN CategoriaProducto c ON p.id_categoria = c.id_categoria
        WHERE 1=1
          AND (@q IS NULL OR (
            p.codigo_producto LIKE @q OR p.isbn LIKE @q OR p.titulo LIKE @q
            OR a.nombre LIKE @q OR a.apellido LIKE @q OR e.nombre LIKE @q
            OR c.nombre_categoria LIKE @q
          ))
          AND (@estado IS NULL OR p.estado = @estado)
      `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_PRODUCTO}
      ${where}
      ORDER BY p.titulo
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const data = result.recordset.map(mapProducto);
    return res.json({ success: true, data, total, page, pageSize });
  } catch (err) {
    console.error('[productos] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/productos/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Producto no encontrado');
    return res.json(mapProducto(row));
  } catch (err) {
    console.error('[productos] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/productos */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const title = String(body.title || body.titulo || '').trim();
    const isbn = String(body.isbn || '').trim();
    const price = Number(body.price ?? body.precio);

    if (!title) return fail(res, 400, 'El título es obligatorio.');
    if (!isbn) return fail(res, 400, 'El ISBN es obligatorio.');
    if (!(price >= 0)) return fail(res, 400, 'El precio es obligatorio.');

    const code = await nextCodigoProducto(pool);

    const idCategoria = await resolveCategoriaId(pool, body);
    const idEditorial = await resolveEditorialId(pool, body);
    const idAutor = await resolveAutorId(pool, body);
    if (!idCategoria) return fail(res, 400, 'Categoría inválida (id_categoria requerido).');
    if (!idEditorial) return fail(res, 400, 'Editorial inválida (id_editorial requerido).');
    if (!idAutor) return fail(res, 400, 'Autor inválido o no indicado.');

    const estado = mapEstadoToDb(body.status || body.estado || 'active');

    const inserted = await pool
      .request()
      .input('codigo', sql.VarChar(50), code)
      .input('titulo', sql.VarChar(200), title)
      .input('isbn', sql.VarChar(20), isbn)
      .input('autor', sql.Int, idAutor)
      .input('editorial', sql.Int, idEditorial)
      .input('categoria', sql.Int, idCategoria)
      .input('precio', sql.Decimal(10, 2), price)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO Producto (
          codigo_producto, titulo, isbn, id_autor, id_editorial, id_categoria, precio, estado
        )
        OUTPUT INSERTED.id_producto
        VALUES (@codigo, @titulo, @isbn, @autor, @editorial, @categoria, @precio, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_producto);
    return res.status(201).json(mapProducto(row));
  } catch (err) {
    console.error('[productos] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Código o ISBN ya existe.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PUT /api/productos/:id */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Producto no encontrado');

    const body = req.body || {};
    const title = body.title != null || body.titulo != null
      ? String(body.title || body.titulo || '').trim()
      : existing.titulo;
    const isbn = body.isbn != null ? String(body.isbn).trim() : existing.isbn;
    // Código interno inmutable en edición
    const code = existing.codigo_producto;
    const price = body.price != null || body.precio != null
      ? Number(body.price ?? body.precio)
      : Number(existing.precio);

    if (!title) return fail(res, 400, 'El título es obligatorio.');
    if (!isbn) return fail(res, 400, 'El ISBN es obligatorio.');

    let idCategoria = existing.id_categoria;
    let idEditorial = existing.id_editorial;
    if (body.categoryId != null || body.id_categoria != null) {
      const resolved = await resolveCategoriaId(pool, body);
      if (!resolved) return fail(res, 400, 'Categoría inválida (id_categoria requerido).');
      idCategoria = resolved;
    }
    if (body.publisherId != null || body.id_editorial != null) {
      const resolved = await resolveEditorialId(pool, body);
      if (!resolved) return fail(res, 400, 'Editorial inválida (id_editorial requerido).');
      idEditorial = resolved;
    }

    let idAutor = existing.id_autor;
    if (body.authorId != null || body.id_autor != null || body.author != null || body.autor != null) {
      const resolved = await resolveAutorId(pool, body);
      if (!resolved) return fail(res, 400, 'Autor inválido o no indicado.');
      idAutor = resolved;
    }

    const estado =
      body.status != null || body.estado != null
        ? mapEstadoToDb(body.status || body.estado)
        : existing.estado;

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('codigo', sql.VarChar(50), code)
      .input('titulo', sql.VarChar(200), title)
      .input('isbn', sql.VarChar(20), isbn)
      .input('autor', sql.Int, idAutor)
      .input('editorial', sql.Int, idEditorial)
      .input('categoria', sql.Int, idCategoria)
      .input('precio', sql.Decimal(10, 2), price)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE Producto
        SET codigo_producto = @codigo,
            titulo = @titulo,
            isbn = @isbn,
            id_autor = @autor,
            id_editorial = @editorial,
            id_categoria = @categoria,
            precio = @precio,
            estado = @estado
        WHERE id_producto = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapProducto(row));
  } catch (err) {
    console.error('[productos] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Código o ISBN ya existe.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PATCH /api/productos/:id/estado — activar / desactivar (soft delete del FE) */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Producto no encontrado');

    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE Producto SET estado = @estado WHERE id_producto = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapProducto(row));
  } catch (err) {
    console.error('[productos] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * DELETE /api/productos/:id
 * Intenta borrado físico; si hay FKs (Inventario, etc.) desactiva (Inactivo).
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Producto no encontrado');

    try {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .query(`DELETE FROM Producto WHERE id_producto = @id`);
      return res.json({ success: true, data: { id: String(req.params.id), deleted: true } });
    } catch (fkErr) {
      if (fkErr.number === 547) {
        await pool
          .request()
          .input('id', sql.Int, Number(req.params.id))
          .input('estado', sql.VarChar(20), 'Inactivo')
          .query(`UPDATE Producto SET estado = @estado WHERE id_producto = @id`);
        const row = await fetchById(pool, req.params.id);
        return res.json({
          success: true,
          data: { ...mapProducto(row), deleted: false, softDeleted: true },
        });
      }
      throw fkErr;
    }
  } catch (err) {
    console.error('[productos] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
